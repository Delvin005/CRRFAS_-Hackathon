from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User
from apps.resources.models import Resource
from apps.academics.models import (
    Department, AcademicYear, Program, Semester,
    Course, CourseSection, FacultyProfile, Section, Batch,
)

# ── Choices ──────────────────────────────────────────────────────────────────

DAY_CHOICES = [
    ('mon', 'Monday'), ('tue', 'Tuesday'), ('wed', 'Wednesday'),
    ('thu', 'Thursday'), ('fri', 'Friday'), ('sat', 'Saturday'),
]

SESSION_TYPE_CHOICES = [
    ('lecture', 'Lecture'),
    ('lab', 'Lab'),
    ('tutorial', 'Tutorial'),
    ('seminar', 'Seminar'),
    ('exam', 'Exam'),
]

PLAN_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('review', 'Under Review'),
    ('published', 'Published'),
    ('archived', 'Archived'),
]

SLOT_STATUS_CHOICES = [
    ('active', 'Active'),
    ('cancelled', 'Cancelled'),
    ('rescheduled', 'Rescheduled'),
]

CHANGE_REQUEST_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('approved', 'Approved'),
    ('rejected', 'Rejected'),
]

# ── Timetable Plan ────────────────────────────────────────────────────────────

class TimetablePlan(models.Model):
    """
    A named timetable plan for a semester.
    Multiple drafts can coexist; only one per semester can be 'published'.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='timetable_plans')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='timetable_plans')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='timetable_plans')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='timetable_plans')
    name = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default='draft')
    is_published = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_plans')
    published_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='published_plans')
    published_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.status})"

    class Meta:
        ordering = ['-created_at']


# ── Working Days & Time Slot Templates ────────────────────────────────────────

class WorkingDay(models.Model):
    """Define which days a tenant/department works."""
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='working_days')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='working_days')
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    is_working = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.day} - {'Working' if self.is_working else 'Off'}"

    class Meta:
        unique_together = ['tenant', 'department', 'day']


class TimeSlotTemplate(models.Model):
    """
    Reusable time slot template (e.g. Period 1: 08:00-09:00).
    Used to quickly populate ClassSession times.
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='time_slot_templates')
    label = models.CharField(max_length=50)  # e.g. "Period 1", "Lab 2"
    start_time = models.TimeField()
    end_time = models.TimeField()
    order = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.label} ({self.start_time}–{self.end_time})"

    class Meta:
        ordering = ['order', 'start_time']
        unique_together = ['tenant', 'label']


# ── Class Session (the core timetable row) ────────────────────────────────────

class ClassSession(models.Model):
    """
    A single scheduled class — one row in the timetable grid.
    Owns the conflict validation logic via the service layer.
    """
    plan = models.ForeignKey(TimetablePlan, on_delete=models.CASCADE, related_name='sessions')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='class_sessions')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='class_sessions')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='class_sessions')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='class_sessions')

    # Academic linkage
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='class_sessions')
    course_section = models.ForeignKey(CourseSection, on_delete=models.SET_NULL, null=True, blank=True, related_name='class_sessions')
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True, blank=True, related_name='class_sessions')
    section = models.ForeignKey(Section, on_delete=models.SET_NULL, null=True, blank=True, related_name='class_sessions')

    # Schedule
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='lecture')
    status = models.CharField(max_length=20, choices=SLOT_STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.course.code} - {self.day} {self.start_time}"

    class Meta:
        ordering = ['day', 'start_time']


# ── Assignments ───────────────────────────────────────────────────────────────

class FacultyAssignment(models.Model):
    """Maps a faculty to a ClassSession. Separated so one session can have co-faculty."""
    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='faculty_assignments')
    faculty = models.ForeignKey(FacultyProfile, on_delete=models.CASCADE, related_name='timetable_assignments')
    is_primary = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.faculty} → {self.session}"

    class Meta:
        unique_together = ['session', 'faculty']


class RoomAssignment(models.Model):
    """Maps a room (Resource) to a ClassSession."""
    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='room_assignments')
    room = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='session_assignments')

    def __str__(self):
        return f"{self.room.name} → {self.session}"

    class Meta:
        unique_together = ['session', 'room']


# ── Publish Log ───────────────────────────────────────────────────────────────

class TimetablePublishLog(models.Model):
    """Immutable audit log of every publish/unpublish action."""
    plan = models.ForeignKey(TimetablePlan, on_delete=models.CASCADE, related_name='publish_logs')
    action = models.CharField(max_length=20, choices=[('publish', 'Published'), ('unpublish', 'Unpublished'), ('archive', 'Archived')])
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='timetable_actions')
    performed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.plan} - {self.action} at {self.performed_at}"

    class Meta:
        ordering = ['-performed_at']


# ── Change Request (optional) ─────────────────────────────────────────────────

class TimetableChangeRequest(models.Model):
    """
    Optional — faculty can request rescheduling of a session after publish.
    Approved by HoD/admin before taking effect.
    """
    session = models.ForeignKey(ClassSession, on_delete=models.CASCADE, related_name='change_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='timetable_change_requests')
    reason = models.TextField()
    proposed_day = models.CharField(max_length=10, choices=DAY_CHOICES, blank=True)
    proposed_start_time = models.TimeField(null=True, blank=True)
    proposed_end_time = models.TimeField(null=True, blank=True)
    proposed_room = models.ForeignKey(Resource, on_delete=models.SET_NULL, null=True, blank=True, related_name='change_proposals')
    status = models.CharField(max_length=20, choices=CHANGE_REQUEST_STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_changes')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Change request for {self.session} ({self.status})"

    class Meta:
        ordering = ['-created_at']
