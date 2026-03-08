from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BookingRequestViewSet, BookingPolicyRuleViewSet, BookingApprovalViewSet,
    RecurringBookingViewSet, BookingConflictLogViewSet,
    BookingParticipantInfoViewSet, BookingAttachmentViewSet,
)

router = DefaultRouter()
router.register(r'requests',     BookingRequestViewSet,      basename='booking-request')
router.register(r'policies',     BookingPolicyRuleViewSet,   basename='booking-policy')
router.register(r'approvals',    BookingApprovalViewSet,     basename='booking-approval')
router.register(r'recurring',    RecurringBookingViewSet,    basename='recurring-booking')
router.register(r'conflicts',    BookingConflictLogViewSet,  basename='booking-conflict')
router.register(r'participants', BookingParticipantInfoViewSet, basename='booking-participant')
router.register(r'attachments',  BookingAttachmentViewSet,   basename='booking-attachment')

urlpatterns = [
    path('', include(router.urls)),
]
