from django.db import models
from core.models import AuditModel

class FeatureTag(AuditModel):
    name = models.CharField(max_length=100, unique=True, help_text="Module internal identifier (e.g., 'research_module', 'alumni_module')")
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class Tenant(AuditModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    logo = models.ImageField(upload_to='tenant_logos/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#000000')
    secondary_color = models.CharField(max_length=7, default='#FFFFFF')
    theme = models.CharField(max_length=10, choices=[('dark', 'Dark'), ('light', 'Light')], default='dark')
    contact_email = models.EmailField()
    support_phone = models.CharField(max_length=20)
    domain = models.CharField(max_length=255, null=True, blank=True, unique=True)
    subdomain = models.CharField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    enabled_features = models.ManyToManyField(FeatureTag, blank=True)

    def __str__(self):
        return self.name
