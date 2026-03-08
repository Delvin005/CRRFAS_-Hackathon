from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.tenants.models import Tenant
from apps.campus.models import Campus, Building, Floor
from apps.academics.models import Department, DepartmentRoomPreference
from apps.resources.models import Resource
from apps.resources.services.room_allocator import rank_and_allocate_room

User = get_user_model()

def make_tenant(slug):
    return Tenant.objects.create(name=slug, slug=slug, institution_type='engineering')

def make_user(tenant, role='faculty', username=None):
    username = username or f'{role}_{tenant.slug}'
    return User.objects.create_user(
        username=username, password='pass1234',
        tenant=tenant, role=role
    )

class RoomAllocatorTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant('tt-resources-tenant')
        self.admin = make_user(self.tenant, 'tenant_admin', 'res_admin')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        
        self.campus = Campus.objects.create(tenant=self.tenant, name='Main')
        self.b1 = Building.objects.create(campus=self.campus, name='Tech Block')
        self.b2 = Building.objects.create(campus=self.campus, name='Science Block')
        
        self.f1 = Floor.objects.create(building=self.b1, number=1)
        self.f2 = Floor.objects.create(building=self.b2, number=1)
        
        self.dept = Department.objects.create(tenant=self.tenant, name='CS', code='CS')
        
        DepartmentRoomPreference.objects.create(
            department=self.dept,
            resource_type='classroom',
            preferred_building_name='Tech'
        )

        # Room 1: Fits exactly, in preferred building (Tech Block), no projector
        self.r1 = Resource.objects.create(
            tenant=self.tenant, floor=self.f1, name='Room 101', 
            resource_type='classroom', capacity=60, has_projector=False,
            status='available'
        )
        # Room 2: Way too large, in preferred building, has projector
        self.r2 = Resource.objects.create(
            tenant=self.tenant, floor=self.f1, name='Room 102', 
            resource_type='classroom', capacity=120, has_projector=True,
            status='available'
        )
        # Room 3: Small, not preferred building, has projector
        self.r3 = Resource.objects.create(
            tenant=self.tenant, floor=self.f2, name='Room 201', 
            resource_type='classroom', capacity=40, has_projector=True,
            status='available'
        )
        # Room 4: Fits exactly, not preferred building, has projector
        self.r4 = Resource.objects.create(
            tenant=self.tenant, floor=self.f2, name='Room 202', 
            resource_type='classroom', capacity=60, has_projector=True,
            status='available'
        )

    def test_allocate_capacity_filter(self):
        # Need 60. R3 (40) should be excluded.
        res = rank_and_allocate_room(self.tenant.id, capacity_needed=60)
        self.assertIsNotNone(res['allocated_room'])
        # R1 (60 cap, preferred building) maxes out both proximity and fit, so it should win
        self.assertEqual(res['allocated_room'].id, self.r1.id)

    def test_allocate_facility_filter(self):
        # Need 60 AND projector. R1 has capacity but no projector.
        # Should pick R4 (not preferred bldg, but perfect fit), or R2 (preferred bldg, but too big).
        # Let's see: 
        # R2 fit_score = max(0, 100 - (120-60)) = 40. Bld_score = +50. Total = 90.
        # R4 fit_score = max(0, 100 - (60-60)) = 100. Bld_score = 0. Total = 100.
        # So R4 should win.
        res = rank_and_allocate_room(
            self.tenant.id, capacity_needed=60, required_facilities=['projector']
        )
        self.assertEqual(res['allocated_room'].id, self.r4.id)

    def test_allocate_previous_history_boost(self):
        # We need 60 capacity, projector. R4 total=100, R2 total=90.
        # If we boost R2 with previous history (+75), R2 should win (165).
        res = rank_and_allocate_room(
            self.tenant.id, capacity_needed=60, required_facilities=['projector'],
            previously_used_room_ids=[self.r2.id]
        )
        self.assertEqual(res['allocated_room'].id, self.r2.id)
        self.assertIn("Previously used", res['explanation'])

    def test_allocate_api_endpoint(self):
        res = self.client.post('/api/resources/allocate/', {
            "capacity_needed": 60,
            "resource_type": "classroom",
            "required_facilities": ["projector"],
            "department_id": self.dept.id,
            "previously_used_room_ids": [self.r2.id]
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['allocated_room']['name'], 'Room 102')
        self.assertEqual(len(res.data['alternatives']), 1) # R4 is the only other candidate
