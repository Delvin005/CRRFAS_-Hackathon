import csv
import io
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from .models import Campus, Building, Floor, RoomType, FacilityTag, Room, Resource
from .serializers import (
    CampusSerializer, BuildingSerializer, FloorSerializer, 
    RoomTypeSerializer, FacilityTagSerializer, RoomSerializer, ResourceSerializer
)
from core.permissions import IsTenantObjOwner, RequireTenantAdminOrHigher

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class BaseTenantViewSet(viewsets.ModelViewSet):
    """
    Base viewset that filters queryset by current tenant
    and attaches tenant during creation.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantObjOwner]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)

        # Fallback: resolve tenant from the authenticated user's membership.
        # This handles localhost dev where hostname doesn't match any subdomain.
        if not tenant and self.request.user.is_authenticated:
            membership = self.request.user.memberships.filter(is_active=True).select_related('tenant').first()
            if membership:
                tenant = membership.tenant

        if not tenant:
            return self.queryset.none()

        # Facilities logic depends on relations back to tenant
        model = self.queryset.model
        model_name = model.__name__

        if model_name == 'Building':
            return self.queryset.filter(campus__tenant=tenant)
        elif model_name == 'Floor':
            return self.queryset.filter(building__campus__tenant=tenant)
        elif hasattr(model, 'tenant'):
            # Only use direct 'tenant' filter if it's a model field, not a property
            # Room, Campus, RoomType, etc. have 'tenant' as a foreign key
            return self.queryset.filter(tenant=tenant)

        return self.queryset.none()

    def perform_create(self, serializer):
        if hasattr(self.queryset.model, 'tenant'):
            serializer.save(tenant=self.request.tenant)
        else:
            serializer.save()

class CampusViewSet(BaseTenantViewSet):
    queryset = Campus.objects.all()
    serializer_class = CampusSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), RequireTenantAdminOrHigher()]
        return super().get_permissions()

class BuildingViewSet(BaseTenantViewSet):
    queryset = Building.objects.all()
    serializer_class = BuildingSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['campus', 'status']

class FloorViewSet(BaseTenantViewSet):
    queryset = Floor.objects.all()
    serializer_class = FloorSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['building']

class RoomTypeViewSet(BaseTenantViewSet):
    queryset = RoomType.objects.all()
    serializer_class = RoomTypeSerializer

class FacilityTagViewSet(BaseTenantViewSet):
    queryset = FacilityTag.objects.all()
    serializer_class = FacilityTagSerializer

class RoomViewSet(BaseTenantViewSet):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['campus', 'building', 'floor', 'room_type', 'status', 'department']

    @action(detail=False, methods=['GET'])
    def csv_template(self, request):
        """Returns a generic CSV template format for room bulk upload"""
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="room_upload_template.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['building_code', 'floor_number', 'room_number', 'room_name', 'room_type_name', 'capacity', 'department', 'status'])
        writer.writerow(['MAIN', '1', '101A', 'Biology Lab', 'Laboratory', '30', 'Science', 'available'])
        
        return response

    @action(detail=False, methods=['POST'], permission_classes=[permissions.IsAuthenticated, RequireTenantAdminOrHigher])
    def bulk_upload(self, request):
        """
        Parses an uploaded CSV file and bulk creates Room instances.
        Required CSV headers: building_code, floor_number, room_number, room_name, room_type_name, capacity, department, status
        """
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        if not file.name.endswith('.csv'):
            return Response({"error": "File must be a CSV"}, status=status.HTTP_400_BAD_REQUEST)

        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response({"error": "Tenant context missing"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            csv_file = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(csv_file))
            
            created_count = 0
            errors = []
            
            for row in reader:
                try:
                    buildingCode = row.get('building_code')
                    floorNumber = row.get('floor_number')
                    roomNumber = row.get('room_number')
                    
                    if not all([buildingCode, floorNumber, roomNumber]):
                        errors.append(f"Row missing required base identifiers: {row}")
                        continue
                        
                    building = Building.objects.filter(campus__tenant=tenant, code=buildingCode).first()
                    if not building:
                        errors.append(f"Building {buildingCode} not found in Tenant")
                        continue
                        
                    floor = Floor.objects.filter(building=building, floor_number=floorNumber).first()
                    if not floor:
                        errors.append(f"Floor {floorNumber} not found in Building {buildingCode}")
                        continue
                        
                    room_type_name = row.get('room_type_name', 'Classroom')
                    room_type, _ = RoomType.objects.get_or_create(tenant=tenant, name=room_type_name)
                    
                    Room.objects.update_or_create(
                        tenant=tenant,
                        building=building,
                        room_number=roomNumber,
                        defaults={
                            'campus': building.campus,
                            'floor': floor,
                            'name': row.get('room_name', ''),
                            'room_type': room_type,
                            'capacity': int(row.get('capacity') or 30),
                            'department': row.get('department', ''),
                            'status': row.get('status', 'available')
                        }
                    )
                    created_count += 1
                except Exception as row_error:
                    errors.append(f"Failed processing row {row}: {str(row_error)}")
                    
            return Response({
                "message": f"Successfully processed {created_count} rooms.",
                "errors": errors
            })
            
        except Exception as e:
            return Response({"error": f"Failed to parse CSV: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResourceViewSet(BaseTenantViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
