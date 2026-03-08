from rest_framework import serializers
from .models import (
    ResourceCategory, ResourceTag, Resource, SubResourceUnit, 
    LabInstrument, RoomResourceMapping, MaintenanceSchedule, UtilizationLog
)

class ResourceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceCategory
        fields = ['id', 'name', 'description']

class ResourceTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceTag
        fields = ['id', 'name']

class SubResourceUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubResourceUnit
        fields = ['id', 'resource', 'unit_identifier', 'status', 'is_bookable', 'notes']

class LabInstrumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabInstrument
        fields = ['id', 'model_number', 'manufacturer', 'last_calibration_date', 'next_calibration_due', 'safety_instructions', 'is_high_precision']

class ResourceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    tags_details = ResourceTagSerializer(source='tags', many=True, read_only=True)
    lab_details = LabInstrumentSerializer(required=False)
    sub_units_count = serializers.IntegerField(source='sub_units.count', read_only=True)
    
    class Meta:
        model = Resource
        fields = [
            'id', 'resource_code', 'name', 'category', 'category_name', 
            'room', 'room_name', 'department', 'quantity_total', 'quantity_available', 
            'unit_type', 'bookable_as_whole', 'bookable_per_unit', 'status', 
            'maintenance_status', 'tags', 'tags_details', 'requires_approval', 
            'restricted_roles', 'notes', 'lab_details', 'sub_units_count'
        ]

    def create(self, validated_data):
        lab_data = validated_data.pop('lab_details', None)
        tags = validated_data.pop('tags', [])
        resource = Resource.objects.create(**validated_data)
        resource.tags.set(tags)
        
        if lab_data:
            LabInstrument.objects.create(resource=resource, **lab_data)
        return resource

    def update(self, instance, validated_data):
        lab_data = validated_data.pop('lab_details', None)
        tags = validated_data.pop('tags', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if tags is not None:
            instance.tags.set(tags)
            
        if lab_data:
            lab_obj, created = LabInstrument.objects.get_or_create(resource=instance)
            for attr, value in lab_data.items():
                setattr(lab_obj, attr, value)
            lab_obj.save()
            
        return instance

class RoomResourceMappingSerializer(serializers.ModelSerializer):
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    class Meta:
        model = RoomResourceMapping
        fields = ['id', 'room', 'resource', 'resource_name', 'quantity']

class MaintenanceScheduleSerializer(serializers.ModelSerializer):
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    class Meta:
        model = MaintenanceSchedule
        fields = [
            'id', 'resource', 'resource_name', 'maintenance_type', 
            'start_time', 'end_time', 'performed_by', 'status', 
            'work_description', 'cost'
        ]

class UtilizationLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    resource_name = serializers.CharField(source='resource.name', read_only=True)
    
    class Meta:
        model = UtilizationLog
        fields = [
            'id', 'resource', 'resource_name', 'sub_unit', 'user', 
            'user_name', 'start_time', 'end_time', 'usage_type', 'log_data'
        ]
