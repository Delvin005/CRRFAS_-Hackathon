"""
Tests for the Booking and Approval Workflow backend.

Covers:
- BookingRequest creation with auto policy decision
- Conflict detection (double booking rejected)
- Approve / Reject / Cancel / Complete state transitions
- Slot check endpoint
- Tenant isolation
"""
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import CustomUser, Role, UserTenantMembership
from tenants.models import Tenant
from facilities.models import Campus, Building, Floor, RoomType, Room
from bookings.models import BookingRequest, BookingApproval, BookingPolicyRule


def make_dt(hours_from_now=2):
    """Return a timezone-aware datetime offset from now."""
    return timezone.now() + timedelta(hours=hours_from_now)


class BookingWorkflowTests(TestCase):

    def setUp(self):
        """Set up two tenants, users with different roles, and a room."""
        # Roles
        self.role_admin,    _ = Role.objects.get_or_create(name='tenant_admin')
        self.role_manager,  _ = Role.objects.get_or_create(name='facility_manager')
        self.role_student,  _ = Role.objects.get_or_create(name='student')
        self.role_faculty,  _ = Role.objects.get_or_create(name='faculty')

        # Tenants
        self.tenant1 = Tenant.objects.create(
            name='College A', slug='college-a', subdomain='collegea', domain='collegea.test',
            contact_email='a@test.com', support_phone='0000000001',
        )
        self.tenant2 = Tenant.objects.create(
            name='College B', slug='college-b', subdomain='collegeb', domain='collegeb.test',
            contact_email='b@test.com', support_phone='0000000002',
        )

        # Users
        self.admin = CustomUser.objects.create_user(
            username='admin', email='admin@test.com', password='pass', first_name='Admin')
        self.manager = CustomUser.objects.create_user(
            username='manager', email='manager@test.com', password='pass', first_name='Manager')
        self.student = CustomUser.objects.create_user(
            username='student', email='student@test.com', password='pass', first_name='Student')
        self.other_user = CustomUser.objects.create_user(
            username='other', email='other@test.com', password='pass')

        # Memberships
        UserTenantMembership.objects.create(user=self.admin,   tenant=self.tenant1, role=self.role_admin,   is_active=True)
        UserTenantMembership.objects.create(user=self.manager, tenant=self.tenant1, role=self.role_manager, is_active=True)
        UserTenantMembership.objects.create(user=self.student, tenant=self.tenant1, role=self.role_student, is_active=True)
        UserTenantMembership.objects.create(user=self.other_user, tenant=self.tenant2, role=self.role_student, is_active=True)

        # Facility: Campus → Building → Floor → Room
        campus   = Campus.objects.create(
            tenant=self.tenant1, name='Main Campus', code='MAIN', address='City Center'
        )
        building = Building.objects.create(campus=campus, name='Block A', code='BLK-A')
        floor    = Floor.objects.create(building=building, floor_number=1, name='Ground Floor')
        room_type = RoomType.objects.create(tenant=self.tenant1, name='Seminar Hall')
        self.room = Room.objects.create(
            tenant=self.tenant1,
            campus=campus,
            building=building,
            floor=floor,
            room_number='SH-01',
            name='Seminar Hall 1',
            room_type=room_type,
            capacity=100,
        )

        self.client = APIClient()

    # ── 1. Admin can create a booking that is auto-approved ──────────────────
    def test_admin_booking_auto_approved(self):
        """facility_manager or higher should be auto-approved."""
        self.client.force_authenticate(user=self.manager)
        payload = {
            'room':        self.room.id,
            'title':       'Manager Direct Booking',
            'booking_type':'admin_meeting',
            'start_time':  make_dt(2).isoformat(),
            'end_time':    make_dt(3).isoformat(),
        }
        res = self.client.post('/api/bookings/requests/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'approved')
        self.assertTrue(res.data['auto_approved'])

    # ── 2. Student booking goes to pending ───────────────────────────────────
    def test_student_booking_requires_approval(self):
        """Student bookings must go to pending approval."""
        self.client.force_authenticate(user=self.student)
        payload = {
            'room':        self.room.id,
            'title':       'Student Event',
            'booking_type':'student_event',
            'start_time':  make_dt(4).isoformat(),
            'end_time':    make_dt(5).isoformat(),
        }
        res = self.client.post('/api/bookings/requests/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'pending')
        self.assertFalse(res.data['auto_approved'])

    # ── 3. Conflict detection blocks double booking ──────────────────────────
    def test_conflict_detection_blocks_double_booking(self):
        """Cannot book the same room in an overlapping slot."""
        self.client.force_authenticate(user=self.manager)
        start = make_dt(6)
        end   = make_dt(7)
        # First booking — should succeed
        payload = {'room': self.room.id, 'title': 'First Event',
                   'booking_type': 'seminar', 'start_time': start.isoformat(), 'end_time': end.isoformat()}
        res1 = self.client.post('/api/bookings/requests/', payload, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Second booking in same slot — should fail
        self.client.force_authenticate(user=self.student)
        payload['title'] = 'Conflicting Event'
        res2 = self.client.post('/api/bookings/requests/', payload, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)

    # ── 4. Approve a pending booking ─────────────────────────────────────────
    def test_approve_pending_booking(self):
        """Manager can approve a pending booking."""
        # Create a pending booking as student
        booking = BookingRequest.objects.create(
            tenant=self.tenant1, requester=self.student, room=self.room,
            title='Pending Student Event', booking_type='student_event',
            start_time=make_dt(10), end_time=make_dt(11), status='pending', requires_approval=True
        )
        self.client.force_authenticate(user=self.manager)
        res = self.client.post(f'/api/bookings/requests/{booking.id}/decide/',
                               {'decision': 'approved', 'comments': 'Looks good'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'approved')
        self.assertTrue(BookingApproval.objects.filter(booking=booking, decision='approved').exists())

    # ── 5. Reject a pending booking ──────────────────────────────────────────
    def test_reject_pending_booking(self):
        """Manager can reject a pending booking."""
        booking = BookingRequest.objects.create(
            tenant=self.tenant1, requester=self.student, room=self.room,
            title='Weekend Event', booking_type='student_event',
            start_time=make_dt(20), end_time=make_dt(21), status='pending', requires_approval=True
        )
        self.client.force_authenticate(user=self.manager)
        res = self.client.post(f'/api/bookings/requests/{booking.id}/decide/',
                               {'decision': 'rejected', 'comments': 'Not allowed on weekends'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'rejected')

    # ── 6. Cancel a booking ──────────────────────────────────────────────────
    def test_student_can_cancel_own_booking(self):
        """Requester can cancel their own booking."""
        booking = BookingRequest.objects.create(
            tenant=self.tenant1, requester=self.student, room=self.room,
            title='My Event', booking_type='student_event',
            start_time=make_dt(30), end_time=make_dt(31), status='pending', requires_approval=True
        )
        self.client.force_authenticate(user=self.student)
        res = self.client.post(f'/api/bookings/requests/{booking.id}/cancel/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'cancelled')

    # ── 7. Complete action ───────────────────────────────────────────────────
    def test_manager_can_complete_approved_booking(self):
        """Manager can mark an approved booking as completed."""
        booking = BookingRequest.objects.create(
            tenant=self.tenant1, requester=self.student, room=self.room,
            title='Done Event', booking_type='academic_workshop',
            start_time=make_dt(40), end_time=make_dt(41), status='approved', requires_approval=False
        )
        self.client.force_authenticate(user=self.manager)
        res = self.client.post(f'/api/bookings/requests/{booking.id}/complete/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'completed')

    # ── 8. Slot conflict check endpoint ─────────────────────────────────────
    def test_check_conflict_endpoint_available(self):
        """check_conflict returns available for a free slot."""
        self.client.force_authenticate(user=self.student)
        payload = {
            'room':       self.room.id,
            'start_time': make_dt(50).isoformat(),
            'end_time':   make_dt(51).isoformat(),
        }
        res = self.client.post('/api/bookings/requests/check_conflict/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['conflict'])

    # ── 9. Tenant isolation ──────────────────────────────────────────────────
    def test_tenant_isolation(self):
        """User from tenant2 cannot see tenant1 bookings."""
        BookingRequest.objects.create(
            tenant=self.tenant1, requester=self.student, room=self.room,
            title='Secret Event', booking_type='seminar',
            start_time=make_dt(60), end_time=make_dt(61), status='approved'
        )
        self.client.force_authenticate(user=self.other_user)
        res = self.client.get('/api/bookings/requests/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        # other_user belongs to tenant2 — should see 0 results
        count = res.data.get('count', len(res.data.get('results', res.data)))
        self.assertEqual(count, 0)

    # ── 10. Booking ref auto-generated ──────────────────────────────────────
    def test_booking_ref_auto_generated(self):
        """Booking ref must be auto-generated in BK-YYYYxxxx format."""
        booking = BookingRequest.objects.create(
            tenant=self.tenant1, requester=self.admin, room=self.room,
            title='Auto Ref Test', booking_type='seminar',
            start_time=make_dt(70), end_time=make_dt(71)
        )
        self.assertTrue(booking.booking_ref.startswith('BK-'))
        self.assertGreater(len(booking.booking_ref), 5)
