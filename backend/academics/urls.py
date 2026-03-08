from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, CourseViewSet, TimetableSlotViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'timetable', TimetableSlotViewSet, basename='timetable')

urlpatterns = [
    path('', include(router.urls)),
]
