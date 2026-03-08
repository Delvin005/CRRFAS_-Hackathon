from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User
from apps.resources.models import Resource
from apps.academics.models import (
    AcademicYear, Semester, Course, Batch, Section, FacultyProfile
)

PLAN_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('review', 'Under Review'),
    ('published', 'Published'),
    ('archived', 'Archived'),
]

SESSION_TYPE_CHOICES = [
    ('forenoon', 'Forenoon (FN)'),
    ('afternoon', 'Afternoon (AN)'),
]

ACTION_CHOICES = [
    ('publish', 'Published'), 
    ('unpublish', 'Unpublished'), 
    ('archive', 'Archived')
]

class ExamPlan(models.Model):
    """
    A named exam cycle (e.g. Midterms Fall 2024, Final Exams Spring 2025).
    """
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='exam_plans')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='exam_plans')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='exam_plans')
    
    name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=PLAN_STATUS_CHOICES, default='draft')
    is_published = models.BooleanField(default=False)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_exam_plans')
    published_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='published_exam_plans')
    published_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.status})"
    
    class Meta:
        ordering = ['-start_date']

class ExamSession(models.Model):
    """
    A specific half-day slot when exams occur. e.g. "Oct 10, Forenoon"
    """
    plan = models.ForeignKey(ExamPlan, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    session_type = models.CharField(max_length=20, choices=SESSION_TYPE_CHOICES, default='forenoon')

    def __str__(self):
        return f"{self.plan.name} - {self.date} {self.session_type}"

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ['plan', 'date', 'session_type']

class ExamCourseAssignment(models.Model):
    """
    Assigns a course and batch/section to a specific ExamSession.
    """
    session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='course_assignments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exam_assignments')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='exam_assignments', null=True, blank=True)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='exam_assignments', null=True, blank=True)

    def __str__(self):
        return f"{self.course.code} on {self.session.date}"
    
    class Meta:
        unique_together = ['session', 'course', 'batch', 'section']

class ExamHallAllocation(models.Model):
    """
    Reserves a physical room/hall for an ExamSession.
    """
    session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='hall_allocations')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='exam_hall_allocations')
    allocated_capacity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.resource.name} for {self.session}"

    class Meta:
        unique_together = ['session', 'resource']

class SeatingPlan(models.Model):
    """
    Individual seat assignment linking a student (via roll number) to a specific seat in an allocated hall.
    """
    allocation = models.ForeignKey(ExamHallAllocation, on_delete=models.CASCADE, related_name='seating_plans')
    course_assignment = models.ForeignKey(ExamCourseAssignment, on_delete=models.CASCADE, related_name='seating_plans')
    student_roll_number = models.CharField(max_length=50)
    seat_number = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.student_roll_number} -> {self.allocation.resource.name} Seat {self.seat_number}"

    class Meta:
        ordering = ['allocation', 'seat_number']
        unique_together = ['allocation', 'seat_number']

class InvigilatorAssignment(models.Model):
    """
    Assigns a faculty member to invigilate a specific hall during a session.
    """
    allocation = models.ForeignKey(ExamHallAllocation, on_delete=models.CASCADE, related_name='invigilators')
    faculty = models.ForeignKey(FacultyProfile, on_delete=models.CASCADE, related_name='exam_invigilations')
    is_chief_invigilator = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.faculty} at {self.allocation.resource.name}"
    
    class Meta:
        unique_together = ['allocation', 'faculty']

class ExamPublishLog(models.Model):
    """
    Audit log for publishing/unpublishing exam schedules.
    """
    plan = models.ForeignKey(ExamPlan, on_delete=models.CASCADE, related_name='publish_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='exam_actions')
    performed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.plan} - {self.action} at {self.performed_at}"
    
    class Meta:
        ordering = ['-performed_at']
