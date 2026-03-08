from django.db import models
from django.utils import timezone
from core.models import AuditModel
from tenants.models import Tenant
from facilities.models import Room

class ResourceCategory(AuditModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='resource_categories')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('tenant', 'name')

    def __str__(self):
        return f"{self.name} ({self.tenant.name})"

class ResourceTag(AuditModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='resource_tags')
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('tenant', 'name')

    def __str__(self):
        return self.name

class Resource(AuditModel):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('active', 'Active/In Use'),
        ('maintenance', 'Under Maintenance'),
        ('decommissioned', 'Decommissioned'),
        ('broken', 'Broken/Repair Needed'),
    ]

    MAINTENANCE_STATUS_CHOICES = [
        ('good', 'Good'),
        ('pending', 'Pending Maintenance'),
        ('overdue', 'Overdue'),
        ('critical', 'Critical Issue'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='managed_resources')
    resource_code = models.CharField(max_length=100)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(ResourceCategory, on_delete=models.CASCADE, related_name='resources')
    
    # Optional location and owning department
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='room_resources')
    department = models.CharField(max_length=255, blank=True, null=True)
    
    # Quantity tracking
    quantity_total = models.IntegerField(default=1)
    quantity_available = models.IntegerField(default=1)
    unit_type = models.CharField(max_length=50, default='Unit', help_text="e.g. System, Seat, Kit")
    
    # Booking styles
    bookable_as_whole = models.BooleanField(default=True)
    bookable_per_unit = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    maintenance_status = models.CharField(max_length=20, choices=MAINTENANCE_STATUS_CHOICES, default='good')
    
    tags = models.ManyToManyField(ResourceTag, blank=True, related_name='tagged_resources')
    
    requires_approval = models.BooleanField(default=False)
    restricted_roles = models.JSONField(default=list, blank=True, help_text="List of roles allowed to book this resource")
    
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('tenant', 'resource_code')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.resource_code})"

class SubResourceUnit(AuditModel):
    """
    For individual booking at system/seat level (e.g. System 05 in Computer Lab)
    """
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='sub_units')
    unit_identifier = models.CharField(max_length=100) # e.g. "SYS-001"
    status = models.CharField(max_length=20, choices=Resource.STATUS_CHOICES, default='available')
    is_bookable = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    @property
    def tenant(self):
        return self.resource.tenant

    def __str__(self):
        return f"{self.unit_identifier} of {self.resource.name}"

class LabInstrument(AuditModel):
    """
    Specialized data for Lab Instruments
    """
    resource = models.OneToOneField(Resource, on_delete=models.CASCADE, related_name='lab_details')
    model_number = models.CharField(max_length=100, blank=True)
    manufacturer = models.CharField(max_length=100, blank=True)
    last_calibration_date = models.DateField(null=True, blank=True)
    next_calibration_due = models.DateField(null=True, blank=True)
    safety_instructions = models.TextField(blank=True)
    is_high_precision = models.BooleanField(default=False)

    @property
    def tenant(self):
        return self.resource.tenant

    def __str__(self):
        return f"Lab Specs for {self.resource.name}"

class RoomResourceMapping(AuditModel):
    """
    Tracks how many of a particular resource type are in a room
    """
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='resource_mappings')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='room_mappings')
    quantity = models.IntegerField(default=1)

    class Meta:
        unique_together = ('room', 'resource')

    @property
    def tenant(self):
        return self.resource.tenant

class MaintenanceSchedule(AuditModel):
    TYPE_CHOICES = [
        ('routine', 'Routine Checkup'),
        ('repair', 'Repair'),
        ('calibration', 'Calibration'),
        ('upgrade', 'Software/Hardware Upgrade'),
    ]
    
    RESOURCE_STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='maintenance_schedules')
    maintenance_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    performed_by = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=RESOURCE_STATUS_CHOICES, default='scheduled')
    work_description = models.TextField(blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    @property
    def tenant(self):
        return self.resource.tenant

    def __str__(self):
        return f"{self.get_maintenance_type_display()} for {self.resource.name}"

class UtilizationLog(AuditModel):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='utilization_logs')
    sub_unit = models.ForeignKey(SubResourceUnit, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    usage_type = models.CharField(max_length=100, blank=True) # e.g. "Practical Exam", "Research"
    log_data = models.JSONField(default=dict, blank=True)

    @property
    def tenant(self):
        return self.resource.tenant

    def __str__(self):
        return f"Usage log for {self.resource.name} at {self.start_time}"
