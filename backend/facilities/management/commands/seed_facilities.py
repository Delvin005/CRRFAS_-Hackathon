import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from tenants.models import Tenant
from facilities.models import Campus, Building, Floor, RoomType, FacilityTag, Room

class Command(BaseCommand):
    help = 'Seeds the database with basic campus structural data for the Localhost Tenant'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Seeding Facilities Data...'))

        # Get our default development tenant
        tenant = Tenant.objects.filter(domain='localhost').first()
        if not tenant:
            self.stdout.write(self.style.ERROR('Tenant "localhost" not found. Run seed_rbac first.'))
            return

        # 1. Create Campus
        campus, _ = Campus.objects.get_or_create(
            tenant=tenant,
            code='MAIN',
            defaults={
                'name': 'Main University Campus',
                'description': 'The primary higher-education facility located downtown.',
                'address': '123 University Ave, Tech City, TX 78000',
                'contact_email': 'facilities@maincampus.edu',
            }
        )

        # 2. Create Buildings
        sci_building, _ = Building.objects.get_or_create(
            campus=campus,
            code='SCI',
            defaults={
                'name': 'Science & Research Block',
                'description': 'Main building for biology, chemistry, and physics departments.',
                'floors': 3,
                'accessibility_flags': {'wheelchair': True, 'elevators': 2},
                'status': 'active'
            }
        )

        lib_building, _ = Building.objects.get_or_create(
            campus=campus,
            code='LIB',
            defaults={
                'name': 'Central Library',
                'description': 'Four-story library with study rooms and computer labs.',
                'floors': 4,
                'accessibility_flags': {'wheelchair': True, 'elevators': 4},
                'status': 'active'
            }
        )

        # 3. Create Floors
        sci_ground, _ = Floor.objects.get_or_create(building=sci_building, floor_number=1, defaults={'name': 'Ground Floor'})
        sci_second, _ = Floor.objects.get_or_create(building=sci_building, floor_number=2, defaults={'name': 'Second Floor'})
        lib_ground, _ = Floor.objects.get_or_create(building=lib_building, floor_number=1, defaults={'name': 'Main Atrium'})

        # 4. Create Room Types
        type_class, _ = RoomType.objects.get_or_create(tenant=tenant, name='Classroom', defaults={'description': 'Standard tiered or flat classroom.'})
        type_lab, _ = RoomType.objects.get_or_create(tenant=tenant, name='Laboratory', defaults={'description': 'Specialized science or computer lab.'})
        type_study, _ = RoomType.objects.get_or_create(tenant=tenant, name='Study Room', defaults={'description': 'Small quiet room for group discussions.'})

        # 5. Create Facility Tags (Amenities)
        tag_proj, _ = FacilityTag.objects.get_or_create(tenant=tenant, name='4K Projector', defaults={'icon': 'video'})
        tag_board, _ = FacilityTag.objects.get_or_create(tenant=tenant, name='Smart Whiteboard', defaults={'icon': 'edit'})
        tag_pc, _ = FacilityTag.objects.get_or_create(tenant=tenant, name='Desktop PCs', defaults={'icon': 'laptop'})
        tag_chem, _ = FacilityTag.objects.get_or_create(tenant=tenant, name='Fume Hoods', defaults={'icon': 'flask'})

        # 6. Create Rooms
        # Science Lab
        lab101, created = Room.objects.get_or_create(
            building=sci_building,
            room_number='101',
            defaults={
                'tenant': tenant,
                'campus': campus,
                'floor': sci_ground,
                'name': 'Biology Intro Lab',
                'room_type': type_lab,
                'capacity': 30,
                'status': 'available',
                'department': 'Biology',
                'accessibility_flags': {'wheelchair_desks': 2}
            }
        )
        if created:
            lab101.available_facilities.add(tag_proj, tag_chem, tag_board)

        # Science Classroom
        class201, created = Room.objects.get_or_create(
            building=sci_building,
            room_number='201',
            defaults={
                'tenant': tenant,
                'campus': campus,
                'floor': sci_second,
                'name': 'Physics Theory Hall',
                'room_type': type_class,
                'capacity': 80,
                'status': 'available',
                'department': 'Physics'
            }
        )
        if created:
            class201.available_facilities.add(tag_proj, tag_board)

        # Library Study Room
        studyA, created = Room.objects.get_or_create(
            building=lib_building,
            room_number='A1',
            defaults={
                'tenant': tenant,
                'campus': campus,
                'floor': lib_ground,
                'name': 'Group Study Alpha',
                'room_type': type_study,
                'capacity': 6,
                'status': 'available',
                'department': 'General'
            }
        )
        if created:
            studyA.available_facilities.add(tag_pc, tag_board)

        self.stdout.write(self.style.SUCCESS('Successfully seeded Campus, Building, Floor, RoomType, FacilityTag, and Room models.'))
