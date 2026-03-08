from django.db import models
from core.models import AuditModel
from tenants.models import Tenant

class Campus(AuditModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='campuses')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True, null=True)
    address = models.TextField()
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('tenant', 'code')

    def __str__(self):
        return f"{self.name} ({self.code})"


class Building(AuditModel):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('maintenance', 'Under Maintenance'),
        ('closed', 'Closed'),
    ]

    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='buildings')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True, null=True)
    floors = models.IntegerField(default=1)  # Deprecated? Still useful for total count.
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    accessibility_flags = models.JSONField(default=dict, blank=True, help_text="Store accessible traits e.g., {'wheelchair': true, 'elevator': true}")
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('campus', 'code')
        
    @property
    def tenant(self):
        return self.campus.tenant

    def __str__(self):
        return f"{self.name} - {self.campus.code}"


class Floor(AuditModel):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='floor_levels')
    floor_number = models.IntegerField(help_text="Numeric floor representation (e.g. 1, 2, 0 for ground, -1 for basement)")
    name = models.CharField(max_length=100, help_text="e.g. Ground Floor, Mezzanine")
    map_url = models.URLField(blank=True, null=True, help_text="Link to floor plan image")

    class Meta:
        unique_together = ('building', 'floor_number')

    @property
    def tenant(self):
        return self.building.tenant

    def __str__(self):
        return f"{self.name} ({self.building.name})"


class RoomType(AuditModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='room_types')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('tenant', 'name')

    def __str__(self):
        return self.name


class FacilityTag(AuditModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='facility_tags')
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, blank=True, help_text="Optional icon identifier class")
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('tenant', 'name')

    def __str__(self):
        return self.name

class Room(AuditModel):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('maintenance', 'Under Maintenance'),
        ('booked', 'Booked/Occupied'),
        ('inactive', 'Inactive'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='rooms')
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='rooms')
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='rooms')
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name='rooms')
    
    room_number = models.CharField(max_length=50)
    name = models.CharField(max_length=255, blank=True)
    room_type = models.ForeignKey(RoomType, on_delete=models.SET_NULL, null=True, related_name='rooms')
    
    capacity = models.IntegerField(default=30)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    under_maintenance = models.BooleanField(default=False)
    
    accessibility_flags = models.JSONField(default=dict, blank=True, help_text="e.g., {'wheelchair': true, 'hearing_loop': false}")
    description = models.TextField(blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True, help_text="Optional owning department")
    
    available_facilities = models.ManyToManyField(FacilityTag, blank=True, related_name='rooms')
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('building', 'room_number')

    def __str__(self):
        return f"{self.room_number} - {self.building.name}"

# We can keep Resource to represent movable assets within a room (projectors, etc.)
class Resource(AuditModel):
    RESOURCE_TYPES = [
        ('projector', 'Projector'),
        ('whiteboard', 'Whiteboard'),
        ('computer', 'Computer'),
        ('microphone', 'Microphone'),
        ('other', 'Other'),
    ]

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='resources', null=True, blank=True)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='resources')
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=RESOURCE_TYPES)
    serial_number = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
