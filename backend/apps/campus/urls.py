from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampusViewSet, BuildingViewSet, FloorViewSet

router = DefaultRouter()
router.register(r'campuses', CampusViewSet, basename='campus')
router.register(r'buildings', BuildingViewSet, basename='building')
router.register(r'floors', FloorViewSet, basename='floor')

urlpatterns = [path('', include(router.urls))]
