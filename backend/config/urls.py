from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def api_root(request):
    return JsonResponse({
        "status": "ok",
        "message": "CRRFAS API is running",
        "version": "1.0.0",
        "endpoints": {
            "admin":            "/admin/",
            "auth_token":       "/api/auth/token/",
            "auth_refresh":     "/api/auth/token/refresh/",
            "tenants":          "/api/tenants/",
            "accounts":         "/api/accounts/",
            "campus":           "/api/campus/",
            "resources":        "/api/resources/",
            "bookings":         "/api/bookings/",
            "academics":        "/api/academics/",
            "timetable":        "/api/timetable/",
            "exams":            "/api/exams/",
            "reports":          "/api/reports/",
            "notifications":    "/api/notifications/",
        },
    })


def favicon(request):
    return JsonResponse({}, status=204)


urlpatterns = [
    path('', api_root, name='api_root'),
    path('favicon.ico', favicon),
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/tenants/', include('apps.tenants.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/campus/', include('apps.campus.urls')),
    path('api/resources/', include('apps.resources.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/academics/', include('apps.academics.urls')),
    path('api/timetable/', include('apps.timetable.urls')),
    path('api/exams/', include('apps.exams.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
