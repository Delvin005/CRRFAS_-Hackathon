"""
Timetable conflict validation service.
All conflict checks are stateless functions that take proposed session data
and return a list of conflict error strings. Empty list = no conflicts.
"""
from .models import ClassSession, FacultyAssignment, RoomAssignment


def check_faculty_conflict(day, start_time, end_time, faculty_profile_ids, exclude_session_id=None):
    """
    No faculty can be assigned to two sessions that overlap on the same day.
    Returns list of conflict strings.
    """
    errors = []
    qs = FacultyAssignment.objects.filter(
        faculty__in=faculty_profile_ids,
        session__day=day,
        session__status='active',
        session__end_time__gt=start_time,
        session__start_time__lt=end_time,
    )
    if exclude_session_id:
        qs = qs.exclude(session_id=exclude_session_id)

    for fa in qs.select_related('faculty__user', 'session__course'):
        errors.append(
            f"Faculty conflict: {fa.faculty.user.get_full_name() or fa.faculty.user.username} "
            f"is already scheduled for '{fa.session.course.code}' "
            f"on {day.upper()} {fa.session.start_time}–{fa.session.end_time}."
        )
    return errors


def check_room_conflict(day, start_time, end_time, room_ids, exclude_session_id=None):
    """
    No room can host two sessions that overlap on the same day.
    Returns list of conflict strings.
    """
    errors = []
    qs = RoomAssignment.objects.filter(
        room__in=room_ids,
        session__day=day,
        session__status='active',
        session__end_time__gt=start_time,
        session__start_time__lt=end_time,
    )
    if exclude_session_id:
        qs = qs.exclude(session_id=exclude_session_id)

    for ra in qs.select_related('room', 'session__course'):
        errors.append(
            f"Room conflict: '{ra.room.name}' is already booked for "
            f"'{ra.session.course.code}' on {day.upper()} {ra.session.start_time}–{ra.session.end_time}."
        )
    return errors


def check_room_capacity(room, section=None, batch=None):
    """
    Room capacity must be >= class size (section.strength or batch.intake).
    Returns list of conflict strings.
    """
    errors = []
    size = 0
    if section:
        size = section.strength
    elif batch:
        size = batch.intake

    if size and room.capacity < size:
        errors.append(
            f"Capacity conflict: '{room.name}' holds {room.capacity} students "
            f"but class size is {size}."
        )
    return errors


def check_room_facilities(room, session_type):
    """
    Lab sessions must be in a lab or similar resource type.
    Returns list of conflict warnings.
    """
    warnings = []
    if session_type == 'lab' and room.resource_type not in ('lab', 'seminar_hall'):
        warnings.append(
            f"Facility warning: '{room.name}' is a '{room.resource_type}' "
            f"but session type is 'lab'. Consider using a lab room."
        )
    return warnings


def check_section_overlap(day, start_time, end_time, section_id=None, batch_id=None, course_section_id=None, exclude_session_id=None):
    """
    Same section/batch cannot have two sessions at the same time on the same day.
    Returns list of conflict strings.
    """
    errors = []
    qs = ClassSession.objects.filter(
        day=day,
        status='active',
        end_time__gt=start_time,
        start_time__lt=end_time,
    )
    if exclude_session_id:
        qs = qs.exclude(id=exclude_session_id)

    if section_id:
        qs_sec = qs.filter(section_id=section_id)
        for s in qs_sec.select_related('course'):
            errors.append(
                f"Section overlap: Section already has '{s.course.code}' "
                f"on {day.upper()} {s.start_time}–{s.end_time}."
            )
    if batch_id:
        qs_batch = qs.filter(batch_id=batch_id)
        for s in qs_batch.select_related('course'):
            errors.append(
                f"Batch overlap: Batch already has '{s.course.code}' "
                f"on {day.upper()} {s.start_time}–{s.end_time}."
            )
    if course_section_id:
        qs_csec = qs.filter(course_section_id=course_section_id)
        for s in qs_csec.select_related('course'):
            errors.append(
                f"Section overlap: Course Section already has '{s.course.code}' "
                f"on {day.upper()} {s.start_time}–{s.end_time}."
            )
    return errors


def run_all_conflict_checks(
    day, start_time, end_time,
    faculty_profile_ids=None, room_ids=None, rooms=None,
    section=None, batch=None, session_type='lecture',
    exclude_session_id=None
):
    """
    Run all conflict checks and return aggregated list of error strings.
    Warnings (non-blocking) are prefixed with 'Warning:'.
    """
    errors = []

    if faculty_profile_ids:
        errors += check_faculty_conflict(day, start_time, end_time, faculty_profile_ids, exclude_session_id)
    if room_ids:
        errors += check_room_conflict(day, start_time, end_time, room_ids, exclude_session_id)
    if rooms:
        for room in rooms:
            errors += check_room_capacity(room, section, batch)
            errors += check_room_facilities(room, session_type)

    section_id = section.id if section else None
    batch_id = batch.id if batch else None
    # Quick fix: if `section` passed was a CourseSection
    course_section_id = None
    if section and hasattr(section, 'section_label'):
        section_id = None
        course_section_id = section.id

    if section_id or batch_id or course_section_id:
        errors += check_section_overlap(day, start_time, end_time, section_id, batch_id, course_section_id, exclude_session_id)

    return errors
