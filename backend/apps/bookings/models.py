from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User
from apps.resources.models import Resource

STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
    ('cancelled', 'Cancelled'),
]

PURPOSE_CHOICES = [
    ('class', 'Regular Class'),
    ('exam', 'Examination'),
    ('event', 'Event'),
    ('meeting', 'Meeting'),
    ('workshop', 'Workshop'),
    ('other', 'Other'),
]

class Booking(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='bookings')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='bookings')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings_made')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings_approved')
    title = models.CharField(max_length=200)
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES, default='other')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    rejection_reason = models.TextField(blank=True)
    attendees_count = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.resource.name} ({self.status})"

    class Meta:
        ordering = ['-created_at']
