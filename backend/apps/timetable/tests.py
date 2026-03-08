from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone

from apps.tenants.models import Tenant
from apps.resources.models import Resource
from apps.academics.models import (
    Department, AcademicYear, Program, Semester,
    Course, CourseSection, FacultyProfile, Batch, Section
)
from .models import (
    TimetablePlan, WorkingDay, TimeSlotTemplate, ClassSession,
    FacultyAssignment, RoomAssignment
)
from .conflict_service import run_all_conflict_checks

User = get_user_model()


def make_tenant(slug):
    return Tenant.objects.create(name=slug, slug=slug, institution_type='engineering')


def make_user(tenant, role='faculty', username=None):
    username = username or f'{role}_{tenant.slug}'
    return User.objects.create_user(
        username=username, password='pass1234',
        tenant=tenant, role=role
    )


class TimetableTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant('tt-tenant')
        self.admin = make_user(self.tenant, 'tenant_admin', 'tt_admin')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

        self.dept = Department.objects.create(tenant=self.tenant, name='CS', code='CS')
        self.ay = AcademicYear.objects.create(tenant=self.tenant, label='2024-25', start_date='2024-07-01', end_date='2025-05-31', is_current=True)
        
        self.prog = Program.objects.create(tenant=self.tenant, department=self.dept, name='BTech', code='BTECH')
        self.sem = Semester.objects.create(program=self.prog, academic_year=self.ay, number=1)
        self.course = Course.objects.create(tenant=self.tenant, department=self.dept, program=self.prog, code='CS101', name='Intro to CS', course_type='theory')
        
        self.faculty_user = make_user(self.tenant, 'faculty', 'fac_1')
        self.faculty = FacultyProfile.objects.create(tenant=self.tenant, user=self.faculty_user, department=self.dept)
        
        self.room = Resource.objects.create(tenant=self.tenant, name='Room 101', resource_type='classroom', capacity=60)
        self.lab_room = Resource.objects.create(tenant=self.tenant, name='Lab 1', resource_type='lab', capacity=30)
        
        self.batch = Batch.objects.create(tenant=self.tenant, program=self.prog, academic_year=self.ay, batch_label='2024-28', intake=60)
        self.section = Section.objects.create(batch=self.batch, name='A', strength=50)

        self.plan = TimetablePlan.objects.create(
            tenant=self.tenant, academic_year=self.ay, semester=self.sem,
            department=self.dept, name='Fall 2024 Plan'
        )

    def test_create_class_session(self):
        res = self.client.post('/api/timetable/sessions/', {
            'plan': self.plan.id,
            'academic_year': self.ay.id,
            'semester': self.sem.id,
            'department': self.dept.id,
            'course': self.course.id,
            'section': self.section.id,
            'day': 'mon',
            'start_time': '09:00',
            'end_time': '10:00',
            'session_type': 'lecture',
            'status': 'active'
        })
        if res.status_code != status.HTTP_201_CREATED:
            print("Create session failed:", res.data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ClassSession.objects.count(), 1)


class ConflictServiceTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant('conflict-tenant')
        self.dept = Department.objects.create(tenant=self.tenant, name='CS', code='CS')
        self.ay = AcademicYear.objects.create(tenant=self.tenant, label='2024-25', start_date='2024-07-01', end_date='2025-05-31', is_current=True)
        self.prog = Program.objects.create(tenant=self.tenant, department=self.dept, name='BTech', code='BTECH')
        self.sem = Semester.objects.create(program=self.prog, academic_year=self.ay, number=1)
        self.course = Course.objects.create(tenant=self.tenant, department=self.dept, program=self.prog, code='CS101', name='Intro to CS', course_type='theory')
        
        self.faculty_user = make_user(self.tenant, 'faculty', 'fac_c1')
        self.faculty = FacultyProfile.objects.create(tenant=self.tenant, user=self.faculty_user, department=self.dept)
        
        self.room = Resource.objects.create(tenant=self.tenant, name='Room A', resource_type='classroom', capacity=100)
        
        self.plan = TimetablePlan.objects.create(tenant=self.tenant, academic_year=self.ay, semester=self.sem, department=self.dept, name='Plan A')

        self.session1 = ClassSession.objects.create(
            plan=self.plan, tenant=self.tenant, academic_year=self.ay, semester=self.sem,
            department=self.dept, course=self.course,
            day='mon', start_time='10:00', end_time='11:00'
        )
        FacultyAssignment.objects.create(session=self.session1, faculty=self.faculty)
        RoomAssignment.objects.create(session=self.session1, room=self.room)

    def test_faculty_conflict(self):
        conflicts = run_all_conflict_checks(
            day='mon', start_time='10:15', end_time='11:15',
            faculty_profile_ids=[self.faculty.id]
        )
        self.assertEqual(len(conflicts), 1)
        self.assertIn("Faculty conflict", conflicts[0])

    def test_room_conflict(self):
        conflicts = run_all_conflict_checks(
            day='mon', start_time='09:30', end_time='10:30',
            room_ids=[self.room.id]
        )
        self.assertEqual(len(conflicts), 1)
        self.assertIn("Room conflict", conflicts[0])

    def test_no_conflict(self):
        conflicts = run_all_conflict_checks(
            day='mon', start_time='11:00', end_time='12:00',
            faculty_profile_ids=[self.faculty.id],
            room_ids=[self.room.id]
        )
        self.assertEqual(len(conflicts), 0)

    def test_room_capacity_conflict(self):
        small_room = Resource.objects.create(tenant=self.tenant, name='Small Room', resource_type='classroom', capacity=20)
        batch = Batch.objects.create(tenant=self.tenant, program=self.prog, academic_year=self.ay, batch_label='2024-28', intake=60)
        large_section = Section.objects.create(batch=batch, name='B', strength=50)

        conflicts = run_all_conflict_checks(
            day='tue', start_time='10:00', end_time='11:00',
            rooms=[small_room], section=large_section
        )
        self.assertEqual(len(conflicts), 1)
        self.assertIn("Capacity conflict", conflicts[0])

class AutoScheduleTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant('auto-tt-tenant')
        self.admin = make_user(self.tenant, 'tenant_admin', 'auto_admin')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)
        
        self.dept = Department.objects.create(tenant=self.tenant, name='CS', code='CS')
        self.ay = AcademicYear.objects.create(tenant=self.tenant, label='2024-25', start_date='2024-07-01', end_date='2025-05-31', is_current=True)
        self.prog = Program.objects.create(tenant=self.tenant, department=self.dept, name='BTech', code='BTECH')
        self.sem = Semester.objects.create(program=self.prog, academic_year=self.ay, number=1)
        
        self.course1 = Course.objects.create(tenant=self.tenant, department=self.dept, program=self.prog, code='CS101', name='C1', course_type='theory', hours_per_week=2)
        self.course2 = Course.objects.create(tenant=self.tenant, department=self.dept, program=self.prog, code='CS102', name='C2', course_type='lab', hours_per_week=2)
        
        self.fac_user1 = make_user(self.tenant, 'faculty', 'f1')
        self.faculty1 = FacultyProfile.objects.create(tenant=self.tenant, user=self.fac_user1, department=self.dept)
        
        self.batch = Batch.objects.create(tenant=self.tenant, program=self.prog, academic_year=self.ay, batch_label='2024-28', intake=60)
        self.sec1 = Section.objects.create(batch=self.batch, name='A', strength=50)

        # 2 Sections for C1, 1 Section for C2 (lab)
        self.c1_s1 = CourseSection.objects.create(course=self.course1, semester=self.sem, section_label='A', max_students=50, assigned_faculty=self.fac_user1)
        self.c2_s1 = CourseSection.objects.create(course=self.course2, semester=self.sem, section_label='L1', max_students=50, assigned_faculty=self.fac_user1)
        
        self.room1 = Resource.objects.create(tenant=self.tenant, name='R1', resource_type='classroom', capacity=100)
        self.lab1 = Resource.objects.create(tenant=self.tenant, name='L1', resource_type='lab', capacity=50)
        
        # Grid
        WorkingDay.objects.create(tenant=self.tenant, day='mon', is_working=True)
        TimeSlotTemplate.objects.create(tenant=self.tenant, label='P1', start_time='09:00', end_time='10:00', order=1)
        TimeSlotTemplate.objects.create(tenant=self.tenant, label='P2', start_time='10:00', end_time='11:00', order=2)

        self.plan = TimetablePlan.objects.create(tenant=self.tenant, academic_year=self.ay, semester=self.sem, department=self.dept, name='Plan 1')

    def test_auto_schedule(self):
        # We have 1 day * 2 slots = 2 slots total. 
        # Course1 requires 2 sessions, Course2 requires 2 sessions. 
        # But we only have 2 grid cells. So the scheduler should place exactly 2 sessions and report missed.
        res = self.client.post(f'/api/timetable/plans/{self.plan.id}/auto-schedule/')
        self.assertEqual(res.status_code, 200)
        
        stats = res.data['stats']
        self.assertEqual(stats['total_sections'], 2)
        self.assertEqual(stats['sessions_needed'], 4)
        
        sessions = ClassSession.objects.filter(plan=self.plan)
        # Verify it didn't double book
        self.assertLessEqual(sessions.count(), 4)
        
        # Ensure no two sessions for same batch overlap
        overlaps = [s for s in sessions if ClassSession.objects.filter(plan=self.plan, day=s.day, start_time=s.start_time).count() > 1]
        self.assertEqual(len(overlaps), 0, "Scheduler created overlapping sessions")

