from django.db import models
from apps.tenants.models import Tenant

class Notification(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='notifications')
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=255)
    message = models.TextField()
    is_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject} -> {self.recipient_email}"

    class Meta:
        ordering = ['-created_at']
