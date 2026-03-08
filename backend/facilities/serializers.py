from rest_framework import serializers
from .models import Campus, Building, Floor, RoomType, FacilityTag, Room, Resource

class CampusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campus
        fields = ['id', 'name', 'code', 'description', 'address', 'contact_email', 'contact_phone', 'is_active', 'created_at']

class BuildingSerializer(serializers.ModelSerializer):
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    
    class Meta:
        model = Building
        fields = ['id', 'campus', 'campus_name', 'name', 'code', 'description', 'floors', 'status', 'accessibility_flags', 'is_active']

class FloorSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='building.name', read_only=True)
    campus_id = serializers.IntegerField(source='building.campus_id', read_only=True)

    class Meta:
        model = Floor
        fields = ['id', 'building', 'building_name', 'campus_id', 'floor_number', 'name', 'map_url']

class RoomTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomType
        fields = ['id', 'name', 'description', 'is_active']

class FacilityTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacilityTag
        fields = ['id', 'name', 'icon', 'is_active']


class RoomSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source='building.name', read_only=True)
    campus_name = serializers.CharField(source='campus.name', read_only=True)
    floor_name = serializers.CharField(source='floor.name', read_only=True)
    room_type_name = serializers.CharField(source='room_type.name', read_only=True)
    # Use nested serialization for read statements to give frontend rich data
    available_facilities_details = FacilityTagSerializer(source='available_facilities', many=True, read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'campus', 'campus_name', 'building', 'building_name', 'floor', 'floor_name',
            'room_number', 'name', 'room_type', 'room_type_name', 'capacity', 
            'status', 'under_maintenance', 'accessibility_flags', 'description', 
            'department', 'available_facilities', 'available_facilities_details', 'is_active'
        ]

class ResourceSerializer(serializers.ModelSerializer):
    room_name = serializers.CharField(source='room.name', read_only=True)
    
    class Meta:
        model = Resource
        fields = ['id', 'room', 'room_name', 'name', 'type', 'serial_number', 'is_active']
