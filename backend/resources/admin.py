from django.contrib import admin
from .models import (
    ResourceCategory, ResourceTag, Resource, SubResourceUnit,
    LabInstrument, RoomResourceMapping, MaintenanceSchedule, UtilizationLog
)

@admin.register(ResourceCategory)
class ResourceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'description')
    list_filter = ('tenant',)
    search_fields = ('name',)

@admin.register(ResourceTag)
class ResourceTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant')
    list_filter = ('tenant',)

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ('resource_code', 'name', 'category', 'tenant', 'status', 'quantity_total', 'quantity_available', 'requires_approval')
    list_filter = ('tenant', 'status', 'category', 'maintenance_status', 'requires_approval')
    search_fields = ('resource_code', 'name', 'department')
    filter_horizontal = ('tags',)

@admin.register(SubResourceUnit)
class SubResourceUnitAdmin(admin.ModelAdmin):
    list_display = ('unit_identifier', 'resource', 'status', 'is_bookable')
    list_filter = ('status', 'is_bookable')
    search_fields = ('unit_identifier',)

@admin.register(LabInstrument)
class LabInstrumentAdmin(admin.ModelAdmin):
    list_display = ('resource', 'manufacturer', 'model_number', 'last_calibration_date', 'next_calibration_due', 'is_high_precision')
    list_filter = ('is_high_precision',)

@admin.register(RoomResourceMapping)
class RoomResourceMappingAdmin(admin.ModelAdmin):
    list_display = ('room', 'resource', 'quantity')

@admin.register(MaintenanceSchedule)
class MaintenanceScheduleAdmin(admin.ModelAdmin):
    list_display = ('resource', 'maintenance_type', 'status', 'start_time', 'end_time', 'performed_by')
    list_filter = ('status', 'maintenance_type')

@admin.register(UtilizationLog)
class UtilizationLogAdmin(admin.ModelAdmin):
    list_display = ('resource', 'user', 'start_time', 'end_time', 'usage_type')
    list_filter = ('usage_type',)
