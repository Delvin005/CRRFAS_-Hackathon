from django.db import models
from core.models import AuditModel
from facilities.models import Room
from accounts.models import CustomUser
from tenants.models import Tenant

class Department(AuditModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    head_of_department = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_departments')
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('tenant', 'code')

    def __str__(self):
        return f"{self.name} ({self.code})"

class Course(AuditModel):
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    credits = models.IntegerField(default=3)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('department', 'code')

    @property
    def tenant(self):
        return self.department.tenant

    def __str__(self):
        return f"{self.code} - {self.name}"

class TimetableSlot(AuditModel):
    DAY_CHOICES = [
        ('1', 'Monday'),
        ('2', 'Tuesday'),
        ('3', 'Wednesday'),
        ('4', 'Thursday'),
        ('5', 'Friday'),
        ('6', 'Saturday'),
        ('7', 'Sunday'),
    ]

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='timetable_slots')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='timetable_slots')
    faculty = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='teaching_slots')
    day_of_week = models.CharField(max_length=1, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)

    @property
    def tenant(self):
        return self.course.tenant

    def __str__(self):
        return f"{self.course.code} - {self.get_day_of_week_display()} {self.start_time}"
