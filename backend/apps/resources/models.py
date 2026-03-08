from django.db import models
from apps.tenants.models import Tenant
from apps.campus.models import Floor

RESOURCE_TYPE_CHOICES = [
    ('classroom', 'Classroom'),
    ('lab', 'Laboratory'),
    ('seminar_hall', 'Seminar Hall'),
    ('auditorium', 'Auditorium'),
    ('meeting_room', 'Meeting Room'),
    ('sports_facility', 'Sports Facility'),
    ('equipment', 'Equipment'),
]

STATUS_CHOICES = [
    ('available', 'Available'),
    ('maintenance', 'Under Maintenance'),
    ('inactive', 'Inactive'),
]

class Resource(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='resources')
    floor = models.ForeignKey(Floor, on_delete=models.SET_NULL, null=True, blank=True, related_name='resources')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, blank=True)
    resource_type = models.CharField(max_length=50, choices=RESOURCE_TYPE_CHOICES)
    capacity = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    has_projector = models.BooleanField(default=False)
    has_ac = models.BooleanField(default=False)
    has_whiteboard = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.resource_type})"

    class Meta:
        ordering = ['name']
