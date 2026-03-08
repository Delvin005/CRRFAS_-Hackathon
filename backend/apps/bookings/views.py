from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Booking
from .serializers import BookingSerializer, BookingApprovalSerializer

APPROVER_ROLES = ['tenant_admin', 'facility_manager', 'hod', 'dean']

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'purpose', 'resource']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return Booking.objects.all()
        return Booking.objects.filter(tenant=user.tenant)

    def perform_create(self, serializer):
        serializer.save(
            requested_by=self.request.user,
            tenant=self.request.user.tenant,
        )

    @action(detail=True, methods=['post'])
    def approve_reject(self, request, pk=None):
        booking = self.get_object()
        if request.user.role not in APPROVER_ROLES:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = BookingApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data['action'] == 'approve':
            booking.status = 'approved'
            booking.approved_by = request.user
        else:
            booking.status = 'rejected'
            booking.rejection_reason = serializer.validated_data.get('rejection_reason', '')

        booking.save()
        return Response(BookingSerializer(booking).data)
