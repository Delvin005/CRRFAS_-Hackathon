from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import CustomUser, Role, UserTenantMembership
from .serializers import CustomUserSerializer, AssignRoleSerializer, RoleSerializer
from core.permissions import RequireTenantAdminOrHigher

class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserViewSet(viewsets.ModelViewSet):
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Global tenant isolation: Enforces standard users only see profiles from their tenant.
        """
        tenant = getattr(self.request, 'tenant', None)
        if not tenant:
            return CustomUser.objects.none()
            
        if self.request.user.is_superuser:
            return CustomUser.objects.all()
            
        return CustomUser.objects.filter(memberships__tenant=tenant)

    @action(detail=False, methods=['GET'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['POST'], permission_classes=[permissions.IsAuthenticated, RequireTenantAdminOrHigher])
    def assign_role(self, request):
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        tenant = getattr(request, 'tenant', None)
        
        if not tenant:
            return Response({"detail": "No tenant context found."}, status=400)
            
        try:
            role = Role.objects.get(id=data['role_id'])
        except Role.DoesNotExist:
            return Response({"detail": "Role not found."}, status=404)
            
        # Get or create user
        user, created = CustomUser.objects.get_or_create(
            email=data['email'],
            defaults={
                'username': data['email'],
                'first_name': data['first_name'],
                'last_name': data['last_name'],
                'campus_scope': data.get('campus_scope', '')
            }
        )
        if created:
            user.set_unusable_password() # They must reset it or use SSO
            user.save()
            
        # Create or update membership
        membership, m_created = UserTenantMembership.objects.update_or_create(
            user=user,
            tenant=tenant,
            defaults={'role': role, 'is_active': True}
        )
        
        return Response({
            "detail": "Role assigned successfully.",
            "user_id": user.id,
            "created": created
        })
