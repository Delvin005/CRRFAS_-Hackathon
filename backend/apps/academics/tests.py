from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from io import BytesIO
from .models import (
    Department, Program, AcademicYear, Semester, Course,
    CourseSection, FacultyProfile, Batch, Section,
)
from apps.tenants.models import Tenant

User = get_user_model()


def make_tenant(slug):
    return Tenant.objects.create(name=slug, slug=slug, institution_type='engineering')


def make_user(tenant, role='faculty', username=None):
    username = username or f'{role}_{tenant.slug}'
    return User.objects.create_user(
        username=username, password='pass1234',
        tenant=tenant, role=role
    )


class DepartmentAPITest(TestCase):
    def setUp(self):
        self.tenant = make_tenant('alpha')
        self.admin = make_user(self.tenant, 'tenant_admin', 'admin_alpha')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_create_department(self):
        res = self.client.post('/api/academics/departments/', {
            'tenant': self.tenant.id,
            'name': 'Computer Science',
            'code': 'CSE',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Department.objects.filter(tenant=self.tenant).count(), 1)

    def test_tenant_isolation(self):
        """User from tenant B should not see tenant A's departments."""
        tenant_b = make_tenant('beta')
        Department.objects.create(tenant=tenant_b, name='Dept B', code='B')

        dept_a = Department.objects.create(tenant=self.tenant, name='Dept A', code='A')

        res = self.client.get('/api/academics/departments/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        codes = [d['code'] for d in res.data.get('results', res.data)]
        self.assertIn('A', codes)
        self.assertNotIn('B', codes)


class CourseAPITest(TestCase):
    def setUp(self):
        self.tenant = make_tenant('gamma')
        self.admin = make_user(self.tenant, 'tenant_admin', 'admin_gamma')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

        self.dept = Department.objects.create(tenant=self.tenant, name='CSE', code='CSE')
        self.program = Program.objects.create(
            tenant=self.tenant, department=self.dept,
            name='B.E. CSE', code='BE-CSE',
            program_type='ug', scheme_type='credit', total_semesters=8
        )

    def test_create_course(self):
        res = self.client.post('/api/academics/courses/', {
            'tenant': self.tenant.id,
            'department': self.dept.id,
            'program': self.program.id,
            'code': 'CSE101',
            'name': 'Mathematics I',
            'course_type': 'theory',
            'credits': '4.0',
            'hours_per_week': 4,
            'semester_number': 1,
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_course_type_choices(self):
        """All valid course_type values should be accepted."""
        for ctype in ('theory', 'lab', 'tutorial', 'project', 'elective', 'audit'):
            Course.objects.create(
                tenant=self.tenant, department=self.dept, program=self.program,
                code=f'C{ctype[:3].upper()}', name=f'Course {ctype}',
                course_type=ctype, credits=3, hours_per_week=3, semester_number=1
            )
        self.assertEqual(Course.objects.filter(tenant=self.tenant).count(), 6)


class FacultyAssignTest(TestCase):
    def setUp(self):
        self.tenant = make_tenant('delta')
        self.admin = make_user(self.tenant, 'tenant_admin', 'admin_delta')
        self.faculty_user = make_user(self.tenant, 'faculty', 'fac_delta')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

        dept = Department.objects.create(tenant=self.tenant, name='ECE', code='ECE')
        program = Program.objects.create(
            tenant=self.tenant, department=dept, name='B.E. ECE', code='BE-ECE',
            program_type='ug', scheme_type='credit', total_semesters=8
        )
        ay = AcademicYear.objects.create(
            tenant=self.tenant, label='2024-25',
            start_date='2024-07-01', end_date='2025-05-31'
        )
        sem = Semester.objects.create(program=program, academic_year=ay, number=1)
        course = Course.objects.create(
            tenant=self.tenant, department=dept, program=program,
            code='ECE101', name='Circuits', course_type='theory',
            credits=4, hours_per_week=4, semester_number=1
        )
        self.section = CourseSection.objects.create(
            course=course, semester=sem, section_label='A'
        )

    def test_assign_faculty(self):
        res = self.client.post(
            f'/api/academics/course-sections/{self.section.id}/assign-faculty/',
            {'faculty_user_id': self.faculty_user.id}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.section.refresh_from_db()
        self.assertEqual(self.section.assigned_faculty, self.faculty_user)

    def test_unassign_faculty(self):
        self.section.assigned_faculty = self.faculty_user
        self.section.save()
        res = self.client.post(
            f'/api/academics/course-sections/{self.section.id}/unassign-faculty/'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.section.refresh_from_db()
        self.assertIsNone(self.section.assigned_faculty)


class BulkCSVUploadTest(TestCase):
    def setUp(self):
        self.tenant = make_tenant('epsilon')
        self.admin = make_user(self.tenant, 'tenant_admin', 'admin_eps')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

        dept = Department.objects.create(tenant=self.tenant, name='Mgt', code='MBA')
        self.program = Program.objects.create(
            tenant=self.tenant, department=dept, name='MBA', code='MBA',
            program_type='pg', scheme_type='credit', total_semesters=4
        )

    def _make_csv(self, rows):
        header = 'code,name,course_type,credits,hours_per_week,semester_number\n'
        body = '\n'.join(','.join(str(v) for v in r) for r in rows)
        return BytesIO((header + body).encode())

    def test_valid_csv_upload(self):
        csv_file = self._make_csv([
            ('MBA101', 'Business Economics', 'theory', 3, 3, 1),
            ('MBA102', 'Management Lab', 'lab', 2, 4, 1),
        ])
        csv_file.name = 'courses.csv'
        res = self.client.post('/api/academics/bulk-upload/', {
            'file': csv_file,
            'program_id': self.program.id,
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('MBA101', res.data['created'])
        self.assertIn('MBA102', res.data['created'])

    def test_invalid_file_type(self):
        txt_file = BytesIO(b'not a csv')
        txt_file.name = 'courses.txt'
        res = self.client.post('/api/academics/bulk-upload/', {
            'file': txt_file,
            'program_id': self.program.id,
        }, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class SeedViewTest(TestCase):
    def setUp(self):
        self.tenant = make_tenant('seed-test')
        self.admin = make_user(self.tenant, 'tenant_admin', 'admin_seed')
        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def test_seed_creates_data(self):
        res = self.client.post('/api/academics/seed/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(Department.objects.filter(tenant=self.tenant).exists())
        self.assertTrue(Course.objects.filter(tenant=self.tenant).exists())
