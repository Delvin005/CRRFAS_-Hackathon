"""
Booking and Approval Workflow Models for CRRFAS.

Models:
- BookingRequest       — main booking entity with state machine
- BookingApproval      — approval decision record (who approved, when, comments)
- BookingParticipantInfo — people attending the booking
- RecurringBooking     — recurrence config for repeat bookings
- BookingAttachment    — file attachments for a booking request
- BookingPolicyRule    — tenant-configurable approval rules
- BookingConflictLog   — records of detected conflicts
"""

from django.db import models
from django.utils import timezone
from core.models import AuditModel
from tenants.models import Tenant
from facilities.models import Room
from accounts.models import CustomUser
from resources.models import Resource, SubResourceUnit


# ─────────────────────────────────────────────────────────────────────────────
class BookingPolicyRule(AuditModel):
    """
    Tenant-configurable rules that determine when approval is required.
    Each rule can target a booking_type, role, room type, or time condition.
    """
    RULE_TYPE_CHOICES = [
        ('role_based',         'Role-Based Rule'),
        ('booking_type_based', 'Booking Type Rule'),
        ('time_based',         'Time/After-Hours Rule'),
        ('resource_based',     'Resource Category Rule'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='booking_policies')
    rule_type = models.CharField(max_length=50, choices=RULE_TYPE_CHOICES)
    # Which roles this rule applies to (empty = applies to all)
    applies_to_roles = models.JSONField(default=list, blank=True,
        help_text="List of role names this rule applies to, e.g. ['student','external_user']")
    # Which booking types this rule targets
    applies_to_booking_types = models.JSONField(default=list, blank=True,
        help_text="List of booking_type values, e.g. ['seminar','auditorium']")
    # Weekend / after-hours flag
    after_hours_only = models.BooleanField(default=False,
        help_text="If True, rule only applies for bookings outside 8am–6pm on weekdays")
    requires_approval = models.BooleanField(default=True)
    # The role that should be the approver for this rule
    approver_role = models.CharField(max_length=50, default='facility_manager')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['rule_type']

    def __str__(self):
        return f"Policy [{self.rule_type}] — approval={self.requires_approval} ({self.tenant.name})"


# ─────────────────────────────────────────────────────────────────────────────
class BookingRequest(AuditModel):
    """
    Core booking entity. Supports booking rooms, resources, and sub-units.
    State machine: draft → pending → approved/rejected → completed/cancelled
    """

    # ── Status / State machine ──────────────────────────────────────────────
    STATUS_CHOICES = [
        ('draft',     'Draft'),
        ('pending',   'Pending Approval'),
        ('approved',  'Approved'),
        ('rejected',  'Rejected'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    # ── Booking Types ───────────────────────────────────────────────────────
    BOOKING_TYPE_CHOICES = [
        ('academic_workshop',      'Academic Workshop'),
        ('seminar',                'Seminar'),
        ('guest_lecture',          'Guest Lecture'),
        ('student_event',          'Student Event'),
        ('inter_college_event',    'Inter-College Event'),
        ('admin_meeting',          'Admin Meeting'),
        ('external_conference',    'External Conference'),
        ('sports_booking',         'Sports Booking'),
        ('research_access_request','Research Access Request'),
        ('other',                  'Other'),
    ]

    # ── Core Identity ───────────────────────────────────────────────────────
    tenant         = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='booking_requests')
    requester      = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='my_bookings')
    booking_ref    = models.CharField(max_length=20, unique=True, blank=True,
                        help_text="Auto-generated unique reference e.g. BK-20260001")

    # ── What is being booked (at least one must be set) ─────────────────────
    room           = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True,
                        related_name='booking_requests')
    resource       = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True, blank=True,
                        related_name='booking_requests')
    sub_unit       = models.ForeignKey(SubResourceUnit, on_delete=models.SET_NULL, null=True, blank=True,
                        related_name='booking_requests',
                        help_text="For per-unit bookings (e.g. one PC in a computer lab)")

    # ── Event Details ────────────────────────────────────────────────────────
    title          = models.CharField(max_length=255)
    description    = models.TextField(blank=True)
    booking_type   = models.CharField(max_length=50, choices=BOOKING_TYPE_CHOICES, default='other')
    expected_attendees = models.PositiveIntegerField(default=1)
    department     = models.CharField(max_length=255, blank=True)

    # ── Time Slot ────────────────────────────────────────────────────────────
    start_time     = models.DateTimeField()
    end_time       = models.DateTimeField()

    # ── Approval Workflow ────────────────────────────────────────────────────
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requires_approval = models.BooleanField(default=True,
                        help_text="Set automatically by apply_policy() at submission time")
    assigned_approver = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
                        related_name='assigned_for_approval',
                        help_text="The specific user assigned to approve this request")
    auto_approved = models.BooleanField(default=False)

    # ── Recurrence ──────────────────────────────────────────────────────────
    # Links to RecurringBooking if this request is part of a series
    recurring_group = models.ForeignKey('RecurringBooking', on_delete=models.SET_NULL,
                        null=True, blank=True, related_name='occurrences')

    # ── Calendar Event Data (for frontend calendar integration) ──────────────
    calendar_event_data = models.JSONField(default=dict, blank=True,
                        help_text="Stores event metadata for calendar display")

    # ── Notification flag ────────────────────────────────────────────────────
    notification_sent = models.BooleanField(default=False)

    # ── Internal notes ───────────────────────────────────────────────────────
    internal_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.booking_ref}] {self.title} — {self.status}"

    # ── Auto-generate booking reference on save ──────────────────────────────
    def save(self, *args, **kwargs):
        if not self.booking_ref:
            year = timezone.now().year
            count = BookingRequest.objects.filter(
                tenant=self.tenant,
                booking_ref__startswith=f"BK-{year}"
            ).count() + 1
            self.booking_ref = f"BK-{year}{count:04d}"
        super().save(*args, **kwargs)

    # ── Target description helper ────────────────────────────────────────────
    @property
    def booking_target(self):
        if self.sub_unit:
            return f"sub-unit:{self.sub_unit.unit_identifier}"
        if self.resource:
            return f"resource:{self.resource.name}"
        if self.room:
            return f"room:{self.room.room_number}"
        return "unspecified"

    # ── Tenant property helper ───────────────────────────────────────────────
    @property
    def tenant_obj(self):
        return self.tenant


# ─────────────────────────────────────────────────────────────────────────────
class BookingApproval(AuditModel):
    """
    Records each approval decision — supports multi-level approvals in future.
    """
    DECISION_CHOICES = [
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('forwarded','Forwarded to Next Approver'),
    ]

    booking  = models.ForeignKey(BookingRequest, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='approval_decisions')
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES)
    comments = models.TextField(blank=True)
    decided_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-decided_at']

    def __str__(self):
        return f"{self.decision} by {self.approver.email} for [{self.booking.booking_ref}]"


# ─────────────────────────────────────────────────────────────────────────────
class BookingParticipantInfo(AuditModel):
    """
    Optional: records participants/attendees for a booking.
    """
    booking = models.ForeignKey(BookingRequest, on_delete=models.CASCADE, related_name='participants')
    name    = models.CharField(max_length=255)
    email   = models.EmailField(blank=True)
    role    = models.CharField(max_length=100, blank=True, help_text="e.g. Speaker, Faculty Guide, Student")
    is_external = models.BooleanField(default=False)

    @property
    def tenant(self):
        return self.booking.tenant

    def __str__(self):
        return f"{self.name} ({self.booking.booking_ref})"


# ─────────────────────────────────────────────────────────────────────────────
class RecurringBooking(AuditModel):
    """
    Optional: defines a recurring booking series.
    Individual occurrences (BookingRequest) link back to this via recurring_group FK.
    """
    FREQUENCY_CHOICES = [
        ('daily',   'Daily'),
        ('weekly',  'Weekly'),
        ('monthly', 'Monthly'),
    ]

    tenant       = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='recurring_bookings')
    requester    = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='recurring_requests')
    title        = models.CharField(max_length=255)
    frequency    = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='weekly')
    # Days of week (0=Mon...6=Sun), stored as JSON list e.g. [0, 2, 4]
    recurrence_days = models.JSONField(default=list, blank=True,
                        help_text="Days of week for weekly recurrence. 0=Monday, 6=Sunday.")
    series_start = models.DateField()
    series_end   = models.DateField()
    total_occurrences = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Recurring: {self.title} ({self.frequency}, {self.series_start} → {self.series_end})"


# ─────────────────────────────────────────────────────────────────────────────
class BookingAttachment(AuditModel):
    """
    Optional file attachments for booking requests (letters, forms, etc.)
    """
    booking   = models.ForeignKey(BookingRequest, on_delete=models.CASCADE, related_name='attachments')
    file_name = models.CharField(max_length=255)
    file_url  = models.URLField(blank=True, help_text="URL to uploaded file in storage")
    # For simplicity in local dev, also allow base64 or notes-only attachments
    notes     = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)

    @property
    def tenant(self):
        return self.booking.tenant

    def __str__(self):
        return f"Attachment: {self.file_name} for [{self.booking.booking_ref}]"


# ─────────────────────────────────────────────────────────────────────────────
class BookingConflictLog(AuditModel):
    """
    Records any detected double-booking or conflict attempts.
    Useful for audit trails and debugging scheduling issues.
    """
    tenant          = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='conflict_logs')
    attempted_by    = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='conflict_attempts')
    conflicting_with = models.ForeignKey(BookingRequest, on_delete=models.SET_NULL, null=True,
                        related_name='caused_conflicts',
                        help_text="The existing approved booking that caused the conflict")
    # What they tried to book
    target_type     = models.CharField(max_length=50, blank=True,
                        help_text="room / resource / sub_unit")
    target_id       = models.IntegerField(null=True, blank=True)
    attempted_start = models.DateTimeField()
    attempted_end   = models.DateTimeField()
    conflict_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Conflict by {self.attempted_by} on {self.attempted_start} [{self.target_type}:{self.target_id}]"
