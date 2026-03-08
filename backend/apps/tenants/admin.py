from django.contrib import admin
from .models import Tenant

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'institution_type', 'is_active', 'created_at']
    search_fields = ['name', 'slug']
    list_filter = ['institution_type', 'is_active']
