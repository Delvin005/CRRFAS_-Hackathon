from rest_framework import viewsets, permissions
from .models import Department, Course, TimetableSlot
from .serializers import DepartmentSerializer, CourseSerializer, TimetableSlotSerializer
from core.permissions import IsTenantObjOwner, RequireRole
from facilities.views import BaseTenantViewSet

class DepartmentViewSet(BaseTenantViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    # Only Academic Admin or higher can manage departments
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), RequireRole()]
        return super().get_permissions()

    def check_permissions(self, request):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.allowed_roles = ['super_admin', 'tenant_admin', 'academic_admin']
        super().check_permissions(request)

class CourseViewSet(BaseTenantViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), RequireRole()]
        return super().get_permissions()

    def check_permissions(self, request):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.allowed_roles = ['super_admin', 'tenant_admin', 'academic_admin']
        super().check_permissions(request)

class TimetableSlotViewSet(BaseTenantViewSet):
    queryset = TimetableSlot.objects.all()
    serializer_class = TimetableSlotSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), RequireRole()]
        return super().get_permissions()

    def check_permissions(self, request):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.allowed_roles = ['super_admin', 'tenant_admin', 'academic_admin']
        super().check_permissions(request)
