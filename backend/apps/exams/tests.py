from django.test import TestCase
from rest_framework.test import APIClient
from apps.tenants.models import Tenant
from apps.accounts.models import User
from apps.campus.models import Campus, Building, Floor
from apps.resources.models import Resource
from apps.academics.models import (
    Department, AcademicYear, Program, Semester, Course, Batch, Section, FacultyProfile
)
from apps.exams.models import (
    ExamPlan, ExamSession, ExamCourseAssignment, ExamHallAllocation, SeatingPlan, InvigilatorAssignment
)

def make_tenant(slug):
    return Tenant.objects.create(name=slug, slug=slug, institution_type='engineering')

def make_user(tenant, role='faculty', username=None):
    username = username or f'{role}_{tenant.slug}'
    return User.objects.create_user(
        username=username, password='pass1234',
        tenant=tenant, role=role
    )

class ExamSchedulingTests(TestCase):
    def setUp(self):
        self.tenant = make_tenant('exam-test')
        self.admin = make_user(self.tenant, 'tenant_admin', 'exam_admin')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

        self.ay = AcademicYear.objects.create(tenant=self.tenant, label='24-25', start_date='2024-01-01', end_date='2024-12-31')
        self.dept = Department.objects.create(tenant=self.tenant, name='CS')
        self.prog = Program.objects.create(tenant=self.tenant, department=self.dept, name='BTech', code='BT')
        self.sem = Semester.objects.create(program=self.prog, academic_year=self.ay, number=1)

        self.course = Course.objects.create(tenant=self.tenant, department=self.dept, program=self.prog, code='CS1', name='CS1', course_type='theory')
        self.batch = Batch.objects.create(tenant=self.tenant, program=self.prog, academic_year=self.ay, batch_label='2024', intake=60)
        self.section = Section.objects.create(batch=self.batch, name='A', strength=50)

        # 2 Faculty
        self.fac1 = FacultyProfile.objects.create(tenant=self.tenant, user=make_user(self.tenant, 'faculty', 'f1'), department=self.dept)
        self.fac2 = FacultyProfile.objects.create(tenant=self.tenant, user=make_user(self.tenant, 'faculty', 'f2'), department=self.dept)

        # 2 Rooms: Room A (cap 30), Room B (cap 40)
        self.roomA = Resource.objects.create(tenant=self.tenant, name='RA', resource_type='classroom', capacity=30, status='available')
        self.roomB = Resource.objects.create(tenant=self.tenant, name='RB', resource_type='classroom', capacity=40, status='available')

        # Exam Plan
        self.plan = ExamPlan.objects.create(tenant=self.tenant, academic_year=self.ay, semester=self.sem, name='Midterms', start_date='2024-10-01', end_date='2024-10-10')
        self.session = ExamSession.objects.create(plan=self.plan, date='2024-10-01', start_time='10:00', end_time='13:00')
        
        # Course assignment needs 50 seats (section.strength)
        self.course_assign = ExamCourseAssignment.objects.create(session=self.session, course=self.course, batch=self.batch, section=self.section)

    def test_auto_allocate_halls(self):
        # We need 50 seats. RA has 30, RB has 40. The engine should allocate both to fit 50.
        res = self.client.post(f'/api/exams/plans/{self.plan.id}/auto-allocate-halls/')
        self.assertEqual(res.status_code, 200)
        
        allocs = ExamHallAllocation.objects.filter(session=self.session)
        # Verify 2 halls allocated
        self.assertEqual(allocs.count(), 2)
        
        total_cap = sum(a.allocated_capacity for a in allocs)
        self.assertEqual(total_cap, 50)

    def test_generate_seating(self):
        # First allocate halls
        self.client.post(f'/api/exams/plans/{self.plan.id}/auto-allocate-halls/')
        
        # Then generate seats
        res = self.client.post(f'/api/exams/plans/{self.plan.id}/generate-seating/')
        self.assertEqual(res.status_code, 200)
        
        seats = SeatingPlan.objects.filter(allocation__session__plan=self.plan)
        # Should generate exactly 50 seats for the 50 students
        self.assertEqual(seats.count(), 50)
        
        # Ensure roll numbers are distinct
        roll_nos = [s.student_roll_number for s in seats]
        self.assertEqual(len(set(roll_nos)), 50)

    def test_assign_invigilators(self):
        # First allocate halls
        self.client.post(f'/api/exams/plans/{self.plan.id}/auto-allocate-halls/')
        
        # Then assign invigilators
        res = self.client.post(f'/api/exams/plans/{self.plan.id}/assign-invigilators/')
        self.assertEqual(res.status_code, 200)
        
        invigs = InvigilatorAssignment.objects.filter(allocation__session__plan=self.plan)
        # 2 halls allocated, so we need 2 invigilators
        self.assertEqual(invigs.count(), 2)
        
        # Check they are distinct faculty
        faculties = [i.faculty for i in invigs]
        self.assertEqual(len(set(faculties)), 2)
