from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CampusViewSet, BuildingViewSet, FloorViewSet, 
    RoomTypeViewSet, FacilityTagViewSet, RoomViewSet, ResourceViewSet
)

router = DefaultRouter()
router.register(r'campuses', CampusViewSet, basename='campus')
router.register(r'buildings', BuildingViewSet, basename='building')
router.register(r'floors', FloorViewSet, basename='floor')
router.register(r'room-types', RoomTypeViewSet, basename='room-type')
router.register(r'facility-tags', FacilityTagViewSet, basename='facility-tag')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'resources', ResourceViewSet, basename='resource')

urlpatterns = [
    path('', include(router.urls)),
]
