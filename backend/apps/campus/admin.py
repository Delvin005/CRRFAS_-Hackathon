from django.contrib import admin
from .models import Campus, Building, Floor

@admin.register(Campus)
class CampusAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'city', 'is_active']
    list_filter = ['tenant', 'is_active']

@admin.register(Building)
class BuildingAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'campus', 'total_floors']

@admin.register(Floor)
class FloorAdmin(admin.ModelAdmin):
    list_display = ['number', 'label', 'building']
