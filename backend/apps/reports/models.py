from django.db import models
from apps.tenants.models import Tenant

class Report(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='reports')
    title = models.CharField(max_length=200)
    report_type = models.CharField(max_length=50, choices=[
        ('booking_summary', 'Booking Summary'),
        ('resource_utilization', 'Resource Utilization'),
        ('department_usage', 'Department Usage'),
    ])
    generated_at = models.DateTimeField(auto_now_add=True)
    data = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.title} ({self.report_type})"

    class Meta:
        ordering = ['-generated_at']
