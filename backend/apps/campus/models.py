from django.db import models
from apps.tenants.models import Tenant

class Campus(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='campuses')
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.tenant.name} - {self.name}"

    class Meta:
        verbose_name_plural = 'Campuses'

class Building(models.Model):
    campus = models.ForeignKey(Campus, on_delete=models.CASCADE, related_name='buildings')
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, blank=True)
    total_floors = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.campus.name} - {self.name}"

class Floor(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name='floors')
    number = models.IntegerField()
    label = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.building.name} - Floor {self.number}"
