from rest_framework import permissions

class RequireTenantAdminOrHigher(permissions.BasePermission):
    message = "You must be a Tenant Admin to perform this action."

    def has_permission(self, request, view):
        if not request.user.is_authenticated or not hasattr(request, 'tenant') or getattr(request, 'tenant') is None:
            return False
            
        if request.user.is_superuser:
            return True
            
        membership = request.user.memberships.filter(tenant=request.tenant, is_active=True).first()
        if membership and membership.role.name in ['super_admin', 'tenant_admin']:
            return True
            
        return False

class RequireRole(permissions.BasePermission):
    """
    Subclass this or set `allowed_roles` on the view to use.
    Example: allowed_roles = ['academic_admin', 'facility_manager']
    """
    allowed_roles = []
    message = "You do not have the necessary role to access this."

    def has_permission(self, request, view):
        if not request.user.is_authenticated or not hasattr(request, 'tenant') or not request.tenant:
            return False
            
        if request.user.is_superuser:
            return True
            
        membership = request.user.memberships.filter(tenant=request.tenant, is_active=True).first()
        required = getattr(view, 'allowed_roles', self.allowed_roles)
        
        return membership and membership.role.name in required

class IsTenantObjOwner(permissions.BasePermission):
    """
    Ensures users can only query models belonging to their resolved tenant context.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'tenant'):
            return obj.tenant == request.tenant
        return False
