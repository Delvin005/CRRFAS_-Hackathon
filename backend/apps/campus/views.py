from rest_framework import viewsets, permissions
from .models import Campus, Building, Floor
from .serializers import CampusSerializer, BuildingSerializer, FloorSerializer

class TenantScopedMixin:
    """Filter queryset to current user's tenant."""
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'super_admin':
            return qs
        return qs.filter(tenant=user.tenant)

class CampusViewSet(TenantScopedMixin, viewsets.ModelViewSet):
    queryset = Campus.objects.select_related('tenant').all()
    serializer_class = CampusSerializer
    permission_classes = [permissions.IsAuthenticated]

class BuildingViewSet(viewsets.ModelViewSet):
    queryset = Building.objects.select_related('campus').all()
    serializer_class = BuildingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return self.queryset
        return self.queryset.filter(campus__tenant=user.tenant)

class FloorViewSet(viewsets.ModelViewSet):
    queryset = Floor.objects.select_related('building').all()
    serializer_class = FloorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return self.queryset
        return self.queryset.filter(building__campus__tenant=user.tenant)
