from django.contrib import admin
from .models import (
    TimetablePlan, WorkingDay, TimeSlotTemplate, ClassSession,
    FacultyAssignment, RoomAssignment, TimetablePublishLog, TimetableChangeRequest,
)


@admin.register(TimetablePlan)
class TimetablePlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'semester', 'status', 'is_published', 'created_at']
    list_filter = ['status', 'is_published', 'tenant']
    search_fields = ['name']


@admin.register(WorkingDay)
class WorkingDayAdmin(admin.ModelAdmin):
    list_display = ['day', 'department', 'is_working', 'tenant']
    list_filter = ['day', 'is_working']


@admin.register(TimeSlotTemplate)
class TimeSlotTemplateAdmin(admin.ModelAdmin):
    list_display = ['label', 'start_time', 'end_time', 'order', 'tenant']
    ordering = ['order']


@admin.register(ClassSession)
class ClassSessionAdmin(admin.ModelAdmin):
    list_display = ['course', 'day', 'start_time', 'end_time', 'session_type', 'status', 'section', 'batch']
    list_filter = ['day', 'session_type', 'status', 'tenant']
    search_fields = ['course__code', 'course__name']


@admin.register(FacultyAssignment)
class FacultyAssignmentAdmin(admin.ModelAdmin):
    list_display = ['faculty', 'session', 'is_primary']
    list_filter = ['is_primary']


@admin.register(RoomAssignment)
class RoomAssignmentAdmin(admin.ModelAdmin):
    list_display = ['room', 'session']


@admin.register(TimetablePublishLog)
class TimetablePublishLogAdmin(admin.ModelAdmin):
    list_display = ['plan', 'action', 'performed_by', 'performed_at']
    list_filter = ['action']
    readonly_fields = ['performed_at']


@admin.register(TimetableChangeRequest)
class TimetableChangeRequestAdmin(admin.ModelAdmin):
    list_display = ['session', 'requested_by', 'status', 'created_at']
    list_filter = ['status']
