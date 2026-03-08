from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ResourceCategoryViewSet, ResourceTagViewSet, ResourceViewSet, 
    SubResourceUnitViewSet, MaintenanceScheduleViewSet, UtilizationLogViewSet,
    RoomResourceMappingViewSet
)

router = DefaultRouter()
router.register(r'categories', ResourceCategoryViewSet, basename='resource-category')
router.register(r'tags', ResourceTagViewSet, basename='resource-tag')
router.register(r'assets', ResourceViewSet, basename='resource')
router.register(r'items', SubResourceUnitViewSet, basename='sub-resource-unit')
router.register(r'maintenance', MaintenanceScheduleViewSet, basename='maintenance-schedule')
router.register(r'utilization', UtilizationLogViewSet, basename='utilization-log')
router.register(r'room-mappings', RoomResourceMappingViewSet, basename='room-resource-mapping')

urlpatterns = [
    path('', include(router.urls)),
]
