from django.db import models
from django.contrib.auth.models import AbstractUser
from core.models import AuditModel
from tenants.models import Tenant

class Role(AuditModel):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('tenant_admin', 'Tenant Admin'),
        ('academic_admin', 'Academic Admin'),
        ('facility_manager', 'Facility Manager'),
        ('faculty', 'Faculty'),
        ('student', 'Student'),
        ('it_admin', 'IT Admin'),
        ('research_scholar', 'Research Scholar'),
        ('external_user', 'External User'),
    ]
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.get_name_display()

class CustomUser(AbstractUser, AuditModel):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    campus_scope = models.CharField(max_length=255, null=True, blank=True, help_text="Restrict user scope to a specific campus division if needed")
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email

class UserTenantMembership(AuditModel):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='memberships')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='memberships')
    role = models.ForeignKey(Role, on_delete=models.PROTECT)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'tenant')

    def __str__(self):
        return f"{self.user.email} - {self.tenant.name} [{self.role.name}]"
