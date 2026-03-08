from django.utils import timezone
from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    TimetablePlan, WorkingDay, TimeSlotTemplate, ClassSession,
    FacultyAssignment, RoomAssignment, TimetablePublishLog, TimetableChangeRequest,
)
from .serializers import (
    TimetablePlanSerializer, WorkingDaySerializer, TimeSlotTemplateSerializer,
    ClassSessionSerializer, FacultyAssignmentSerializer, RoomAssignmentSerializer,
    TimetablePublishLogSerializer, TimetableChangeRequestSerializer,
    ConflictCheckSerializer, PublishActionSerializer, ReviewChangeRequestSerializer,
)
from .conflict_service import run_all_conflict_checks
from apps.academics.models import FacultyProfile, Section, Batch
from apps.resources.models import Resource


def is_super_admin(user):
    return user.role == 'super_admin' or user.is_superuser


def get_tenant(user):
    return user.tenant


# ── TimetablePlan ViewSet ─────────────────────────────────────────────────────

class TimetablePlanViewSet(viewsets.ModelViewSet):
    serializer_class = TimetablePlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'is_published', 'department', 'semester', 'academic_year']

    def get_queryset(self):
        user = self.request.user
        qs = TimetablePlan.objects.select_related(
            'tenant', 'academic_year', 'semester', 'department', 'created_by', 'published_by'
        )
        if is_super_admin(user):
            return qs
        return qs.filter(tenant=user.tenant)

    def perform_create(self, serializer):
        tenant = self.request.user.tenant
        if not tenant:
            # If a superuser creates a plan, pick the tenant from the selected department
            department = serializer.validated_data.get('department')
            if department:
                tenant = department.tenant
        serializer.save(tenant=tenant, created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='publish-action')
    def publish_action(self, request, pk=None):
        """
        POST /timetable/plans/{id}/publish-action/
        Body: { "action": "publish" | "unpublish" | "archive", "notes": "" }

        Validates: no duplicate published plan for same semester.
        """
        plan = self.get_object()
        serializer = PublishActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        act = serializer.validated_data['action']
        notes = serializer.validated_data.get('notes', '')

        # Validation: only one published plan per semester
        if act == 'publish':
            existing = TimetablePlan.objects.filter(
                tenant=plan.tenant,
                semester=plan.semester,
                is_published=True,
            ).exclude(pk=plan.pk)
            if existing.exists():
                return Response(
                    {'error': 'Another plan is already published for this semester. Unpublish it first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            plan.is_published = True
            plan.status = 'published'
            plan.published_by = request.user
            plan.published_at = timezone.now()

        elif act == 'unpublish':
            plan.is_published = False
            plan.status = 'draft'
            plan.published_by = None
            plan.published_at = None

        elif act == 'archive':
            plan.status = 'archived'
            plan.is_published = False

        plan.save()

        # Write publish log
        TimetablePublishLog.objects.create(
            plan=plan, action=act,
            performed_by=request.user, notes=notes
        )

        return Response(TimetablePlanSerializer(plan).data)

    @action(detail=True, methods=['get'], url_path='publish-log')
    def publish_log(self, request, pk=None):
        plan = self.get_object()
        logs = plan.publish_logs.all()
        return Response(TimetablePublishLogSerializer(logs, many=True).data)

    @action(detail=True, methods=['post'], url_path='auto-schedule')
    def auto_schedule(self, request, pk=None):
        """
        POST /timetable/plans/{id}/auto-schedule/
        Generates draft sessions automatically.
        """
        plan = self.get_object()
        if plan.is_published:
            return Response({'error': 'Cannot modify a published plan.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from .services.scheduler import TimetableScheduler
            scheduler = TimetableScheduler(plan.id)
            stats = scheduler.generate()
            return Response({'success': True, 'stats': stats})
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ── WorkingDay & TimeSlotTemplate ─────────────────────────────────────────────

class WorkingDayViewSet(viewsets.ModelViewSet):
    serializer_class = WorkingDaySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['day', 'is_working', 'department']

    def get_queryset(self):
        user = self.request.user
        qs = WorkingDay.objects.select_related('tenant', 'department')
        if is_super_admin(user):
            return qs
        return qs.filter(tenant=user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class TimeSlotTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = TimeSlotTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = TimeSlotTemplate.objects.all()
        if is_super_admin(user):
            return qs
        return qs.filter(tenant=user.tenant)

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


# ── ClassSession ViewSet ──────────────────────────────────────────────────────

class ClassSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['plan', 'day', 'session_type', 'status', 'department', 'semester', 'section', 'batch', 'course']

    def get_queryset(self):
        user = self.request.user
        qs = ClassSession.objects.select_related(
            'plan', 'tenant', 'academic_year', 'semester', 'department',
            'course', 'course_section', 'batch', 'section'
        ).prefetch_related('faculty_assignments__faculty__user', 'room_assignments__room')
        if is_super_admin(user):
            return qs
        return qs.filter(tenant=user.tenant)

    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
        )

    @action(detail=False, methods=['post'], url_path='check-conflicts')
    def check_conflicts(self, request):
        """
        POST /timetable/sessions/check-conflicts/
        Validate a proposed session slot for all conflict types.
        Returns { "conflicts": [...], "ok": bool }
        """
        ser = ConflictCheckSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        data = ser.validated_data

        # Resolve FKs
        faculty_profiles = list(
            FacultyProfile.objects.filter(id__in=data.get('faculty_profile_ids', []))
        )
        rooms = list(Resource.objects.filter(id__in=data.get('room_ids', [])))
        
        section = None
        if data.get('course_section_id'):
            from apps.academics.models import CourseSection
            section = CourseSection.objects.filter(id=data.get('course_section_id')).first()
        elif data.get('section_id'):
            section = Section.objects.filter(id=data.get('section_id')).first()
            
        batch = Batch.objects.filter(id=data.get('batch_id')).first() if data.get('batch_id') else None

        conflicts = run_all_conflict_checks(
            day=data['day'],
            start_time=data['start_time'],
            end_time=data['end_time'],
            faculty_profile_ids=[fp.id for fp in faculty_profiles],
            room_ids=[r.id for r in rooms],
            rooms=rooms,
            section=section,
            batch=batch,
            session_type=data.get('session_type', 'lecture'),
            exclude_session_id=data.get('exclude_session_id'),
        )

        return Response({'conflicts': conflicts, 'ok': len(conflicts) == 0})


# ── FacultyAssignment & RoomAssignment ────────────────────────────────────────

class FacultyAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = FacultyAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['session', 'faculty', 'is_primary']

    def get_queryset(self):
        user = self.request.user
        qs = FacultyAssignment.objects.select_related('session', 'faculty__user')
        if is_super_admin(user):
            return qs
        return qs.filter(session__tenant=user.tenant)

    def perform_create(self, serializer):
        # Conflict check before saving
        fa = serializer.validated_data
        session = fa['session']
        faculty = fa['faculty']

        conflicts = run_all_conflict_checks(
            day=session.day,
            start_time=session.start_time,
            end_time=session.end_time,
            faculty_profile_ids=[faculty.id],
            exclude_session_id=session.id,
        )
        if conflicts:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'conflicts': conflicts})
        serializer.save()


class RoomAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = RoomAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['session', 'room']

    def get_queryset(self):
        user = self.request.user
        qs = RoomAssignment.objects.select_related('session', 'room')
        if is_super_admin(user):
            return qs
        return qs.filter(session__tenant=user.tenant)

    def perform_create(self, serializer):
        ra = serializer.validated_data
        session = ra['session']
        room = ra['room']

        conflicts = run_all_conflict_checks(
            day=session.day,
            start_time=session.start_time,
            end_time=session.end_time,
            room_ids=[room.id],
            rooms=[room],
            section=session.section,
            batch=session.batch,
            session_type=session.session_type,
            exclude_session_id=session.id,
        )
        if conflicts:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'conflicts': conflicts})
        serializer.save()


# ── Change Request ViewSet ────────────────────────────────────────────────────

class TimetableChangeRequestViewSet(viewsets.ModelViewSet):
    serializer_class = TimetableChangeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'session']

    def get_queryset(self):
        user = self.request.user
        qs = TimetableChangeRequest.objects.select_related('session__course', 'requested_by', 'reviewed_by')
        if is_super_admin(user):
            return qs
        return qs.filter(session__tenant=user.tenant)

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):
        """
        POST /timetable/change-requests/{id}/review/
        Body: { "action": "approved" | "rejected", "review_notes": "" }
        Admins and HoDs only.
        """
        if request.user.role not in ('super_admin', 'tenant_admin', 'hod'):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        cr = self.get_object()
        ser = ReviewChangeRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        cr.status = ser.validated_data['action']
        cr.reviewed_by = request.user
        cr.reviewed_at = timezone.now()
        cr.review_notes = ser.validated_data.get('review_notes', '')
        cr.save()

        return Response(TimetableChangeRequestSerializer(cr).data)


# ── Publish Log ViewSet (read-only) ───────────────────────────────────────────

class TimetablePublishLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TimetablePublishLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['plan', 'action']

    def get_queryset(self):
        user = self.request.user
        qs = TimetablePublishLog.objects.select_related('plan', 'performed_by')
        if is_super_admin(user):
            return qs
        return qs.filter(plan__tenant=user.tenant)


# ── Seed data view ────────────────────────────────────────────────────────────

class SeedTimetableView(generics.CreateAPIView):
    """POST /timetable/seed/ — creates a draft plan with sample time slot templates."""
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ('super_admin', 'tenant_admin'):
            return Response({'error': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)

        tenant = request.user.tenant

        templates = [
            ('Period 1', '08:00', '09:00', 1),
            ('Period 2', '09:00', '10:00', 2),
            ('Period 3', '10:15', '11:15', 3),
            ('Period 4', '11:15', '12:15', 4),
            ('Period 5', '13:00', '14:00', 5),
            ('Period 6', '14:00', '15:00', 6),
            ('Lab Session A', '08:00', '10:00', 7),
            ('Lab Session B', '10:15', '12:15', 8),
        ]
        created = []
        for label, start, end, order in templates:
            obj, new = TimeSlotTemplate.objects.get_or_create(
                tenant=tenant, label=label,
                defaults={'start_time': start, 'end_time': end, 'order': order}
            )
            if new:
                created.append(label)

        # Working days Mon-Sat
        from apps.academics.models import Department
        for day in ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']:
            WorkingDay.objects.get_or_create(
                tenant=tenant, department=None, day=day,
                defaults={'is_working': day != 'sun'}
            )

        return Response({'status': 'Seeded', 'time_slot_templates_created': created})


from rest_framework.views import APIView
from django.utils.dateparse import parse_date, parse_datetime
from django.utils import timezone
from datetime import datetime, timedelta

class CalendarFeedView(APIView):
    """
    Unified feed returning events from:
    1. Timetable ClassSessions
    2. Event/Maintenance ResourceBookings
    3. ExamSessions (via ExamHallAllocations/ExamPlans)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        tenant = request.user.tenant
        
        # Parse Dates
        start_str = request.query_params.get('start')
        end_str = request.query_params.get('end')
        
        try:
            start_date = parse_datetime(start_str).date() if start_str else timezone.now().date()
            end_date = parse_datetime(end_str).date() if end_str else timezone.now().date() + timedelta(days=30)
        except:
            start_date = timezone.now().date()
            end_date = start_date + timedelta(days=30)

        # Filters
        room_id = request.query_params.get('room_id')
        faculty_id = request.query_params.get('faculty_id')
        department_id = request.query_params.get('department_id')

        events = []

        # 1. Fetch ClassSessions
        # A class session repeats weekly based on its ClassSession.day, 
        # but to feed a calendar we need concrete dates.
        # For simplicity, we will query published TimetablePlans active in this period,
        # and project their weekly schedule onto the concrete dates between start_date and end_date.
        from apps.timetable.models import TimetablePlan, ClassSession
        from apps.accounts.models import User
        
        plans = TimetablePlan.objects.filter(tenant=tenant, is_published=True)
        # Assuming plans are active during their semester (simplification: they are active always for this demo unless we add start/end dates to plans)
        
        # Get distinct sessions applying filters
        sessions_query = ClassSession.objects.filter(plan__in=plans)
        
        if room_id:
            sessions_query = sessions_query.filter(room_assignments__room_id=room_id)
        if faculty_id:
            sessions_query = sessions_query.filter(faculty_assignments__faculty_id=faculty_id)
        if department_id:
            sessions_query = sessions_query.filter(plan__department_id=department_id)
            
        sessions = sessions_query.distinct().prefetch_related('faculty_assignments__faculty', 'room_assignments__room')

        # Day name to integer mapping (0=Monday, 6=Sunday)
        day_map = {
            'monday': 0, 'tuesday': 1, 'wednesday': 2, 
            'thursday': 3, 'friday': 4, 'saturday': 5, 'sunday': 6
        }

        # Project recurring classes onto date range
        current_date = start_date
        while current_date <= end_date:
            weekday = current_date.weekday()
            # Find sessions matching this weekday
            daily_sessions = [s for s in sessions if day_map.get(s.day.lower(), -1) == weekday]
            
            for s in daily_sessions:
                # Build titles
                course_label = s.course_section.course.code if hasattr(s, 'course_section') and s.course_section else "Session"
                faculties = ", ".join([f.faculty.user.first_name or f.faculty.user.username for f in s.faculty_assignments.all()])
                rooms = ", ".join([r.room.name for r in s.room_assignments.all()])
                
                title = f"[{course_label}] {s.session_type}"
                if faculties: title += f" | {faculties}"
                if rooms: title += f" ({rooms})"
                
                events.append({
                    'id': f"tt_{s.id}_{current_date.isoformat()}",
                    'title': title,
                    'start': f"{current_date.isoformat()}T{s.start_time}",
                    'end': f"{current_date.isoformat()}T{s.end_time}",
                    'extendedProps': {
                        'type': 'timetable',
                        'sessionType': s.session_type,
                        'rooms': rooms,
                        'faculties': faculties,
                    },
                    'backgroundColor': '#3b82f6', # blue-500
                    'borderColor': '#2563eb',
                })
            
            current_date += timedelta(days=1)

        # 2. Fetch Exams
        from apps.exams.models import ExamSession, ExamHallAllocation
        exams_query = ExamSession.objects.filter(plan__tenant=tenant, date__range=[start_date, end_date], plan__is_published=True)
        if department_id:
            # Simple assumption: exams don't belong to a single dept, omit strict dept filter or apply to courses
            pass
            
        allocations = ExamHallAllocation.objects.filter(session__in=exams_query).select_related('session', 'resource')
        
        if room_id:
            allocations = allocations.filter(resource_id=room_id)
            
        # Group allocations by session and room
        for alloc in allocations:
            s_date = alloc.session.date.isoformat()
            events.append({
                'id': f"exm_{alloc.id}",
                'title': f"Exam ({alloc.resource.name}) - {alloc.session.session_type}",
                'start': f"{s_date}T{alloc.session.start_time}",
                'end': f"{s_date}T{alloc.session.end_time}",
                'extendedProps': {
                    'type': 'exam',
                    'rooms': alloc.resource.name,
                    'sessionType': alloc.session.session_type,
                },
                'backgroundColor': '#8b5cf6', # violet-500
                'borderColor': '#7c3aed',
            })

        # 3. Fetch Bookings (Events & Maintenance)
        from apps.bookings.models import ResourceBooking
        bookings_query = ResourceBooking.objects.filter(
            tenant=tenant, 
            status='approved',
            start_time__date__lte=end_date,
            end_time__date__gte=start_date
        ).select_related('resource')

        if room_id:
            bookings_query = bookings_query.filter(resource_id=room_id)
            
        for bk in bookings_query:
            color = '#f59e0b' if bk.booking_type == 'event' else '#ef4444' # amber for event, red for maintenance
            border = '#d97706' if bk.booking_type == 'event' else '#dc2626'
            events.append({
                'id': f"bk_{bk.id}",
                'title': f"{bk.title} ({bk.resource.name})",
                'start': bk.start_time.isoformat(),
                'end': bk.end_time.isoformat(),
                'extendedProps': {
                    'type': 'booking',
                    'bookingType': bk.booking_type,
                    'rooms': bk.resource.name,
                    'user': bk.user.username,
                },
                'backgroundColor': color,
                'borderColor': border,
            })

        return Response(events)

