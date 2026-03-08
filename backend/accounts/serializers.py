from rest_framework import serializers
from .models import CustomUser, Role, UserTenantMembership

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']

class UserTenantMembershipSerializer(serializers.ModelSerializer):
    role = serializers.SlugRelatedField(slug_field='name', read_only=True)
    tenant = serializers.StringRelatedField()
    tenant_subdomain = serializers.CharField(source='tenant.subdomain', read_only=True)

    class Meta:
        model = UserTenantMembership
        fields = ['id', 'tenant', 'tenant_subdomain', 'role', 'is_active', 'created_at']

class CustomUserSerializer(serializers.ModelSerializer):
    memberships = UserTenantMembershipSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'is_active', 'campus_scope', 'memberships']
        read_only_fields = ['email']

class AssignRoleSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role_id = serializers.IntegerField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    campus_scope = serializers.CharField(max_length=255, required=False, allow_blank=True)
