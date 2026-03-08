from rest_framework import serializers
from apps.exams.models import (
    ExamPlan, ExamSession, ExamCourseAssignment, ExamHallAllocation,
    SeatingPlan, InvigilatorAssignment, ExamPublishLog
)

class ExamPlanSerializer(serializers.ModelSerializer):
    academic_year_label = serializers.CharField(source='academic_year.label', read_only=True)
    semester_label = serializers.CharField(source='semester.number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    published_by_name = serializers.CharField(source='published_by.get_full_name', read_only=True)

    class Meta:
        model = ExamPlan
        fields = '__all__'
        read_only_fields = ['tenant', 'created_by', 'published_by', 'published_at', 'is_published', 'status']

class ExamSessionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = ExamSession
        fields = '__all__'

class ExamCourseAssignmentSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    batch_label = serializers.CharField(source='batch.batch_label', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)

    class Meta:
        model = ExamCourseAssignment
        fields = '__all__'

class ExamHallAllocationSerializer(serializers.ModelSerializer):
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    resource_capacity = serializers.IntegerField(source='resource.capacity', read_only=True)

    class Meta:
        model = ExamHallAllocation
        fields = '__all__'

class SeatingPlanSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course_assignment.course.code', read_only=True)
    hall_name = serializers.CharField(source='allocation.resource.name', read_only=True)

    class Meta:
        model = SeatingPlan
        fields = '__all__'

class InvigilatorAssignmentSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.user.get_full_name', read_only=True)
    hall_name = serializers.CharField(source='allocation.resource.name', read_only=True)

    class Meta:
        model = InvigilatorAssignment
        fields = '__all__'

class ExamPublishLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True)

    class Meta:
        model = ExamPublishLog
        fields = '__all__'
