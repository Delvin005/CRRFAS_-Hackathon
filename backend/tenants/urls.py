from django.urls import path
from .views import ProvisionTenantView, TenantDetailView, TenantUpdateView

urlpatterns = [
    path('provision/', ProvisionTenantView.as_view(), name='tenant_provision'),
    path('current/', TenantDetailView.as_view(), name='tenant_current'),
    path('update/', TenantUpdateView.as_view(), name='tenant_update'),
]
