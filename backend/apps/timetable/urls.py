from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TimetablePlanViewSet, WorkingDayViewSet, TimeSlotTemplateViewSet,
    ClassSessionViewSet, FacultyAssignmentViewSet, RoomAssignmentViewSet,
    TimetableChangeRequestViewSet, TimetablePublishLogViewSet,
    SeedTimetableView, CalendarFeedView
)

router = DefaultRouter()
router.register(r'plans', TimetablePlanViewSet, basename='timetable-plan')
router.register(r'working-days', WorkingDayViewSet, basename='working-day')
router.register(r'time-slot-templates', TimeSlotTemplateViewSet, basename='time-slot-template')
router.register(r'sessions', ClassSessionViewSet, basename='class-session')
router.register(r'faculty-assignments', FacultyAssignmentViewSet, basename='faculty-assignment')
router.register(r'room-assignments', RoomAssignmentViewSet, basename='room-assignment')
router.register(r'change-requests', TimetableChangeRequestViewSet, basename='change-request')
router.register(r'publish-logs', TimetablePublishLogViewSet, basename='publish-log')

urlpatterns = [
    path('calendar-feed/', CalendarFeedView.as_view(), name='calendar-feed'),
    path('', include(router.urls)),
    path('seed/', SeedTimetableView.as_view(), name='seed-timetable'),
]
