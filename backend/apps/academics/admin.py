from django.contrib import admin
from .models import (
    Department, Program, AcademicYear, Semester, Course, CourseSection,
    FacultyProfile, FacultyAvailability, FacultyPreference,
    Batch, Section, StudentGroup, DepartmentRoomPreference,
)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'tenant', 'head_of_dept', 'is_active']
    list_filter = ['tenant', 'is_active']
    search_fields = ['name', 'code']


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'department', 'program_type', 'scheme_type', 'total_semesters', 'is_active']
    list_filter = ['program_type', 'scheme_type', 'tenant']
    search_fields = ['name', 'code']


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['label', 'tenant', 'start_date', 'end_date', 'is_current']
    list_filter = ['tenant', 'is_current']


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ['number', 'program', 'academic_year', 'is_current']
    list_filter = ['is_current', 'program']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'program', 'course_type', 'credits', 'hours_per_week', 'semester_number']
    list_filter = ['course_type', 'tenant', 'program']
    search_fields = ['code', 'name']


@admin.register(CourseSection)
class CourseSectionAdmin(admin.ModelAdmin):
    list_display = ['course', 'section_label', 'semester', 'assigned_faculty', 'max_students']
    list_filter = ['section_label']


@admin.register(FacultyProfile)
class FacultyProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'designation', 'department', 'max_hours_per_week', 'is_active']
    list_filter = ['designation', 'tenant', 'is_active']
    search_fields = ['user__first_name', 'user__last_name', 'user__email']


@admin.register(FacultyAvailability)
class FacultyAvailabilityAdmin(admin.ModelAdmin):
    list_display = ['faculty', 'day', 'start_time', 'end_time', 'is_available']
    list_filter = ['day', 'is_available']


@admin.register(FacultyPreference)
class FacultyPreferenceAdmin(admin.ModelAdmin):
    list_display = ['faculty', 'course', 'preference_type']
    list_filter = ['preference_type']


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['batch_label', 'program', 'academic_year', 'intake', 'is_active']
    list_filter = ['tenant', 'is_active']


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'batch', 'strength', 'class_teacher']


@admin.register(StudentGroup)
class StudentGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'section']


@admin.register(DepartmentRoomPreference)
class DepartmentRoomPreferenceAdmin(admin.ModelAdmin):
    list_display = ['department', 'resource_type', 'preferred_building_name']
