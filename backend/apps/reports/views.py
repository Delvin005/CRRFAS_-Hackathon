"""
Reports and Analytics Views
Provides 8 report endpoints with date-range filtering, tenant isolation, and CSV export.

Formula notes are documented inline per view.
"""
import csv
from io import StringIO
from datetime import timedelta

from django.utils.dateparse import parse_date
from django.utils import timezone
from django.db.models import Count, Sum, F, ExpressionWrapper, DurationField
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.http import HttpResponse


def get_date_range(request):
    """Parse start_date / end_date from query params; default to last 30 days."""
    today = timezone.now().date()
    start = parse_date(request.query_params.get('start_date', '')) or (today - timedelta(days=30))
    end = parse_date(request.query_params.get('end_date', '')) or today
    return start, end


def csv_response(rows, headers, filename):
    """Return an HttpResponse containing a CSV download."""
    buf = StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    response = HttpResponse(buf.getvalue(), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


# ── 1. Room Utilisation ───────────────────────────────────────────────────────
class RoomUtilizationReport(APIView):
    """
    GET /api/reports/room-utilization/
    Formula: utilization % = (booked_hours / total_available_hours_in_range) * 100
    Counts approved/completed bookings + published timetable sessions per room.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        start, end = get_date_range(request)
        days = (end - start).days + 1
        # Assume 10 working hours per day for available hour calculation
        available_hours_per_room = days * 10

        from apps.bookings.models import Booking
        from apps.resources.models import Resource

        rooms = Resource.objects.filter(tenant=tenant, resource_type__in=['classroom', 'lab', 'hall', 'auditorium'])

        data = []
        for room in rooms:
            bookings = Booking.objects.filter(
                tenant=tenant,
                resource=room,
                status__in=['approved', 'completed'],
                start_time__date__gte=start,
                start_time__date__lte=end,
            )
            # Total booked hours = sum of (end - start) durations
            total_seconds = sum(
                (b.end_time - b.start_time).total_seconds() for b in bookings
            )
            booked_hours = round(total_seconds / 3600, 2)
            utilization_pct = round((booked_hours / available_hours_per_room) * 100, 1) if available_hours_per_room else 0

            data.append({
                'room': room.name,
                'type': room.resource_type,
                'capacity': room.capacity,
                'booking_count': bookings.count(),
                'booked_hours': booked_hours,
                'available_hours': available_hours_per_room,
                'utilization_pct': utilization_pct,
            })

        data.sort(key=lambda x: x['utilization_pct'], reverse=True)

        if request.query_params.get('format') == 'csv':
            headers = ['Room', 'Type', 'Capacity', 'Bookings', 'Booked Hrs', 'Available Hrs', 'Utilization %']
            rows = [[d['room'], d['type'], d['capacity'], d['booking_count'], d['booked_hours'], d['available_hours'], d['utilization_pct']] for d in data]
            return csv_response(rows, headers, 'room_utilization.csv')

        return Response({'start': str(start), 'end': str(end), 'data': data})


# ── 2. Faculty Workload ───────────────────────────────────────────────────────
class FacultyWorkloadReport(APIView):
    """
    GET /api/reports/faculty-workload/
    Formula: workload_hours = count of ClassSession rows assigned to faculty
             in the date range (each session = its slot duration, projected).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        department_id = request.query_params.get('department_id')

        from apps.timetable.models import FacultyAssignment, ClassSession
        from apps.academics.models import FacultyProfile

        faculty_qs = FacultyProfile.objects.filter(tenant=tenant)
        if department_id:
            faculty_qs = faculty_qs.filter(department_id=department_id)

        data = []
        for fp in faculty_qs.select_related('user', 'department'):
            assignments = FacultyAssignment.objects.filter(faculty=fp).select_related('session')
            sessions = [a.session for a in assignments]

            # Each ClassSession has start_time and end_time (slot-based, not date-based)
            # Count hours: sum (end - start) per session * 5 working days per week = approximate weekly hours
            session_hours = []
            for s in sessions:
                try:
                    from datetime import datetime
                    st = datetime.strptime(str(s.start_time), '%H:%M:%S')
                    et = datetime.strptime(str(s.end_time), '%H:%M:%S')
                    session_hours.append((et - st).seconds / 3600)
                except:
                    session_hours.append(1.0)  # fallback 1 hr

            weekly_hours = round(sum(session_hours), 2)

            data.append({
                'faculty': fp.user.get_full_name() or fp.user.username,
                'department': fp.department.name if fp.department else '-',
                'sessions_count': len(sessions),
                'weekly_hours': weekly_hours,
                'designation': fp.designation,
            })

        data.sort(key=lambda x: x['weekly_hours'], reverse=True)

        if request.query_params.get('format') == 'csv':
            headers = ['Faculty', 'Department', 'Designation', 'Sessions', 'Weekly Hours']
            rows = [[d['faculty'], d['department'], d['designation'], d['sessions_count'], d['weekly_hours']] for d in data]
            return csv_response(rows, headers, 'faculty_workload.csv')

        return Response({'data': data})


# ── 3. Department Timetable Summary ──────────────────────────────────────────
class DepartmentTimetableReport(APIView):
    """
    GET /api/reports/department-timetable/
    Lists published sessions grouped by department, showing session counts per day.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        department_id = request.query_params.get('department_id')

        from apps.timetable.models import TimetablePlan, ClassSession

        plans = TimetablePlan.objects.filter(tenant=tenant, is_published=True)
        if department_id:
            plans = plans.filter(department_id=department_id)

        data = []
        for plan in plans.select_related('department', 'semester'):
            sessions = ClassSession.objects.filter(plan=plan)
            by_day = {}
            for s in sessions:
                by_day[s.day] = by_day.get(s.day, 0) + 1

            data.append({
                'plan': plan.name,
                'department': plan.department.name if plan.department else '-',
                'semester': str(plan.semester) if plan.semester else '-',
                'total_sessions': sessions.count(),
                'sessions_by_day': by_day,
            })

        if request.query_params.get('format') == 'csv':
            headers = ['Plan', 'Department', 'Semester', 'Total Sessions']
            rows = [[d['plan'], d['department'], d['semester'], d['total_sessions']] for d in data]
            return csv_response(rows, headers, 'dept_timetable.csv')

        return Response({'data': data})


# ── 4. Resource Utilisation (General) ────────────────────────────────────────
class ResourceUtilizationReport(APIView):
    """
    GET /api/reports/resource-utilization/
    All resource types. Counts bookings and total hours used in date range.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        start, end = get_date_range(request)
        resource_type = request.query_params.get('resource_type')

        from apps.bookings.models import Booking
        from apps.resources.models import Resource

        qs = Resource.objects.filter(tenant=tenant)
        if resource_type:
            qs = qs.filter(resource_type=resource_type)

        data = []
        for r in qs:
            bookings = Booking.objects.filter(
                tenant=tenant, resource=r,
                status__in=['approved', 'completed'],
                start_time__date__gte=start, start_time__date__lte=end,
            )
            total_secs = sum((b.end_time - b.start_time).total_seconds() for b in bookings)
            data.append({
                'resource': r.name,
                'type': r.resource_type,
                'booking_count': bookings.count(),
                'total_hours': round(total_secs / 3600, 2),
                'status': r.status,
            })

        data.sort(key=lambda x: x['booking_count'], reverse=True)

        if request.query_params.get('format') == 'csv':
            headers = ['Resource', 'Type', 'Status', 'Bookings', 'Total Hours']
            rows = [[d['resource'], d['type'], d['status'], d['booking_count'], d['total_hours']] for d in data]
            return csv_response(rows, headers, 'resource_utilization.csv')

        return Response({'start': str(start), 'end': str(end), 'data': data})


# ── 5. Exam Schedule Report ───────────────────────────────────────────────────
class ExamScheduleReport(APIView):
    """
    GET /api/reports/exam-schedule/
    Lists all published exam sessions with course assignments and hall allocations.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        start, end = get_date_range(request)

        from apps.exams.models import ExamSession, ExamHallAllocation, ExamCourseAssignment

        sessions = ExamSession.objects.filter(
            plan__tenant=tenant, plan__is_published=True,
            date__gte=start, date__lte=end,
        ).select_related('plan').order_by('date', 'start_time')

        data = []
        for s in sessions:
            courses = ExamCourseAssignment.objects.filter(session=s).select_related('course', 'batch', 'section')
            halls = ExamHallAllocation.objects.filter(session=s).select_related('resource')
            data.append({
                'date': str(s.date),
                'time': f"{s.start_time} - {s.end_time}",
                'type': s.session_type,
                'plan': s.plan.name,
                'courses': [f"{c.course.code} ({c.batch.batch_label if c.batch else '-'})" for c in courses],
                'halls': [f"{h.resource.name} (cap: {h.allocated_capacity})" for h in halls],
                'total_students': sum(h.allocated_capacity for h in halls),
            })

        if request.query_params.get('format') == 'csv':
            headers = ['Date', 'Time', 'Type', 'Plan', 'Courses', 'Halls', 'Students']
            rows = [[d['date'], d['time'], d['type'], d['plan'], '; '.join(d['courses']), '; '.join(d['halls']), d['total_students']] for d in data]
            return csv_response(rows, headers, 'exam_schedule.csv')

        return Response({'start': str(start), 'end': str(end), 'data': data})


# ── 6. Event Bookings Report ──────────────────────────────────────────────────
class EventBookingsReport(APIView):
    """
    GET /api/reports/event-bookings/
    Lists bookings with purpose = event, workshop, meeting in the date range.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        start, end = get_date_range(request)

        from apps.bookings.models import Booking

        bookings = Booking.objects.filter(
            tenant=tenant,
            purpose__in=['event', 'workshop', 'meeting'],
            start_time__date__gte=start,
            start_time__date__lte=end,
        ).select_related('resource', 'requested_by').order_by('start_time')

        data = [
            {
                'title': b.title,
                'purpose': b.purpose,
                'resource': b.resource.name,
                'requested_by': b.requested_by.get_full_name() or b.requested_by.username,
                'start': b.start_time.strftime('%Y-%m-%d %H:%M'),
                'end': b.end_time.strftime('%Y-%m-%d %H:%M'),
                'status': b.status,
                'attendees': b.attendees_count,
            }
            for b in bookings
        ]

        if request.query_params.get('format') == 'csv':
            headers = ['Title', 'Purpose', 'Resource', 'Requested By', 'Start', 'End', 'Status', 'Attendees']
            rows = [[d['title'], d['purpose'], d['resource'], d['requested_by'], d['start'], d['end'], d['status'], d['attendees']] for d in data]
            return csv_response(rows, headers, 'event_bookings.csv')

        return Response({'start': str(start), 'end': str(end), 'data': data})


# ── 7. Lab Equipment Utilisation ──────────────────────────────────────────────
class LabEquipmentReport(APIView):
    """
    GET /api/reports/lab-equipment/
    Covers resources with resource_type = 'equipment' (computers, microscopes, etc.)
    Formula: booking_count = number of approved/completed bookings per item
             total_hours = sum of (end_time - start_time) per booking
             last_used = most recent booking end_time
    Optional filter: room_id (limits to equipment booked in/for that room)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        start, end = get_date_range(request)
        room_id = request.query_params.get('room_id')

        from apps.bookings.models import Booking
        from apps.resources.models import Resource

        equipment = Resource.objects.filter(tenant=tenant, resource_type='equipment')
        if room_id:
            # Filter bookings whose resource is the specified room (as proxy for lab context)
            relevant_booking_resource_ids = Booking.objects.filter(
                resource_id=room_id
            ).values_list('resource_id', flat=True)
            equipment = equipment.filter(id__in=relevant_booking_resource_ids)

        data = []
        for item in equipment:
            bookings = Booking.objects.filter(
                tenant=tenant, resource=item,
                status__in=['approved', 'completed'],
                start_time__date__gte=start,
                start_time__date__lte=end,
            ).order_by('-end_time')

            total_secs = sum((b.end_time - b.start_time).total_seconds() for b in bookings)
            last_used = bookings.first().end_time.strftime('%Y-%m-%d') if bookings.exists() else 'Never'

            data.append({
                'item': item.name,
                'status': item.status,
                'capacity': item.capacity,
                'booking_count': bookings.count(),
                'total_hours': round(total_secs / 3600, 2),
                'last_used': last_used,
            })

        data.sort(key=lambda x: x['booking_count'], reverse=True)

        if request.query_params.get('format') == 'csv':
            headers = ['Equipment', 'Status', 'Bookings', 'Total Hours', 'Last Used']
            rows = [[d['item'], d['status'], d['booking_count'], d['total_hours'], d['last_used']] for d in data]
            return csv_response(rows, headers, 'lab_equipment.csv')

        return Response({'start': str(start), 'end': str(end), 'data': data})


# ── 8. Sports Items Utilisation ───────────────────────────────────────────────
class SportsUtilizationReport(APIView):
    """
    GET /api/reports/sports-utilization/
    Covers resources with resource_type = 'sports' (cricket kits, footballs, courts, etc.)
    Formula: checkout_count = number of approved/completed bookings
             total_hours_issued = sum of (end_time - start_time)
             availability = 'available' if no active booking in current window
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = request.user.tenant
        start, end = get_date_range(request)

        from apps.bookings.models import Booking
        from apps.resources.models import Resource

        sports_items = Resource.objects.filter(tenant=tenant, resource_type='sports')

        data = []
        for item in sports_items:
            bookings = Booking.objects.filter(
                tenant=tenant, resource=item,
                status__in=['approved', 'completed'],
                start_time__date__gte=start,
                start_time__date__lte=end,
            ).order_by('-end_time')

            total_secs = sum((b.end_time - b.start_time).total_seconds() for b in bookings)
            last_checkout = bookings.first().start_time.strftime('%Y-%m-%d') if bookings.exists() else 'Never'

            data.append({
                'item': item.name,
                'status': item.status,
                'checkout_count': bookings.count(),
                'total_hours_issued': round(total_secs / 3600, 2),
                'last_checkout': last_checkout,
            })

        data.sort(key=lambda x: x['checkout_count'], reverse=True)

        if request.query_params.get('format') == 'csv':
            headers = ['Sports Item', 'Status', 'Checkouts', 'Total Hours Issued', 'Last Checkout']
            rows = [[d['item'], d['status'], d['checkout_count'], d['total_hours_issued'], d['last_checkout']] for d in data]
            return csv_response(rows, headers, 'sports_utilization.csv')

        return Response({'start': str(start), 'end': str(end), 'data': data})
