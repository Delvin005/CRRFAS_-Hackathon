from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from tenants.models import Tenant
from accounts.models import CustomUser, Role, UserTenantMembership
from resources.models import Resource, ResourceCategory, SubResourceUnit, MaintenanceSchedule
from facilities.models import Campus, Building, Floor, Room

class ResourceAPITests(APITestCase):
    def setUp(self):
        # Create Tenants
        self.tenant1 = Tenant.objects.create(name="College A", subdomain="collegea", slug="college-a")
        self.tenant2 = Tenant.objects.create(name="College B", subdomain="collegeb", slug="college-b")

        # Create Roles
        self.role_admin, _ = Role.objects.get_or_create(name='tenant_admin')

        # Create Users
        self.user1 = CustomUser.objects.create_user(username="admin1", email="admin1@a.com", password="password123")
        self.user2 = CustomUser.objects.create_user(username="admin2", email="admin2@b.com", password="password123")

        # Create Memberships
        UserTenantMembership.objects.create(user=self.user1, tenant=self.tenant1, role=self.role_admin)
        UserTenantMembership.objects.create(user=self.user2, tenant=self.tenant2, role=self.role_admin)

        # Create Infrastructure for Tenant 1
        self.campus1 = Campus.objects.create(tenant=self.tenant1, name="Main Campus", code="MAIN", address="Street 1")
        self.building1 = Building.objects.create(campus=self.campus1, name="Science Block", code="SCI")
        self.floor1 = Floor.objects.create(building=self.building1, floor_number=1, name="1st Floor")
        self.room1 = Room.objects.create(tenant=self.tenant1, campus=self.campus1, building=self.building1, floor=self.floor1, room_number="101")

        # Create categories
        self.cat_it = ResourceCategory.objects.create(tenant=self.tenant1, name="IT Equipment")
        
        # Create a resource for Tenant 1
        self.resource1 = Resource.objects.create(
            tenant=self.tenant1,
            resource_code="SYS-01",
            name="Computer Lab A",
            category=self.cat_it,
            room=self.room1,
            quantity_total=10,
            quantity_available=10
        )

    def test_tenant_isolation(self):
        """Verify that user2 cannot see resources of tenant1"""
        self.client.force_authenticate(user=self.user2)
        url = reverse('resource-list')
        
        # Mocking the tenant attribute as the middleware would
        self.client.defaults['HTTP_X_TENANT_DOMAIN'] = 'collegeb'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_resource_availability_action(self):
        """Verify the custom availability action"""
        self.client.force_authenticate(user=self.user1)
        url = reverse('resource-availability', args=[self.resource1.id])
        
        # Add a sub-unit
        SubResourceUnit.objects.create(resource=self.resource1, unit_identifier="PC-01", status="available")
        SubResourceUnit.objects.create(resource=self.resource1, unit_identifier="PC-02", status="maintenance", is_bookable=False)
        
        self.client.defaults['HTTP_X_TENANT_DOMAIN'] = 'collegea'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['sub_units_total'], 2)
        # PC-02 is not bookable, so it shouldn't be counted in availability logic if we filter by is_bookable
        # In our view, we count 'status=available' among 'is_bookable=True'
        self.assertEqual(response.data['sub_units_available'], 1)

    def test_maintenance_completion(self):
        """Verify maintenance completion logic"""
        self.client.force_authenticate(user=self.user1)
        
        self.resource1.status = 'maintenance'
        self.resource1.maintenance_status = 'critical'
        self.resource1.save()
        
        schedule = MaintenanceSchedule.objects.create(
            resource=self.resource1,
            maintenance_type='repair',
            start_time='2024-01-01T10:00:00Z',
            end_time='2024-01-01T12:00:00Z',
            status='scheduled'
        )
        
        url = reverse('maintenance-schedule-complete', args=[schedule.id])
        self.client.defaults['HTTP_X_TENANT_DOMAIN'] = 'collegea'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.resource1.refresh_from_db()
        self.assertEqual(self.resource1.status, 'available')
        self.assertEqual(self.resource1.maintenance_status, 'good')
        
    def test_bulk_upload_validation(self):
         self.client.force_authenticate(user=self.user1)
         url = reverse('resource-bulk-upload')
         
         import io
         csv_content = "resource_code,name,category_name,quantity,status\nLAB-01,Microscope,Lab Gear,5,available"
         file = io.BytesIO(csv_content.encode('utf-8'))
         file.name = 'test.csv'
         
         self.client.defaults['HTTP_X_TENANT_DOMAIN'] = 'collegea'
         response = self.client.post(url, {'file': file}, format='multipart')
         self.assertEqual(response.status_code, status.HTTP_200_OK)
         self.assertEqual(response.data['created'], 1)
         self.assertTrue(Resource.objects.filter(resource_code='LAB-01', tenant=self.tenant1).exists())
