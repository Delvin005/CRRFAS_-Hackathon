import io
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from tenants.models import Tenant
from accounts.models import CustomUser, Role, UserTenantMembership
from facilities.models import Campus, Building, Floor, RoomType, FacilityTag, Room

class FacilitiesAPITests(APITestCase):
    
    def setUp(self):
        # 1. Base Setup
        self.tenant = Tenant.objects.create(
            name="Test Tenant", slug="test1", domain="localhost", subdomain="test1", 
            contact_email="a@a.com", support_phone="123"
        )
        self.tenant2 = Tenant.objects.create(
            name="Other Tenant", slug="test2", domain="otherhost", subdomain="test2",
            contact_email="b@b.com", support_phone="456"
        )
        
        self.user = CustomUser.objects.create_user(email="admin@test.com", username="admin@test.com", password="password")
        self.role_super = Role.objects.create(name="super_admin", description="Admin")
        UserTenantMembership.objects.create(user=self.user, tenant=self.tenant, role=self.role_super)
        
        # 2. Authenticate
        self.client.force_authenticate(user=self.user)
        self.client.defaults['HTTP_X_TENANT_DOMAIN'] = "localhost"

        # 3. Create initial Facilities structural data for 'localhost' tenant
        self.campus = Campus.objects.create(tenant=self.tenant, name="Test Campus", code="TESTC")
        self.building = Building.objects.create(campus=self.campus, name="Building A", code="BA")
        self.floor = Floor.objects.create(building=self.building, floor_number=1, name="First Floor")
        self.room_type = RoomType.objects.create(tenant=self.tenant, name="Classroom")
        
        # 4. Create one initial room
        self.room = Room.objects.create(
            tenant=self.tenant,
            campus=self.campus,
            building=self.building,
            floor=self.floor,
            room_number="101",
            room_type=self.room_type,
            capacity=30
        )
        
        # 5. Create some test data for Tenant 2 to test isolation
        self.campus2 = Campus.objects.create(tenant=self.tenant2, name="Other Campus", code="OTHERC")
        self.building2 = Building.objects.create(campus=self.campus2, name="Building B", code="BB")
        self.room2 = Room.objects.create(
            tenant=self.tenant2, campus=self.campus2, building=self.building2,
            floor=Floor.objects.create(building=self.building2, floor_number=1, name="First Floor"),
            room_number="999", capacity=90
        )

    def test_list_campuses_tenant_isolated(self):
        """Ensure users only see Campuses within their requested X-Tenant-Domain header"""
        url = reverse('campus-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming pagination is active, results are in ['results']
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['name'], "Test Campus")
        
    def test_filter_rooms_by_building(self):
        """Verify django-filter works successfully via querystrings"""
        url = f"{reverse('room-list')}?building={self.building.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results'] if 'results' in response.data else response.data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['room_number'], "101")
        
    def test_room_csv_bulk_upload(self):
        """Verify the POST /bulk_upload/ endpoint successfully parses CSV and generates Rooms"""
        csv_content = (
            "building_code,floor_number,room_number,room_name,room_type_name,capacity,department,status\n"
            "BA,1,102,Chem Lab,Laboratory,45,Science,available\n"
            "BA,1,103,Physics Lab,Laboratory,40,Science,maintenance\n"
        ).encode('utf-8')
        
        csv_file = SimpleUploadedFile("rooms.csv", csv_content, content_type="text/csv")
        
        url = reverse('room-bulk-upload')
        response = self.client.post(url, {'file': csv_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Successfully processed 2 rooms", response.data['message'])
        
        # Verify they exist in the DB
        self.assertTrue(Room.objects.filter(room_number="102", building=self.building).exists())
        self.assertTrue(Room.objects.filter(room_number="103", status="maintenance").exists())
