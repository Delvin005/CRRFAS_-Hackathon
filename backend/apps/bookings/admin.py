from django.contrib import admin
from .models import Booking

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['title', 'resource', 'requested_by', 'start_time', 'end_time', 'status']
    list_filter = ['status', 'purpose', 'tenant']
    search_fields = ['title', 'requested_by__username']
