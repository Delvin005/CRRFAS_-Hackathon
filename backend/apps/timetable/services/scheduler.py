from datetime import timedelta
import random
from django.db import transaction
from apps.timetable.models import (
    TimetablePlan, WorkingDay, TimeSlotTemplate, ClassSession,
    FacultyAssignment, RoomAssignment
)
from apps.timetable.conflict_service import run_all_conflict_checks
from apps.academics.models import Course, CourseSection, FacultyAvailability, FacultyPreference
from apps.resources.models import Resource


class TimetableScheduler:
    def __init__(self, plan_id):
        self.plan = TimetablePlan.objects.select_related('tenant', 'academic_year', 'semester', 'department').get(id=plan_id)
        self.tenant = self.plan.tenant
        self.semester = self.plan.semester
        
        # Load necessary data into memory
        self.working_days = list(WorkingDay.objects.filter(
            tenant=self.tenant, is_working=True
        ).filter(department__isnull=True) | WorkingDay.objects.filter(
            tenant=self.tenant, department=self.plan.department, is_working=True
        ))
        self.days = list(set([wd.day for wd in self.working_days]))
        self.time_slots = list(TimeSlotTemplate.objects.filter(tenant=self.tenant).order_by('order', 'start_time'))
        
        self.rooms = list(Resource.objects.filter(tenant=self.tenant, status='available'))
        self.faculty_availabilities = list(FacultyAvailability.objects.filter(
            faculty__tenant=self.tenant, is_available=True
        ))
        self.faculty_preferences = list(FacultyPreference.objects.filter(faculty__tenant=self.tenant))
        
        # Load courses for this semester
        self.courses = list(Course.objects.filter(
            tenant=self.tenant, program__semesters=self.semester, is_active=True,
            semester_number=self.semester.number
        ))
        self.course_sections = list(CourseSection.objects.filter(
            semester=self.semester, course__in=self.courses
        ).select_related('course', 'assigned_faculty'))

    def _get_course_sessions_needed(self, course):
        """Calculate how many 1-timeslot sessions are needed based on hours_per_week."""
        # Assume 1 time slot = 1 hour for simplicity
        return course.hours_per_week

    def _get_faculty_for_section(self, section):
        if section.assigned_faculty:
            # We need the FacultyProfile
            return section.assigned_faculty.faculty_profile
        return None

    def _get_suitable_rooms(self, section):
        """Filter rooms by capacity and facility matching the course type."""
        course = section.course
        req_type = 'lab' if course.course_type == 'lab' else 'classroom'
        # Return rooms sorted by closest capacity (to save larger rooms for larger classes)
        valid_rooms = [
            r for r in self.rooms 
            if r.capacity >= section.max_students 
            and (req_type == 'lab' and r.resource_type in ('lab', 'seminar_hall') or req_type == 'classroom')
        ]
        valid_rooms.sort(key=lambda r: r.capacity)
        return valid_rooms

    def _score_candidate(self, day, start_time, end_time, room, faculty, current_fac_sessions, section, course, all_sessions):
        score = 0
        
        # Spread classes: Penalize if section already has this course on this day
        section_day_sessions = [s for s in all_sessions if s.day == day and s.course_section == section and s.course == course]
        if section_day_sessions:
            score -= 50  # Heavy penalty for same course multiple times a day
        
        # Penalize if section has >= 4 classes today
        section_total_today = [s for s in all_sessions if s.day == day and s.course_section == section]
        if len(section_total_today) >= 4:
            score -= 20
        
        # Faculty Preference Score
        if faculty:
            prefs = [p for p in self.faculty_preferences if p.faculty == faculty]
            if any(p.preference_type == 'preferred' for p in prefs):
                score += 10
            elif any(p.preference_type == 'willing' for p in prefs):
                score += 5
            elif any(p.preference_type == 'avoid' for p in prefs):
                score -= 10
                
            # Consecutive class penalty (soft constraint)
            # Find sessions for this faculty on this day
            fac_day_sessions = [s for s in current_fac_sessions if s.day == day]
            # Simple heuristic: if they have >= 3 hours today, penalize new classes
            if len(fac_day_sessions) >= 3:
                score -= 10
            # Check immediate consecutive
            for fs in fac_day_sessions:
                if fs.end_time == start_time or fs.start_time == end_time:
                    score -= 5 # slight penalty for back-to-back

        # Room Score
        # Prefer smaller rooms that just fit the section
        score += (100 - min(100, (room.capacity - 50))) # Arbitrary scaling for preferring tight fits

        return score

    @transaction.atomic
    def generate(self):
        # 1. Clear existing 'draft' sessions for this plan
        ClassSession.objects.filter(plan=self.plan, status='draft').delete()
        
        stats = {
            'total_sections': len(self.course_sections),
            'sessions_needed': sum(self._get_course_sessions_needed(s.course) for s in self.course_sections),
            'sessions_scheduled': 0,
            'conflicts_left': 0,
            'unplaced_sections': [],
            'warnings': []
        }

        # 2. Prioritize Labs first, then theory
        sorted_sections = sorted(
            self.course_sections, 
            key=lambda s: (0 if s.course.course_type == 'lab' else 1, -s.max_students)
        )

        all_sessions = []
        current_fac_assignments = [] # Keep track in memory for fast scoring

        # 3. Iterate over sections
        for section in sorted_sections:
            course = section.course
            sessions_needed = self._get_course_sessions_needed(course)
            sessions_placed = 0
            
            faculty = self._get_faculty_for_section(section)
            suitable_rooms = self._get_suitable_rooms(section)
            
            if not suitable_rooms:
                stats['warnings'].append(f"No suitable room for {course.code} Sec {section.section_label} (needs {section.max_students} cap).")
                stats['unplaced_sections'].append(f"{course.code} (Sec {section.section_label})")
                continue

            # 4. Try to place each needed session
            for _ in range(sessions_needed):
                candidates = []
                
                # Scan all grid cells
                for day in self.days:
                    for ts in self.time_slots:
                        # 5. Hard Constraints Check (in-memory fast check via DB helper)
                        # We use the existing conflict service
                        fac_ids = [faculty.id] if faculty else []
                        
                        for room in suitable_rooms:
                            # DB check
                            conflicts = run_all_conflict_checks(
                                day=day, start_time=ts.start_time, end_time=ts.end_time,
                                faculty_profile_ids=fac_ids, room_ids=[room.id], 
                                section=section, session_type=course.course_type
                            )
                            
                            # Memory check against newly created sessions in this run
                            mem_conflict = False
                            for mem_s in all_sessions:
                                if mem_s.day == day and (
                                    (mem_s.start_time < ts.end_time and mem_s.end_time > ts.start_time)
                                ):
                                    if mem_s.section == section or (mem_s.room == room):
                                        mem_conflict = True
                                        break
                                    if faculty and hasattr(mem_s, 'faculty') and mem_s.faculty == faculty:
                                        mem_conflict = True
                                        break
                                        
                            if not conflicts and not mem_conflict:
                                # 6. Soft Constraints Scoring
                                score = self._score_candidate(
                                    day, ts.start_time, ts.end_time, room, faculty, current_fac_assignments,
                                    section, course, all_sessions
                                )
                                candidates.append({
                                    'day': day, 'start_time': ts.start_time, 'end_time': ts.end_time,
                                    'room': room, 'score': score
                                })

                if candidates:
                    # 7. Placement: highest score
                    candidates.sort(key=lambda c: c['score'], reverse=True)
                    best = candidates[0]
                    
                    ns = ClassSession(
                        plan=self.plan, tenant=self.tenant, academic_year=self.plan.academic_year,
                        semester=self.semester, department=self.plan.department,
                        course=course, course_section=section,
                        day=best['day'], start_time=best['start_time'], end_time=best['end_time'],
                        session_type=course.course_type, status='draft',
                        notes="Auto-scheduled"
                    )
                    setattr(ns, 'room', best['room'])
                    if faculty: setattr(ns, 'faculty', faculty)
                    
                    all_sessions.append(ns)
                    sessions_placed += 1
                else:
                    stats['conflicts_left'] += 1
            
            if sessions_placed < sessions_needed:
                stats['unplaced_sections'].append(f"{course.code} (Sec {section.section_label}) missed {sessions_needed - sessions_placed} slots")

        # Bulk create everything at the end
        ClassSession.objects.bulk_create(all_sessions)
        
        # Now create Assignments
        fa_objs = []
        ra_objs = []
        for s in all_sessions:
            if hasattr(s, 'faculty') and s.faculty:
                fa_objs.append(FacultyAssignment(session=s, faculty=s.faculty, is_primary=True))
            if hasattr(s, 'room') and s.room:
                ra_objs.append(RoomAssignment(session=s, room=s.room))
                
        FacultyAssignment.objects.bulk_create(fa_objs)
        RoomAssignment.objects.bulk_create(ra_objs)
        
        stats['sessions_scheduled'] = len(all_sessions)
        
        return stats
