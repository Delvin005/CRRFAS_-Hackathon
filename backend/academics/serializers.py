from rest_framework import serializers
from .models import Department, Course, TimetableSlot

class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.CharField(source='head_of_department.get_full_name', read_only=True)
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'head_of_department', 'head_name', 'is_active', 'created_at']

class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = Course
        fields = ['id', 'department', 'department_name', 'name', 'code', 'description', 'credits', 'is_active']

class TimetableSlotSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_code = serializers.CharField(source='course.code', read_only=True)
    room_number = serializers.CharField(source='room.room_number', read_only=True)
    faculty_name = serializers.CharField(source='faculty.get_full_name', read_only=True)
    
    class Meta:
        model = TimetableSlot
        fields = [
            'id', 'course', 'course_name', 'course_code',
            'room', 'room_number', 'faculty', 'faculty_name',
            'day_of_week', 'start_time', 'end_time', 'is_active'
        ]
