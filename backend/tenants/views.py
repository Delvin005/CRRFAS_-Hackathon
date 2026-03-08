"""
POST /api/tenants/provision/

Called by the frontend immediately after Razorpay payment succeeds.
Creates the tenant, enables the purchased feature modules,
creates the admin user, and returns a JWT token pair so the frontend
can redirect straight to the dashboard without requiring a second login.

Request body:
{
    "institution_name": "MIT India Campus",
    "subdomain": "mit-india",
    "contact_email": "admin@mit.edu",
    "admin_full_name": "Dr. Jane Smith",
    "password": "SecurePass123",
    "primary_color": "#0DF5E3",
    "modules": ["core", "facilities", "academics"]   // module IDs from frontend cart
}
"""
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from tenants.models import Tenant, FeatureTag
from accounts.models import CustomUser, Role, UserTenantMembership


# Maps frontend module IDs → FeatureTag names stored in the DB
MODULE_TAG_MAP = {
    'core':          'core_platform',
    'facilities':    'facility_management',
    'bookings':      'booking_system',
    'academics':     'academic_management',
    'resources':     'resource_management',
    'research':      'research_module',
    'alumni':        'alumni_module',
    'analytics':     'analytics_dashboard',
}


class ProvisionTenantView(APIView):
    """Create a new tenant, enable purchased modules, and register the admin user."""
    permission_classes = [AllowAny]

    @transaction.atomic
    def post(self, request):
        data = request.data

        # ── 1. Validate required fields ──────────────────────────────────────
        required = ['institution_name', 'subdomain', 'contact_email',
                    'admin_full_name', 'password']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        subdomain = data['subdomain'].lower().strip()
        email = data['contact_email'].lower().strip()
        modules = data.get('modules', ['core'])  # at least core

        # ── 2. Check uniqueness ───────────────────────────────────────────────
        if Tenant.objects.filter(subdomain=subdomain).exists():
            return Response(
                {'error': f'Subdomain "{subdomain}" is already taken.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if CustomUser.objects.filter(email=email).exists():
            return Response(
                {'error': f'An account with this email already exists.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── 3. Create the Tenant ──────────────────────────────────────────────
        tenant = Tenant.objects.create(
            name=data['institution_name'],
            slug=subdomain,
            subdomain=subdomain,
            domain=f'{subdomain}.crrfas.edu',
            contact_email=email,
            support_phone='',
            primary_color=data.get('primary_color', '#0DF5E3'),
            is_active=True,
        )

        # ── 4. Enable purchased feature modules ───────────────────────────────
        for module_id in modules:
            tag_name = MODULE_TAG_MAP.get(module_id, module_id)
            feature_tag, _ = FeatureTag.objects.get_or_create(
                name=tag_name,
                defaults={'description': f'Auto-created for module: {module_id}'}
            )
            tenant.enabled_features.add(feature_tag)

        # ── 5. Create the Tenant Admin user ──────────────────────────────────
        name_parts = data['admin_full_name'].strip().split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        user = CustomUser.objects.create_user(
            username=email,
            email=email,
            password=data['password'],
            first_name=first_name,
            last_name=last_name,
        )

        # ── 6. Assign Tenant Admin role ───────────────────────────────────────
        admin_role, _ = Role.objects.get_or_create(
            name='tenant_admin',
            defaults={'description': 'Administrator for a tenant institution'}
        )
        UserTenantMembership.objects.create(
            user=user,
            tenant=tenant,
            role=admin_role,
            is_active=True,
        )

        # ── 7. Issue JWT tokens so frontend can log in immediately ────────────
        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Tenant provisioned successfully.',
            'tenant': {
                'id': tenant.id,
                'name': tenant.name,
                'subdomain': tenant.subdomain,
                'enabled_modules': modules,
            },
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.get_full_name(),
                'role': 'tenant_admin',
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

class TenantDetailView(APIView):
    """Fetch tenant branding and details based on subdomain."""
    permission_classes = [AllowAny]

    def get(self, request):
        subdomain = request.query_params.get('subdomain')
        if not subdomain:
            return Response({'error': 'subdomain parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)
            
            # Get enabled module DB tags and convert them back to the frontend IDs (like 'core', 'facilities', etc.)
            db_modules = list(tenant.enabled_features.values_list('name', flat=True))
            reverse_module_map = {v: k for k, v in MODULE_TAG_MAP.items()}
            frontend_modules = [reverse_module_map.get(m, m) for m in db_modules]

            logo_url = request.build_absolute_uri(tenant.logo.url) if tenant.logo else None

            return Response({
                'id': tenant.id,
                'name': tenant.name,
                'subdomain': tenant.subdomain,
                'primary_color': tenant.primary_color,
                'secondary_color': tenant.secondary_color,
                'theme': tenant.theme,
                'logo': logo_url,
                'enabled_modules': frontend_modules,
                'isSpecific': True
            })
        except Tenant.DoesNotExist:
            return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)


from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from core.permissions import RequireTenantAdminOrHigher
from rest_framework.parsers import MultiPartParser, FormParser

class TenantUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = ['name', 'primary_color', 'secondary_color', 'theme', 'logo']

class TenantUpdateView(APIView):
    """Update settings and branding for the current tenant."""
    permission_classes = [IsAuthenticated, RequireTenantAdminOrHigher]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        tenant = request.tenant
        if not tenant:
            return Response({'error': 'No active tenant context found for this request.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TenantUpdateSerializer(tenant, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logo_url = request.build_absolute_uri(tenant.logo.url) if tenant.logo else None
            return Response({
                'message': 'Settings updated successfully.',
                'tenant': {
                    'name': tenant.name,
                    'primary_color': tenant.primary_color,
                    'secondary_color': tenant.secondary_color,
                    'logo': logo_url
                }
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
