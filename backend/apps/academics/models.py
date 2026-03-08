from django.db import models
from apps.tenants.models import Tenant
from apps.accounts.models import User

# ── Choices ──────────────────────────────────────────────────────────────────

PROGRAM_TYPE_CHOICES = [
    ('ug', 'Under Graduate'),
    ('pg', 'Post Graduate'),
    ('phd', 'PhD'),
    ('diploma', 'Diploma'),
    ('certificate', 'Certificate'),
]

COURSE_TYPE_CHOICES = [
    ('theory', 'Theory'),
    ('lab', 'Laboratory'),
    ('tutorial', 'Tutorial'),
    ('project', 'Project'),
    ('elective', 'Elective'),
    ('audit', 'Audit'),
]

DAY_CHOICES = [
    ('mon', 'Monday'), ('tue', 'Tuesday'), ('wed', 'Wednesday'),
    ('thu', 'Thursday'), ('fri', 'Friday'), ('sat', 'Saturday'),
]

PREFERENCE_TYPE_CHOICES = [
    ('preferred', 'Preferred'),
    ('willing', 'Willing'),
    ('avoid', 'Avoid'),
]

DESIGNATION_CHOICES = [
    ('professor', 'Professor'),
    ('associate_professor', 'Associate Professor'),
    ('assistant_professor', 'Assistant Professor'),
    ('lecturer', 'Lecturer'),
    ('guest_faculty', 'Guest Faculty'),
    ('lab_instructor', 'Lab Instructor'),
]

SCHEME_TYPE_CHOICES = [
    ('credit', 'Credit Based'),
    ('marks', 'Marks Based'),
    ('grade', 'Grade Based'),
]


# ── Core Academic Structure ───────────────────────────────────────────────────

class Department(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, blank=True)
    head_of_dept = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='headed_departments'
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Program(models.Model):
    # nullable to allow migration on existing rows; always set on new records
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='programs', null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='programs')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, blank=True)
    duration_years = models.PositiveIntegerField(default=4)
    program_type = models.CharField(max_length=50, choices=PROGRAM_TYPE_CHOICES)
    scheme_type = models.CharField(max_length=20, choices=SCHEME_TYPE_CHOICES, default='credit')
    total_semesters = models.PositiveIntegerField(default=8)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

    class Meta:
        ordering = ['name']


class AcademicYear(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='academic_years')
    label = models.CharField(max_length=20)  # e.g. "2024-25"
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return self.label

    class Meta:
        ordering = ['-label']


class Semester(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='semesters')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='semesters')
    number = models.PositiveIntegerField()  # 1, 2, 3 ...
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.program.code} - Sem {self.number} ({self.academic_year.label})"

    class Meta:
        ordering = ['number']
        unique_together = ['program', 'academic_year', 'number']


# ── Course ────────────────────────────────────────────────────────────────────

class Course(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='courses')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='courses')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='courses')
    code = models.CharField(max_length=20)
    name = models.CharField(max_length=200)
    course_type = models.CharField(max_length=20, choices=COURSE_TYPE_CHOICES, default='theory')
    credits = models.DecimalField(max_digits=4, decimal_places=1, default=3.0)
    hours_per_week = models.PositiveIntegerField(default=3)
    semester_number = models.PositiveIntegerField(default=1)
    is_elective = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

    class Meta:
        ordering = ['semester_number', 'code']
        unique_together = ['tenant', 'program', 'code']


class CourseSection(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sections')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='course_sections')
    section_label = models.CharField(max_length=10, default='A')
    max_students = models.PositiveIntegerField(default=60)
    assigned_faculty = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_sections'
    )

    def __str__(self):
        return f"{self.course.code} - Section {self.section_label}"

    class Meta:
        ordering = ['section_label']
        unique_together = ['course', 'semester', 'section_label']


# ── Faculty ───────────────────────────────────────────────────────────────────

class FacultyProfile(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='faculty_profiles')
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='faculty_profile')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='faculty')
    designation = models.CharField(max_length=50, choices=DESIGNATION_CHOICES, default='assistant_professor')
    specialization = models.CharField(max_length=200, blank=True)
    max_hours_per_week = models.PositiveIntegerField(default=18)
    is_active = models.BooleanField(default=True)
    joining_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.designation})"

    class Meta:
        ordering = ['user__first_name']


class FacultyAvailability(models.Model):
    faculty = models.ForeignKey(FacultyProfile, on_delete=models.CASCADE, related_name='availability')
    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.faculty} - {self.day} {self.start_time}-{self.end_time}"

    class Meta:
        ordering = ['day', 'start_time']
        unique_together = ['faculty', 'day', 'start_time']


class FacultyPreference(models.Model):
    faculty = models.ForeignKey(FacultyProfile, on_delete=models.CASCADE, related_name='preferences')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='faculty_preferences')
    preference_type = models.CharField(max_length=20, choices=PREFERENCE_TYPE_CHOICES, default='willing')
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.faculty} - {self.course.code} ({self.preference_type})"

    class Meta:
        unique_together = ['faculty', 'course']


# ── Batch & Section ───────────────────────────────────────────────────────────

class Batch(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='batches')
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='batches')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='batches')
    batch_label = models.CharField(max_length=20)  # e.g. "2022-26"
    intake = models.PositiveIntegerField(default=60)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.program.code} - {self.batch_label}"

    class Meta:
        ordering = ['-batch_label']
        unique_together = ['program', 'batch_label']


class Section(models.Model):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=10)  # A, B, C ...
    strength = models.PositiveIntegerField(default=60)
    class_teacher = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='class_teacher_sections'
    )

    def __str__(self):
        return f"{self.batch} - Section {self.name}"

    class Meta:
        ordering = ['name']
        unique_together = ['batch', 'name']


# ── Optional Models ───────────────────────────────────────────────────────────

class StudentGroup(models.Model):
    """Optional — used for lab splits within a section."""
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='student_groups')
    name = models.CharField(max_length=20)  # G1, G2 ...
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.section} - {self.name}"

    class Meta:
        unique_together = ['section', 'name']


class DepartmentRoomPreference(models.Model):
    """Optional — hints for booking/timetable engine."""
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='room_preferences')
    resource_type = models.CharField(max_length=50)  # classroom, lab, etc.
    preferred_building_name = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.department.name} prefers {self.resource_type}"
