"""
Django Admin registration for Booking and Approval models.
"""
from django.contrib import admin
from .models import (
    BookingRequest, BookingApproval, BookingParticipantInfo,
    RecurringBooking, BookingAttachment, BookingPolicyRule, BookingConflictLog
)


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    list_display   = ['booking_ref', 'title', 'booking_type', 'status', 'requester', 'start_time', 'end_time', 'requires_approval', 'auto_approved']
    list_filter    = ['status', 'booking_type', 'requires_approval', 'auto_approved', 'tenant']
    search_fields  = ['booking_ref', 'title', 'requester__email']
    readonly_fields = ['booking_ref', 'calendar_event_data']
    ordering       = ['-created_at']


@admin.register(BookingApproval)
class BookingApprovalAdmin(admin.ModelAdmin):
    list_display = ['booking', 'approver', 'decision', 'decided_at']
    list_filter  = ['decision']
    ordering     = ['-decided_at']


@admin.register(BookingPolicyRule)
class BookingPolicyRuleAdmin(admin.ModelAdmin):
    list_display = ['rule_type', 'requires_approval', 'approver_role', 'is_active', 'tenant']
    list_filter  = ['rule_type', 'requires_approval', 'is_active', 'tenant']


@admin.register(BookingConflictLog)
class BookingConflictLogAdmin(admin.ModelAdmin):
    list_display = ['attempted_by', 'target_type', 'target_id', 'attempted_start', 'attempted_end', 'created_at']
    list_filter  = ['target_type', 'tenant']
    ordering     = ['-created_at']


@admin.register(RecurringBooking)
class RecurringBookingAdmin(admin.ModelAdmin):
    list_display = ['title', 'frequency', 'series_start', 'series_end', 'total_occurrences', 'requester']


@admin.register(BookingParticipantInfo)
class BookingParticipantInfoAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'role', 'is_external', 'booking']


@admin.register(BookingAttachment)
class BookingAttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'booking', 'uploaded_by', 'created_at']
