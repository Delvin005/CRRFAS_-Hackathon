from django.contrib import admin
from .models import Resource

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'resource_type', 'capacity', 'status', 'tenant']
    list_filter = ['resource_type', 'status', 'tenant']
    search_fields = ['name', 'code']
