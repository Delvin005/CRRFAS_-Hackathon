from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.exams.views import (
    ExamPlanViewSet, ExamSessionViewSet, ExamCourseAssignmentViewSet,
    ExamHallAllocationViewSet, SeatingPlanViewSet
)

router = DefaultRouter()
router.register(r'plans', ExamPlanViewSet, basename='exam-plan')
router.register(r'sessions', ExamSessionViewSet, basename='exam-session')
router.register(r'course-assignments', ExamCourseAssignmentViewSet, basename='exam-course-assignment')
router.register(r'hall-allocations', ExamHallAllocationViewSet, basename='exam-hall-allocation')
router.register(r'seating-plans', SeatingPlanViewSet, basename='exam-seating-plan')

urlpatterns = [
    path('', include(router.urls)),
]
