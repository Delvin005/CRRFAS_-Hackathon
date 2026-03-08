from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/tenants/', include('tenants.urls')),
    path('api/facilities/', include('facilities.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/academics/', include('academics.urls')),
    path('api/resources/', include('resources.urls')),
]
