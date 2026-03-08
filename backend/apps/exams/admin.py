from django.contrib import admin
from .models import (
    ExamPlan, ExamSession, ExamCourseAssignment, ExamHallAllocation,
    SeatingPlan, InvigilatorAssignment, ExamPublishLog
)

@admin.register(ExamPlan)
class ExamPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'academic_year', 'semester', 'status', 'is_published']
    list_filter = ['tenant', 'status', 'is_published']

@admin.register(ExamSession)
class ExamSessionAdmin(admin.ModelAdmin):
    list_display = ['plan', 'date', 'session_type', 'start_time', 'end_time']
    list_filter = ['plan__tenant', 'session_type', 'date']

@admin.register(ExamCourseAssignment)
class ExamCourseAssignmentAdmin(admin.ModelAdmin):
    list_display = ['session', 'course', 'batch', 'section']
    list_filter = ['session__plan__tenant']

@admin.register(ExamHallAllocation)
class ExamHallAllocationAdmin(admin.ModelAdmin):
    list_display = ['session', 'resource', 'allocated_capacity']
    list_filter = ['session__plan__tenant']

@admin.register(SeatingPlan)
class SeatingPlanAdmin(admin.ModelAdmin):
    list_display = ['allocation', 'student_roll_number', 'seat_number', 'course_assignment']

@admin.register(InvigilatorAssignment)
class InvigilatorAssignmentAdmin(admin.ModelAdmin):
    list_display = ['allocation', 'faculty', 'is_chief_invigilator']

@admin.register(ExamPublishLog)
class ExamPublishLogAdmin(admin.ModelAdmin):
    list_display = ['plan', 'action', 'performed_by', 'performed_at']
    list_filter = ['action']
