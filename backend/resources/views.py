import csv
import io
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from core.permissions import IsTenantObjOwner, RequireTenantAdminOrHigher
from .models import (
    ResourceCategory, ResourceTag, Resource, SubResourceUnit, 
    LabInstrument, RoomResourceMapping, MaintenanceSchedule, UtilizationLog
)
from .serializers import (
    ResourceCategorySerializer, ResourceTagSerializer, ResourceSerializer, 
    SubResourceUnitSerializer, LabInstrumentSerializer, RoomResourceMappingSerializer, 
    MaintenanceScheduleSerializer, UtilizationLogSerializer
)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class BaseResourceViewSet(viewsets.ModelViewSet):
    """
    Base viewset for resources with tenant-aware filtering.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantObjOwner]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend]

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)

        # Fallback: resolve tenant from the authenticated user's membership
        # This handles localhost dev and super_admin scenarios where hostname
        # doesn't match any tenant subdomain.
        if not tenant and self.request.user.is_authenticated:
            membership = self.request.user.memberships.filter(is_active=True).select_related('tenant').first()
            if membership:
                tenant = membership.tenant

        if not tenant:
            return self.queryset.none()

        model = self.queryset.model
        # Check if 'tenant' is a real database field, not just a property
        has_tenant_field = any(f.name == 'tenant' for f in model._meta.fields)

        if has_tenant_field:
            return self.queryset.filter(tenant=tenant)
        # SubResourceUnit and Maintenance links through Resource
        elif hasattr(model, 'resource'):
            return self.queryset.filter(resource__tenant=tenant)
        # RoomResourceMapping links through Room → Campus → Tenant
        elif model.__name__ == 'RoomResourceMapping':
            return self.queryset.filter(room__campus__tenant=tenant)

        return self.queryset.none()

    def perform_create(self, serializer):
        if hasattr(self.serializer_class.Meta.model, 'tenant'):
            serializer.save(tenant=self.request.tenant)
        else:
            serializer.save()

class ResourceCategoryViewSet(BaseResourceViewSet):
    queryset = ResourceCategory.objects.all()
    serializer_class = ResourceCategorySerializer

class ResourceTagViewSet(BaseResourceViewSet):
    queryset = ResourceTag.objects.all()
    serializer_class = ResourceTagSerializer

class ResourceViewSet(BaseResourceViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    filterset_fields = ['category', 'status', 'department', 'maintenance_status', 'requires_approval']

    @action(detail=True, methods=['GET'])
    def availability(self, request, pk=None):
        """
        Returns real-time availability for a resource and its sub-units.
        """
        resource = self.get_object()
        all_sub_units = resource.sub_units.all()
        bookable_sub_units = all_sub_units.filter(is_bookable=True)
        available_units = bookable_sub_units.filter(status='available').count()
        
        return Response({
            "resource_name": resource.name,
            "quantity_total": resource.quantity_total,
            "quantity_available": resource.quantity_available,
            "sub_units_managed": all_sub_units.exists(),
            "sub_units_total": all_sub_units.count(),
            "sub_units_bookable": bookable_sub_units.count(),
            "sub_units_available": available_units,
            "can_book_as_whole": resource.bookable_as_whole and resource.status == 'available'
        })

    @action(detail=False, methods=['POST'], permission_classes=[permissions.IsAuthenticated, RequireTenantAdminOrHigher])
    def bulk_upload(self, request):
        """
        Bulk creates resources from CSV.
        Expected headers: resource_code, name, category_name, department, quantity, status, unit_type
        """
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        tenant = self.request.tenant
        try:
            csv_file = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(csv_file))
            
            created_count = 0
            errors = []
            
            for row in reader:
                try:
                    cat_name = row.get('category_name')
                    category, _ = ResourceCategory.objects.get_or_create(tenant=tenant, name=cat_name)
                    
                    Resource.objects.update_or_create(
                        tenant=tenant,
                        resource_code=row.get('resource_code'),
                        defaults={
                            'name': row.get('name'),
                            'category': category,
                            'department': row.get('department', ''),
                            'quantity_total': int(row.get('quantity', 1)),
                            'quantity_available': int(row.get('quantity', 1)),
                            'status': row.get('status', 'available'),
                            'unit_type': row.get('unit_type', 'Unit')
                        }
                    )
                    created_count += 1
                except Exception as e:
                    errors.append(f"Row {row.get('resource_code')}: {str(e)}")

            return Response({"created": created_count, "errors": errors})
        except Exception as e:
            return Response({"error": f"Failed to parse CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

class SubResourceUnitViewSet(BaseResourceViewSet):
    queryset = SubResourceUnit.objects.all()
    serializer_class = SubResourceUnitSerializer
    filterset_fields = ['resource', 'status', 'is_bookable']

class MaintenanceScheduleViewSet(BaseResourceViewSet):
    queryset = MaintenanceSchedule.objects.all()
    serializer_class = MaintenanceScheduleSerializer
    filterset_fields = ['resource', 'maintenance_type', 'status']

    @action(detail=True, methods=['POST'])
    def complete(self, request, pk=None):
        """Marks maintenance as completed and updates resource status"""
        schedule = self.get_object()
        schedule.status = 'completed'
        schedule.save()
        
        # Optionally update resource status
        resource = schedule.resource
        resource.maintenance_status = 'good'
        if resource.status == 'maintenance':
            resource.status = 'available'
        resource.save()
        
        return Response({"status": "Maintenance completed and resource restored."})

class UtilizationLogViewSet(BaseResourceViewSet):
    queryset = UtilizationLog.objects.all()
    serializer_class = UtilizationLogSerializer
    filterset_fields = ['resource', 'user', 'usage_type']

class RoomResourceMappingViewSet(BaseResourceViewSet):
    queryset = RoomResourceMapping.objects.all()
    serializer_class = RoomResourceMappingSerializer
    filterset_fields = ['room', 'resource']
