"""
Views for Booking and Approval Workflow.

Endpoints:
  /api/bookings/requests/           — list / create booking requests
  /api/bookings/requests/{id}/      — retrieve / update / delete
  /api/bookings/requests/{id}/decide/       — approve or reject (approvers only)
  /api/bookings/requests/{id}/cancel/       — cancel own booking
  /api/bookings/requests/{id}/complete/     — mark completed (admin/manager)
  /api/bookings/requests/{id}/check_conflict/  — check slot before submitting
  /api/bookings/policies/           — CRUD for BookingPolicyRule
  /api/bookings/approvals/          — list all approval decisions
  /api/bookings/recurring/          — CRUD for RecurringBooking
  /api/bookings/conflicts/          — read-only conflict audit log
"""

import datetime
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    BookingRequest, BookingApproval, BookingParticipantInfo,
    RecurringBooking, BookingAttachment, BookingPolicyRule, BookingConflictLog
)
from .serializers import (
    BookingRequestSerializer, BookingRequestListSerializer,
    ApprovalDecisionSerializer, BookingApprovalSerializer,
    BookingPolicyRuleSerializer, RecurringBookingSerializer,
    BookingConflictLogSerializer, BookingParticipantInfoSerializer,
    BookingAttachmentSerializer,
)
from core.permissions import IsTenantObjOwner, RequireRole


class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ─────────────────────────────────────────────────────────────────────────────
#  Helper: resolve tenant from user membership when hostname resolution fails
# ─────────────────────────────────────────────────────────────────────────────
def resolve_tenant(request):
    tenant = getattr(request, 'tenant', None)
    if not tenant and request.user.is_authenticated:
        membership = request.user.memberships.filter(is_active=True).select_related('tenant').first()
        if membership:
            tenant = membership.tenant
    return tenant


def get_user_role(request, tenant):
    """Return the current user's role name in the resolved tenant."""
    membership = request.user.memberships.filter(tenant=tenant, is_active=True).first()
    return membership.role.name if membership else 'student'


# ─────────────────────────────────────────────────────────────────────────────
#  Conflict Detection
# ─────────────────────────────────────────────────────────────────────────────
def detect_conflict(tenant, start_time, end_time, room=None, resource=None, sub_unit=None, exclude_id=None):
    """
    Returns the first conflicting approved BookingRequest, or None if slot is free.
    Checks overlap: existing.start < new.end AND existing.end > new.start
    """
    qs = BookingRequest.objects.filter(
        tenant=tenant,
        status__in=['pending', 'approved'],
        start_time__lt=end_time,
        end_time__gt=start_time,
    )
    if exclude_id:
        qs = qs.exclude(id=exclude_id)

    if sub_unit:
        return qs.filter(sub_unit=sub_unit).first()
    if resource:
        return qs.filter(resource=resource).first()
    if room:
        return qs.filter(room=room).first()
    return None


# ─────────────────────────────────────────────────────────────────────────────
#  Policy Engine — determines if booking needs approval
# ─────────────────────────────────────────────────────────────────────────────
def apply_policy(tenant, requester, booking_type, start_time, room=None, resource=None):
    """
    Returns (requires_approval: bool, approver_role: str).
    Evaluates all active BookingPolicyRules for the tenant.
    Falls back to conservative default: require approval.
    """
    # Get user's role
    membership = requester.memberships.filter(tenant=tenant, is_active=True).first()
    role_name = membership.role.name if membership else 'student'

    # High-privilege roles can direct-book where policy allows
    if role_name in ['super_admin', 'tenant_admin', 'facility_manager']:
        return False, 'facility_manager'

    # Check active policy rules
    rules = BookingPolicyRule.objects.filter(tenant=tenant, is_active=True)

    for rule in rules:
        role_match = (not rule.applies_to_roles) or (role_name in rule.applies_to_roles)
        type_match = (not rule.applies_to_booking_types) or (booking_type in rule.applies_to_booking_types)

        # After-hours check: outside 08:00–18:00 weekdays
        is_after_hours = False
        if rule.after_hours_only and start_time:
            local_hour = start_time.hour
            weekday = start_time.weekday()  # 0=Mon
            is_after_hours = (local_hour < 8 or local_hour >= 18) or (weekday >= 5)

        time_match = (not rule.after_hours_only) or is_after_hours

        if role_match and type_match and time_match:
            return rule.requires_approval, rule.approver_role

    # Conservative defaults when no rule matches
    if role_name in ['student', 'external_user']:
        return True, 'facility_manager'
    if role_name == 'research_scholar':
        return True, 'facility_manager'
    if resource and getattr(resource, 'requires_approval', False):
        return True, 'facility_manager'
    if room and getattr(room, 'room_type', None):
        # Auditoriums / seminar halls generally need approval
        try:
            rt_name = room.room_type.name.lower()
            if any(k in rt_name for k in ['auditorium', 'seminar', 'conference']):
                return True, 'facility_manager'
        except Exception:
            pass

    return False, 'facility_manager'


# ─────────────────────────────────────────────────────────────────────────────
#  BookingRequest ViewSet
# ─────────────────────────────────────────────────────────────────────────────
class BookingRequestViewSet(viewsets.ModelViewSet):
    serializer_class = BookingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'booking_type', 'room', 'resource']

    def get_serializer_class(self):
        if self.action == 'list':
            return BookingRequestListSerializer
        return BookingRequestSerializer

    def get_queryset(self):
        tenant = resolve_tenant(self.request)
        if not tenant:
            return BookingRequest.objects.none()

        qs = BookingRequest.objects.filter(tenant=tenant).select_related(
            'requester', 'room', 'resource', 'sub_unit', 'assigned_approver'
        ).prefetch_related('approvals')

        role = get_user_role(self.request, tenant)

        # Admins and managers see all tenant bookings
        if role in ['super_admin', 'tenant_admin', 'facility_manager', 'academic_admin']:
            return qs

        # Others see only their own bookings
        return qs.filter(requester=self.request.user)

    def perform_create(self, serializer):
        tenant   = resolve_tenant(self.request)
        requester = self.request.user
        data     = serializer.validated_data

        # ── 1. Conflict check ─────────────────────────────────────────────
        conflict = detect_conflict(
            tenant    = tenant,
            start_time = data['start_time'],
            end_time   = data['end_time'],
            room       = data.get('room'),
            resource   = data.get('resource'),
            sub_unit   = data.get('sub_unit'),
        )
        if conflict:
            # Log the conflict
            BookingConflictLog.objects.create(
                tenant           = tenant,
                attempted_by     = requester,
                conflicting_with = conflict,
                target_type      = 'room' if data.get('room') else ('resource' if data.get('resource') else 'sub_unit'),
                target_id        = (data.get('room') or data.get('resource') or data.get('sub_unit')).id,
                attempted_start  = data['start_time'],
                attempted_end    = data['end_time'],
                conflict_reason  = f"Conflicts with booking [{conflict.booking_ref}] — status: {conflict.status}",
            )
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                f"Slot conflict: [{conflict.booking_ref}] '{conflict.title}' is already "
                f"booked for this slot ({conflict.start_time} — {conflict.end_time})."
            )

        # ── 2. Apply policy ──────────────────────────────────────────────
        needs_approval, approver_role_name = apply_policy(
            tenant       = tenant,
            requester    = requester,
            booking_type = data.get('booking_type', 'other'),
            start_time   = data['start_time'],
            room         = data.get('room'),
            resource     = data.get('resource'),
        )

        final_status  = 'pending' if needs_approval else 'approved'
        auto_approved = not needs_approval

        # Find the appropriate approver user
        assigned_approver = None
        if needs_approval:
            from accounts.models import UserTenantMembership
            approver_membership = UserTenantMembership.objects.filter(
                tenant=tenant, role__name=approver_role_name, is_active=True
            ).first()
            if approver_membership:
                assigned_approver = approver_membership.user

        # ── 3. Build calendar event data ─────────────────────────────────
        calendar_data = {
            'title':      data.get('title'),
            'start':      data['start_time'].isoformat(),
            'end':        data['end_time'].isoformat(),
            'type':       data.get('booking_type'),
            'location':   str(data.get('room') or data.get('resource') or ''),
            'created_by': requester.email,
        }

        # ── 4. Save ───────────────────────────────────────────────────────
        instance = serializer.save(
            tenant            = tenant,
            requester         = requester,
            status            = final_status,
            requires_approval = needs_approval,
            auto_approved     = auto_approved,
            assigned_approver = assigned_approver,
            calendar_event_data = calendar_data,
        )

        # ── 5. If auto-approved, create an approval record ─────────────────
        if auto_approved:
            BookingApproval.objects.create(
                booking  = instance,
                approver = requester,
                decision = 'approved',
                comments = 'Auto-approved by policy (high-privilege role).',
            )

    # ── Approve / Reject action ──────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='decide')
    def decide(self, request, pk=None):
        """
        Approver calls this endpoint to approve or reject a booking.
        POST /api/bookings/requests/{id}/decide/
        Body: { "decision": "approved"|"rejected"|"forwarded", "comments": "..." }
        """
        booking = self.get_object()
        tenant  = resolve_tenant(request)
        role    = get_user_role(request, tenant)

        # Only managers/admins can decide
        if role not in ['super_admin', 'tenant_admin', 'facility_manager', 'academic_admin']:
            return Response({'error': 'Only facility managers or admins can approve/reject bookings.'},
                            status=status.HTTP_403_FORBIDDEN)

        if booking.status not in ['pending']:
            return Response({'error': f'Cannot decide on a booking with status: {booking.status}'},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer = ApprovalDecisionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        decision = serializer.validated_data['decision']
        comments = serializer.validated_data.get('comments', '')

        # Record the approval
        BookingApproval.objects.create(
            booking  = booking,
            approver = request.user,
            decision = decision,
            comments = comments,
        )

        # Update booking status
        if decision == 'approved':
            booking.status = 'approved'
        elif decision == 'rejected':
            booking.status = 'rejected'
        # 'forwarded' keeps it pending but records the forwarding step
        booking.save()

        return Response(BookingRequestSerializer(booking, context={'request': request}).data)

    # ── Cancel action ────────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """Requester or admin can cancel a booking."""
        booking = self.get_object()
        tenant  = resolve_tenant(request)
        role    = get_user_role(request, tenant)

        is_owner = booking.requester == request.user
        is_admin = role in ['super_admin', 'tenant_admin', 'facility_manager']

        if not (is_owner or is_admin):
            return Response({'error': 'You can only cancel your own bookings.'},
                            status=status.HTTP_403_FORBIDDEN)

        if booking.status in ['completed', 'cancelled']:
            return Response({'error': f'Cannot cancel a booking with status: {booking.status}'},
                            status=status.HTTP_400_BAD_REQUEST)

        booking.status = 'cancelled'
        booking.save()
        return Response({'message': f'Booking [{booking.booking_ref}] has been cancelled.'})

    # ── Complete action ──────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        """Admin/manager marks an approved booking as completed after the event."""
        booking = self.get_object()
        tenant  = resolve_tenant(request)
        role    = get_user_role(request, tenant)

        if role not in ['super_admin', 'tenant_admin', 'facility_manager']:
            return Response({'error': 'Only managers can mark bookings as completed.'},
                            status=status.HTTP_403_FORBIDDEN)

        if booking.status != 'approved':
            return Response({'error': 'Only approved bookings can be marked complete.'},
                            status=status.HTTP_400_BAD_REQUEST)

        booking.status = 'completed'
        booking.save()
        return Response({'message': f'Booking [{booking.booking_ref}] marked as completed.'})

    # ── Slot conflict check action ────────────────────────────────────────────
    @action(detail=False, methods=['post'], url_path='check_conflict')
    def check_conflict(self, request):
        """
        Pre-check for conflicts before submitting a booking.
        POST /api/bookings/requests/check_conflict/
        Body: { "start_time": "...", "end_time": "...", "room": id, "resource": id, "sub_unit": id }
        """
        tenant     = resolve_tenant(request)
        start_time = request.data.get('start_time')
        end_time   = request.data.get('end_time')
        room_id    = request.data.get('room')
        resource_id = request.data.get('resource')
        sub_unit_id = request.data.get('sub_unit')

        if not start_time or not end_time:
            return Response({'error': 'start_time and end_time are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        from django.utils.dateparse import parse_datetime
        from resources.models import Resource, SubResourceUnit
        from facilities.models import Room

        start = parse_datetime(start_time)
        end   = parse_datetime(end_time)
        room  = Room.objects.filter(id=room_id).first() if room_id else None
        res   = Resource.objects.filter(id=resource_id).first() if resource_id else None
        unit  = SubResourceUnit.objects.filter(id=sub_unit_id).first() if sub_unit_id else None

        conflict = detect_conflict(tenant, start, end, room=room, resource=res, sub_unit=unit)
        if conflict:
            return Response({
                'conflict': True,
                'conflicting_booking': {
                    'booking_ref':  conflict.booking_ref,
                    'title':        conflict.title,
                    'status':       conflict.status,
                    'start_time':   conflict.start_time,
                    'end_time':     conflict.end_time,
                }
            })
        return Response({'conflict': False, 'message': 'Slot is available.'})


# ─────────────────────────────────────────────────────────────────────────────
#  Supporting ViewSets
# ─────────────────────────────────────────────────────────────────────────────

class BookingPolicyRuleViewSet(viewsets.ModelViewSet):
    serializer_class = BookingPolicyRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        tenant = resolve_tenant(self.request)
        return BookingPolicyRule.objects.filter(tenant=tenant) if tenant else BookingPolicyRule.objects.none()

    def perform_create(self, serializer):
        serializer.save(tenant=resolve_tenant(self.request))


class BookingApprovalViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only view of all approval decisions for the tenant."""
    serializer_class = BookingApprovalSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        tenant = resolve_tenant(self.request)
        if not tenant:
            return BookingApproval.objects.none()
        return BookingApproval.objects.filter(booking__tenant=tenant).select_related('approver', 'booking')


class RecurringBookingViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringBookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        tenant = resolve_tenant(self.request)
        if not tenant:
            return RecurringBooking.objects.none()
        return RecurringBooking.objects.filter(tenant=tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=resolve_tenant(self.request), requester=self.request.user)


class BookingConflictLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only audit log of conflict events."""
    serializer_class = BookingConflictLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        tenant = resolve_tenant(self.request)
        return BookingConflictLog.objects.filter(tenant=tenant) if tenant else BookingConflictLog.objects.none()


class BookingParticipantInfoViewSet(viewsets.ModelViewSet):
    serializer_class = BookingParticipantInfoSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        tenant = resolve_tenant(self.request)
        if not tenant:
            return BookingParticipantInfo.objects.none()
        return BookingParticipantInfo.objects.filter(booking__tenant=tenant)


class BookingAttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = BookingAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardPagination

    def get_queryset(self):
        tenant = resolve_tenant(self.request)
        if not tenant:
            return BookingAttachment.objects.none()
        return BookingAttachment.objects.filter(booking__tenant=tenant)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
