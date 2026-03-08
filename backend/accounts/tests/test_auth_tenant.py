from django.test import TestCase
from accounts.models import CustomUser, Role, UserTenantMembership
from tenants.models import Tenant

class BasicAuthTenantTestCase(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(
            name='Test Institute', 
            slug='test-institute', 
            subdomain='test', 
            domain='test.ac.in'
        )
        self.role_student = Role.objects.create(name='student')
        
        self.user = CustomUser.objects.create_user(
            username='student01', 
            email='student01@test.ac.in', 
            password='testpassword123'
        )
        
        self.membership = UserTenantMembership.objects.create(
            user=self.user, 
            tenant=self.tenant, 
            role=self.role_student
        )

    def test_tenant_membership_creation(self):
        self.assertEqual(self.user.memberships.count(), 1)
        self.assertEqual(self.user.memberships.first().tenant.name, 'Test Institute')

    def test_unique_user_tenant_membership(self):
        # A user cannot have multiple parallel role records pointing to the same tenant under unique_together
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            UserTenantMembership.objects.create(
                user=self.user, 
                tenant=self.tenant, 
                role=self.role_student
            )
