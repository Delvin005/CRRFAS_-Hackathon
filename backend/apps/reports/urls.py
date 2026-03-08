from django.urls import path
from .views import (
    RoomUtilizationReport,
    FacultyWorkloadReport,
    DepartmentTimetableReport,
    ResourceUtilizationReport,
    ExamScheduleReport,
    EventBookingsReport,
    LabEquipmentReport,
    SportsUtilizationReport,
)

urlpatterns = [
    path('room-utilization/',     RoomUtilizationReport.as_view(),     name='report-room-utilization'),
    path('faculty-workload/',     FacultyWorkloadReport.as_view(),     name='report-faculty-workload'),
    path('department-timetable/', DepartmentTimetableReport.as_view(), name='report-dept-timetable'),
    path('resource-utilization/', ResourceUtilizationReport.as_view(), name='report-resource-utilization'),
    path('exam-schedule/',        ExamScheduleReport.as_view(),        name='report-exam-schedule'),
    path('event-bookings/',       EventBookingsReport.as_view(),       name='report-event-bookings'),
    path('lab-equipment/',        LabEquipmentReport.as_view(),        name='report-lab-equipment'),
    path('sports-utilization/',   SportsUtilizationReport.as_view(),   name='report-sports-utilization'),
]
