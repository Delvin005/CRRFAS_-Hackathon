import csv
import io
from rest_framework import serializers
from .models import (
    Department, Program, AcademicYear, Semester, Course, CourseSection,
    FacultyProfile, FacultyAvailability, FacultyPreference,
    Batch, Section, StudentGroup, DepartmentRoomPreference,
)


class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.CharField(source='head_of_dept.get_full_name', read_only=True, default='')

    class Meta:
        model = Department
        fields = '__all__'


class ProgramSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Program
        fields = '__all__'


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = '__all__'


class SemesterSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)

    class Meta:
        model = Semester
        fields = '__all__'


class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = Course
        fields = '__all__'


class CourseSectionSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    faculty_name = serializers.CharField(source='assigned_faculty.get_full_name', read_only=True, default='')

    class Meta:
        model = CourseSection
        fields = '__all__'


class FacultyProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = FacultyProfile
        fields = '__all__'


class FacultyAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = FacultyAvailability
        fields = '__all__'


class FacultyPreferenceSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)

    class Meta:
        model = FacultyPreference
        fields = '__all__'


class BatchSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)

    class Meta:
        model = Batch
        fields = '__all__'


class SectionSerializer(serializers.ModelSerializer):
    batch_label = serializers.CharField(source='batch.batch_label', read_only=True)
    class_teacher_name = serializers.CharField(source='class_teacher.get_full_name', read_only=True, default='')

    class Meta:
        model = Section
        fields = '__all__'


class StudentGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentGroup
        fields = '__all__'


class DepartmentRoomPreferenceSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = DepartmentRoomPreference
        fields = '__all__'


# ── Faculty Course Assignment ─────────────────────────────────────────────────

class FacultyAssignSerializer(serializers.Serializer):
    faculty_user_id = serializers.IntegerField()

    def validate_faculty_user_id(self, value):
        from apps.accounts.models import User
        if not User.objects.filter(id=value, role='faculty').exists():
            raise serializers.ValidationError("No faculty user found with this ID.")
        return value


# ── Bulk CSV Upload ───────────────────────────────────────────────────────────

class BulkCourseUploadSerializer(serializers.Serializer):
    """
    Accepts a CSV file with columns:
    code, name, course_type, credits, hours_per_week, semester_number, program_code
    """
    file = serializers.FileField()
    program_id = serializers.IntegerField(help_text="Target program ID for all courses in this CSV")

    def validate_file(self, value):
        if not value.name.endswith('.csv'):
            raise serializers.ValidationError("Only .csv files are accepted.")
        return value

    def parse(self):
        """Parse the CSV and return list of row dicts + list of errors."""
        file = self.validated_data['file']
        text = file.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(text))
        required = {'code', 'name', 'course_type', 'credits', 'hours_per_week', 'semester_number'}
        rows, errors = [], []

        for i, row in enumerate(reader, start=2):
            missing = required - set(row.keys())
            if missing:
                errors.append(f"Row {i}: missing columns {missing}")
                continue
            if not row.get('code') or not row.get('name'):
                errors.append(f"Row {i}: code and name are required.")
                continue
            rows.append(row)

        return rows, errors
