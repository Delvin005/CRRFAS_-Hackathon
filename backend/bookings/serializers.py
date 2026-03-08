"""
Serializers for the Booking and Approval Workflow module.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import (
    BookingRequest, BookingApproval, BookingParticipantInfo,
    RecurringBooking, BookingAttachment, BookingPolicyRule, BookingConflictLog
)


class BookingPolicyRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPolicyRule
        fields = [
            'id', 'rule_type', 'applies_to_roles', 'applies_to_booking_types',
            'after_hours_only', 'requires_approval', 'approver_role',
            'description', 'is_active'
        ]


class BookingApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.SerializerMethodField()

    class Meta:
        model = BookingApproval
        fields = ['id', 'booking', 'approver', 'approver_name', 'decision', 'comments', 'decided_at']
        read_only_fields = ['decided_at']

    def get_approver_name(self, obj):
        return obj.approver.get_full_name() or obj.approver.email


class BookingParticipantInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingParticipantInfo
        fields = ['id', 'booking', 'name', 'email', 'role', 'is_external']


class BookingAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingAttachment
        fields = ['id', 'booking', 'file_name', 'file_url', 'notes', 'uploaded_by']
        read_only_fields = ['uploaded_by']


class RecurringBookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecurringBooking
        fields = [
            'id', 'title', 'frequency', 'recurrence_days',
            'series_start', 'series_end', 'total_occurrences'
        ]


class BookingConflictLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingConflictLog
        fields = [
            'id', 'attempted_by', 'conflicting_with', 'target_type',
            'target_id', 'attempted_start', 'attempted_end',
            'conflict_reason', 'created_at'
        ]
        read_only_fields = ['created_at']


# ── Main booking serializer ──────────────────────────────────────────────────
class BookingRequestSerializer(serializers.ModelSerializer):
    requester_name  = serializers.SerializerMethodField()
    room_number     = serializers.CharField(source='room.room_number', read_only=True, default=None)
    resource_name   = serializers.CharField(source='resource.name', read_only=True, default=None)
    sub_unit_label  = serializers.CharField(source='sub_unit.unit_identifier', read_only=True, default=None)
    approvals       = BookingApprovalSerializer(many=True, read_only=True)
    participants_count = serializers.IntegerField(source='participants.count', read_only=True)
    booking_target  = serializers.CharField(read_only=True)

    class Meta:
        model = BookingRequest
        fields = [
            'id', 'booking_ref', 'tenant', 'requester', 'requester_name',
            'room', 'room_number', 'resource', 'resource_name',
            'sub_unit', 'sub_unit_label',
            'title', 'description', 'booking_type', 'expected_attendees',
            'department', 'start_time', 'end_time',
            'status', 'requires_approval', 'auto_approved',
            'assigned_approver', 'booking_target',
            'recurring_group', 'calendar_event_data',
            'notification_sent', 'internal_notes',
            'approvals', 'participants_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'booking_ref', 'tenant', 'requester', 'status',
            'auto_approved', 'requires_approval', 'notification_sent',
            'calendar_event_data', 'created_at', 'updated_at',
        ]

    def get_requester_name(self, obj):
        return obj.requester.get_full_name() or obj.requester.email

    def validate(self, data):
        # At least one booking target must be set
        room      = data.get('room')
        resource  = data.get('resource')
        sub_unit  = data.get('sub_unit')
        if not any([room, resource, sub_unit]):
            raise serializers.ValidationError(
                "At least one booking target must be provided: room, resource, or sub_unit."
            )

        # Time validation
        start = data.get('start_time')
        end   = data.get('end_time')
        if start and end:
            if end <= start:
                raise serializers.ValidationError("end_time must be after start_time.")
            if start < timezone.now():
                raise serializers.ValidationError("Cannot book in the past.")

        return data


# ── Lightweight serializer for listing (avoids heavy nested approvals) ────────
class BookingRequestListSerializer(serializers.ModelSerializer):
    requester_name = serializers.SerializerMethodField()
    room_number    = serializers.CharField(source='room.room_number', read_only=True, default=None)
    resource_name  = serializers.CharField(source='resource.name', read_only=True, default=None)
    booking_target = serializers.CharField(read_only=True)

    class Meta:
        model = BookingRequest
        fields = [
            'id', 'booking_ref', 'title', 'booking_type', 'status',
            'requester_name', 'room_number', 'resource_name', 'booking_target',
            'start_time', 'end_time', 'requires_approval', 'auto_approved',
            'created_at',
        ]

    def get_requester_name(self, obj):
        return obj.requester.get_full_name() or obj.requester.email


# ── Serializer just for approve/reject action ────────────────────────────────
class ApprovalDecisionSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=['approved', 'rejected', 'forwarded'])
    comments = serializers.CharField(required=False, allow_blank=True, default='')
