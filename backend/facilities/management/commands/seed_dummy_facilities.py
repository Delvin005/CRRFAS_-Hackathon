from django.core.management.base import BaseCommand
from tenants.models import Tenant
from facilities.models import Campus, Building, Floor, Room
from resources.models import ResourceCategory, Resource, SubResourceUnit

class Command(BaseCommand):
    help = 'Seeds dummy facilities and resources for testing bookings.'

    def handle(self, *args, **kwargs):
        tenant = Tenant.objects.first()
        if not tenant:
            self.stdout.write(self.style.ERROR('No tenant found. Please create one first.'))
            return

        # Create Campus
        campus, _ = Campus.objects.get_or_create(
            tenant=tenant,
            name='Main Campus',
            defaults={
                'address': '123 University Ave',
                'contact_email': 'main@university.edu',
                'contact_phone': '555-0101'
            }
        )
        
        # Create Building
        building, _ = Building.objects.get_or_create(
            campus=campus,
            name='Engineering Block',
            defaults={
                'code': 'ENG-01',
                'description': 'Main engineering facility'
            }
        )

        # Create Floor
        floor, _ = Floor.objects.get_or_create(
            building=building,
            floor_number=1,
            defaults={
                'name': 'Ground Floor'
            }
        )

        # Create Rooms
        Room.objects.get_or_create(
            tenant=tenant,
            floor=floor,
            campus=campus,
            building=building,
            room_number='101A',
            defaults={
                'name': 'Robotics Lab',
                'capacity': 30,
                'is_active': True
            }
        )
        Room.objects.get_or_create(
            tenant=tenant,
            floor=floor,
            campus=campus,
            building=building,
            room_number='102B',
            defaults={
                'name': 'Seminar Hall',
                'capacity': 100,
                'is_active': True
            }
        )

        # Create Resource Category & Resource
        cat, _ = ResourceCategory.objects.get_or_create(
            tenant=tenant,
            name='AV Equipment'
        )

        res, _ = Resource.objects.get_or_create(
            tenant=tenant,
            category=cat,
            name='4K Projector',
            defaults={
                'resource_code': 'PROJ-01',
                'quantity_total': 5,
                'quantity_available': 4
            }
        )
        
        # Create Sub Unit
        SubResourceUnit.objects.get_or_create(
            resource=res,
            unit_identifier='PROJ-01-A',
            defaults={
                'status': 'available'
            }
        )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded dummy facilities and resources for {tenant.name}!'))
