from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.tenants.models import Tenant

ROLE_CHOICES = [
    ('super_admin', 'Super Admin'),
    ('tenant_admin', 'Tenant Admin'),
    ('faculty', 'Faculty'),
    ('student', 'Student'),
    ('facility_manager', 'Facility Manager'),
    ('hod', 'Head of Department'),
    ('dean', 'Dean'),
]

class User(AbstractUser):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True, related_name='users')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=15, blank=True)
    employee_id = models.CharField(max_length=50, blank=True)
    department = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
