import os
import django
from datetime import time

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.tenants.models import Tenant
from apps.timetable.models import TimeSlotTemplate, WorkingDay
from apps.academics.models import Department

def run():
    tenant = Tenant.objects.first()

    templates = [
        ('Period 1', '08:00', '09:00', 1),
        ('Period 2', '09:00', '10:00', 2),
        ('Period 3', '10:15', '11:15', 3),
        ('Period 4', '11:15', '12:15', 4),
        ('Period 5', '13:00', '14:00', 5),
        ('Period 6', '14:00', '15:00', 6),
        ('Lab Session A', '08:00', '10:00', 7),
        ('Lab Session B', '10:15', '12:15', 8),
    ]
    for label, start, end, order in templates:
        TimeSlotTemplate.objects.get_or_create(
            tenant=tenant, label=label,
            defaults={'start_time': start, 'end_time': end, 'order': order}
        )

    for day in ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']:
        WorkingDay.objects.get_or_create(
            tenant=tenant, department=None, day=day,
            defaults={'is_working': day != 'sun'}
        )
    print("Seeded TimeSlotTemplate and WorkingDay successfully!")

if __name__ == '__main__':
    run()
