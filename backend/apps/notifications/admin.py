from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['subject', 'recipient_email', 'is_sent', 'created_at']
    list_filter = ['is_sent', 'tenant']
