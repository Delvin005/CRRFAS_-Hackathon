from rest_framework import serializers
from .models import Campus, Building, Floor

class FloorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Floor
        fields = '__all__'

class BuildingSerializer(serializers.ModelSerializer):
    floors = FloorSerializer(many=True, read_only=True)
    class Meta:
        model = Building
        fields = '__all__'

class CampusSerializer(serializers.ModelSerializer):
    buildings = BuildingSerializer(many=True, read_only=True)
    class Meta:
        model = Campus
        fields = '__all__'
