from rest_framework import serializers
from .models import (
    TimetablePlan, WorkingDay, TimeSlotTemplate, ClassSession,
    FacultyAssignment, RoomAssignment, TimetablePublishLog, TimetableChangeRequest,
)


class TimetablePlanSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default='')
    published_by_name = serializers.CharField(source='published_by.get_full_name', read_only=True, default='')
    semester_label = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)

    def get_semester_label(self, obj):
        return f"Sem {obj.semester.number}" if obj.semester else ''

    class Meta:
        model = TimetablePlan
        fields = '__all__'
        read_only_fields = ['tenant', 'created_by', 'published_by', 'published_at', 'is_published']


class WorkingDaySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkingDay
        fields = '__all__'
        read_only_fields = ['tenant']


class TimeSlotTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlotTemplate
        fields = '__all__'
        read_only_fields = ['tenant']


class FacultyAssignmentSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.user.get_full_name', read_only=True)

    class Meta:
        model = FacultyAssignment
        fields = '__all__'


class RoomAssignmentSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)
    room_type = serializers.CharField(source='room.resource_type', read_only=True)
    room_capacity = serializers.IntegerField(source='room.capacity', read_only=True)

    class Meta:
        model = RoomAssignment
        fields = '__all__'


class ClassSessionSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    section_name = serializers.SerializerMethodField()
    batch_label = serializers.SerializerMethodField()
    faculty_assignments = FacultyAssignmentSerializer(many=True, read_only=True)
    room_assignments = RoomAssignmentSerializer(many=True, read_only=True)

    def get_section_name(self, obj):
        if obj.course_section:
            return obj.course_section.section_label
        if obj.section:
            return obj.section.name
        return ''

    def get_batch_label(self, obj):
        if obj.batch:
            return obj.batch.batch_label
        return ''

    class Meta:
        model = ClassSession
        fields = '__all__'
        read_only_fields = ['tenant']

    def validate(self, data):
        if data.get('start_time') and data.get('end_time'):
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError({'end_time': 'End time must be after start time.'})
        return data


class TimetablePublishLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.get_full_name', read_only=True, default='')

    class Meta:
        model = TimetablePublishLog
        fields = '__all__'
        read_only_fields = ['performed_by', 'performed_at']


class TimetableChangeRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    session_info = serializers.SerializerMethodField()

    def get_session_info(self, obj):
        s = obj.session
        return f"{s.course.code} - {s.day} {s.start_time}"

    class Meta:
        model = TimetableChangeRequest
        fields = '__all__'
        read_only_fields = ['requested_by', 'reviewed_by', 'reviewed_at']


# ── Conflict check input serializer ───────────────────────────────────────────

class ConflictCheckSerializer(serializers.Serializer):
    day = serializers.ChoiceField(choices=['mon', 'tue', 'wed', 'thu', 'fri', 'sat'])
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    faculty_profile_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    room_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    section_id = serializers.IntegerField(required=False, allow_null=True)
    batch_id = serializers.IntegerField(required=False, allow_null=True)
    course_section_id = serializers.IntegerField(required=False, allow_null=True)
    session_type = serializers.ChoiceField(choices=['lecture', 'lab', 'tutorial', 'seminar', 'exam'], default='lecture')
    exclude_session_id = serializers.IntegerField(required=False, allow_null=True)


# ── Publish action serializer ─────────────────────────────────────────────────

class PublishActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['publish', 'unpublish', 'archive'])
    notes = serializers.CharField(required=False, allow_blank=True)


# ── Review change request serializer ─────────────────────────────────────────

class ReviewChangeRequestSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approved', 'rejected'])
    review_notes = serializers.CharField(required=False, allow_blank=True)
