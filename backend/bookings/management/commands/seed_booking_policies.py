"""
Seeds default BookingPolicyRules for all tenants.

Run: python manage.py seed_booking_policies
"""

from django.core.management.base import BaseCommand
from tenants.models import Tenant
from bookings.models import BookingPolicyRule

DEFAULT_POLICIES = [
    {
        'rule_type': 'role_based',
        'applies_to_roles': ['student'],
        'applies_to_booking_types': [],
        'after_hours_only': False,
        'requires_approval': True,
        'approver_role': 'facility_manager',
        'description': 'All student booking requests require approval.',
    },
    {
        'rule_type': 'role_based',
        'applies_to_roles': ['external_user'],
        'applies_to_booking_types': [],
        'after_hours_only': False,
        'requires_approval': True,
        'approver_role': 'tenant_admin',
        'description': 'All external user requests require admin approval.',
    },
    {
        'rule_type': 'booking_type_based',
        'applies_to_roles': [],
        'applies_to_booking_types': ['external_conference', 'inter_college_event'],
        'after_hours_only': False,
        'requires_approval': True,
        'approver_role': 'tenant_admin',
        'description': 'External conferences and inter-college events require Tenant Admin approval.',
    },
    {
        'rule_type': 'booking_type_based',
        'applies_to_roles': [],
        'applies_to_booking_types': ['sports_booking'],
        'after_hours_only': False,
        'requires_approval': True,
        'approver_role': 'facility_manager',
        'description': 'Sports bookings require Facility Manager approval.',
    },
    {
        'rule_type': 'time_based',
        'applies_to_roles': [],
        'applies_to_booking_types': [],
        'after_hours_only': True,
        'requires_approval': True,
        'approver_role': 'facility_manager',
        'description': 'Any booking outside 8am-6pm on weekdays requires approval.',
    },
    {
        'rule_type': 'role_based',
        'applies_to_roles': ['research_scholar'],
        'applies_to_booking_types': ['research_access_request'],
        'after_hours_only': False,
        'requires_approval': True,
        'approver_role': 'facility_manager',
        'description': 'Research scholars requesting lab access require approval.',
    },
]


class Command(BaseCommand):
    help = 'Seeds default BookingPolicyRules for all tenants.'

    def add_arguments(self, parser):
        parser.add_argument('--tenant', type=str, help='Seed only for a specific tenant subdomain.')

    def handle(self, *args, **options):
        specific = options.get('tenant')
        tenants = Tenant.objects.filter(subdomain=specific) if specific else Tenant.objects.all()

        if not tenants.exists():
            self.stderr.write(self.style.WARNING('No tenants found.'))
            return

        total = 0
        for tenant in tenants:
            self.stdout.write(f'\n[*] Seeding booking policies for: {tenant.name}')
            created = 0
            for p in DEFAULT_POLICIES:
                obj, is_new = BookingPolicyRule.objects.get_or_create(
                    tenant=tenant,
                    rule_type=p['rule_type'],
                    description=p['description'],
                    defaults={
                        'applies_to_roles':         p['applies_to_roles'],
                        'applies_to_booking_types': p['applies_to_booking_types'],
                        'after_hours_only':         p['after_hours_only'],
                        'requires_approval':        p['requires_approval'],
                        'approver_role':            p['approver_role'],
                        'is_active':                True,
                    }
                )
                if is_new:
                    self.stdout.write(f'   [+] {p["description"]}')
                    created += 1
                else:
                    self.stdout.write(f'   [=] Already exists: {p["description"][:60]}')
            total += created
            self.stdout.write(self.style.SUCCESS(f'   --> {created} policies created for {tenant.name}'))

        self.stdout.write(self.style.SUCCESS(f'\nDone! Total policies created: {total}'))
