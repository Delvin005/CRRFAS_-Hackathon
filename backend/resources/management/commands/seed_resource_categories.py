"""
Management command to seed default Resource Categories for all tenants.

Run: python manage.py seed_resource_categories
"""

from django.core.management.base import BaseCommand
from tenants.models import Tenant
from resources.models import ResourceCategory

DEFAULT_CATEGORIES = [
    {
        'name': 'Computer Lab',
        'description': 'Labs with individual computer systems for student use. Supports per-unit (per-system) booking.',
    },
    {
        'name': 'Laboratory',
        'description': 'Science and research labs with specialized instruments such as microscopes, centrifuges, etc.',
    },
    {
        'name': 'Auditorium',
        'description': 'Large-capacity halls for events, seminars, and conferences with AV systems.',
    },
    {
        'name': 'Seminar Hall',
        'description': 'Medium-capacity seminar and presentation halls with projectors and whiteboards.',
    },
    {
        'name': 'Sports Equipment',
        'description': 'Sporting gear, courts, and athletic equipment available for student and staff use.',
    },
    {
        'name': 'Conference Room',
        'description': 'Small meeting rooms with video-conferencing capability for departmental use.',
    },
    {
        'name': 'AV Equipment',
        'description': 'Audio-visual equipment including projectors, microphones, speakers, and cameras.',
    },
    {
        'name': 'Library Resources',
        'description': 'Library reading devices, e-book readers, and other study aids.',
    },
    {
        'name': 'Medical Equipment',
        'description': 'Medical and first-aid equipment available at the health center.',
    },
    {
        'name': 'General Equipment',
        'description': 'Miscellaneous equipment and tools not covered by other categories.',
    },
]


class Command(BaseCommand):
    help = 'Seeds default Resource Categories for all tenants in the system.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Seed only for a specific tenant subdomain (optional).',
        )

    def handle(self, *args, **options):
        specific_subdomain = options.get('tenant')

        if specific_subdomain:
            tenants = Tenant.objects.filter(subdomain=specific_subdomain)
            if not tenants.exists():
                self.stderr.write(self.style.ERROR(f'No tenant found with subdomain: {specific_subdomain}'))
                return
        else:
            tenants = Tenant.objects.all()

        if not tenants.exists():
            self.stderr.write(self.style.WARNING('No tenants found in the database. Create a tenant first.'))
            return

        total_created = 0

        for tenant in tenants:
            self.stdout.write(f'\n[*] Seeding categories for tenant: {self.style.NOTICE(tenant.name)}')
            created_count = 0

            for cat_data in DEFAULT_CATEGORIES:
                obj, created = ResourceCategory.objects.get_or_create(
                    tenant=tenant,
                    name=cat_data['name'],
                    defaults={'description': cat_data['description']},
                )
                if created:
                    self.stdout.write(f'   [+] Created: {cat_data["name"]}')
                    created_count += 1
                else:
                    self.stdout.write(f'   [=] Skipped (already exists): {cat_data["name"]}')

            total_created += created_count
            self.stdout.write(self.style.SUCCESS(f'   --> {created_count} categories created for {tenant.name}'))

        self.stdout.write(self.style.SUCCESS(f'\nDone! Total categories created: {total_created}'))
