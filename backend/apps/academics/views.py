import csv
import io
from decimal import Decimal, InvalidOperation
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Department, Program, AcademicYear, Semester, Course, CourseSection,
    FacultyProfile, FacultyAvailability, FacultyPreference,
    Batch, Section, StudentGroup, DepartmentRoomPreference,
)
from .serializers import (
    DepartmentSerializer, ProgramSerializer, AcademicYearSerializer,
    SemesterSerializer, CourseSerializer, CourseSectionSerializer,
    FacultyProfileSerializer, FacultyAvailabilitySerializer,
    FacultyPreferenceSerializer, BatchSerializer, SectionSerializer,
    StudentGroupSerializer, DepartmentRoomPreferenceSerializer,
    FacultyAssignSerializer, BulkCourseUploadSerializer,
)


def get_tenant(user):
    return user.tenant


def is_super_admin(user):
    return user.role == 'super_admin'


# ── Base mixin ────────────────────────────────────────────────────────────────

class TenantViewSetMixin:
    """Scope querysets to the requesting user's tenant."""
    tenant_field = 'tenant'

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if is_super_admin(user):
            return qs
        return qs.filter(**{self.tenant_field: user.tenant})


class TenantCreateMixin:
    """Auto-attach tenant on create.
    For normal users: uses their own tenant.
    For super_admin: uses their tenant if set, otherwise falls back to the
    first available tenant (suitable for hackathon/demo single-tenant setups).
    """
    def perform_create(self, serializer):
        from apps.tenants.models import Tenant
        tenant = self.request.user.tenant
        if tenant is None:
            # super_admin may have no tenant — fall back to the first tenant in the system
            tenant = Tenant.objects.first()
            if tenant is None:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'tenant': 'No tenant exists in the system. Please create a tenant first.'})
        serializer.save(tenant=tenant)


# ── Core viewsets ─────────────────────────────────────────────────────────────

class DepartmentViewSet(TenantViewSetMixin, TenantCreateMixin, viewsets.ModelViewSet):
    queryset = Department.objects.select_related('tenant', 'head_of_dept').all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']


class ProgramViewSet(TenantViewSetMixin, TenantCreateMixin, viewsets.ModelViewSet):
    queryset = Program.objects.select_related('tenant', 'department').all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['program_type', 'scheme_type', 'department', 'is_active']

    def get_queryset(self):
        qs = Program.objects.select_related('tenant', 'department').all()
        user = self.request.user
        if is_super_admin(user):
            return qs
        return qs.filter(tenant=user.tenant)


class AcademicYearViewSet(TenantViewSetMixin, TenantCreateMixin, viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_current']


class SemesterViewSet(viewsets.ModelViewSet):
    serializer_class = SemesterSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['program', 'academic_year', 'is_current', 'number']

    def get_queryset(self):
        user = self.request.user
        qs = Semester.objects.select_related('program', 'academic_year').all()
        if is_super_admin(user):
            return qs
        return qs.filter(program__tenant=user.tenant)


# ── Course & CourseSection ────────────────────────────────────────────────────

class CourseViewSet(TenantViewSetMixin, TenantCreateMixin, viewsets.ModelViewSet):
    queryset = Course.objects.select_related('tenant', 'department', 'program').all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['course_type', 'program', 'department', 'semester_number', 'is_active']


class CourseSectionViewSet(viewsets.ModelViewSet):
    serializer_class = CourseSectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['course', 'semester', 'assigned_faculty']

    def get_queryset(self):
        user = self.request.user
        qs = CourseSection.objects.select_related('course', 'semester', 'assigned_faculty').all()
        if is_super_admin(user):
            return qs
        return qs.filter(course__tenant=user.tenant)

    @action(detail=True, methods=['post'], url_path='assign-faculty')
    def assign_faculty(self, request, pk=None):
        """Assign a faculty user to this CourseSection."""
        section = self.get_object()
        serializer = FacultyAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.accounts.models import User
        user_id = serializer.validated_data['faculty_user_id']
        faculty_user = User.objects.get(id=user_id)
        section.assigned_faculty = faculty_user
        section.save()
        return Response(CourseSectionSerializer(section).data)

    @action(detail=True, methods=['post'], url_path='unassign-faculty')
    def unassign_faculty(self, request, pk=None):
        """Remove faculty assignment from this CourseSection."""
        section = self.get_object()
        section.assigned_faculty = None
        section.save()
        return Response(CourseSectionSerializer(section).data)


# ── Faculty ───────────────────────────────────────────────────────────────────

class FacultyProfileViewSet(TenantViewSetMixin, TenantCreateMixin, viewsets.ModelViewSet):
    queryset = FacultyProfile.objects.select_related('tenant', 'user', 'department').all()
    serializer_class = FacultyProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department', 'designation', 'is_active']


class FacultyAvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = FacultyAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['faculty', 'day', 'is_available']

    def get_queryset(self):
        user = self.request.user
        qs = FacultyAvailability.objects.select_related('faculty').all()
        if is_super_admin(user):
            return qs
        return qs.filter(faculty__tenant=user.tenant)


class FacultyPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = FacultyPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['faculty', 'preference_type']

    def get_queryset(self):
        user = self.request.user
        qs = FacultyPreference.objects.select_related('faculty', 'course').all()
        if is_super_admin(user):
            return qs
        return qs.filter(faculty__tenant=user.tenant)


# ── Batch & Section ───────────────────────────────────────────────────────────

class BatchViewSet(TenantViewSetMixin, TenantCreateMixin, viewsets.ModelViewSet):
    queryset = Batch.objects.select_related('tenant', 'program', 'academic_year').all()
    serializer_class = BatchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['program', 'academic_year', 'is_active']


class SectionViewSet(viewsets.ModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['batch', 'class_teacher']

    def get_queryset(self):
        user = self.request.user
        qs = Section.objects.select_related('batch', 'class_teacher').all()
        if is_super_admin(user):
            return qs
        return qs.filter(batch__tenant=user.tenant)


class StudentGroupViewSet(viewsets.ModelViewSet):
    serializer_class = StudentGroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['section']

    def get_queryset(self):
        user = self.request.user
        qs = StudentGroup.objects.select_related('section').all()
        if is_super_admin(user):
            return qs
        return qs.filter(section__batch__tenant=user.tenant)


class DepartmentRoomPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentRoomPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['department', 'resource_type']

    def get_queryset(self):
        user = self.request.user
        qs = DepartmentRoomPreference.objects.select_related('department').all()
        if is_super_admin(user):
            return qs
        return qs.filter(department__tenant=user.tenant)


# ── Bulk CSV Upload ───────────────────────────────────────────────────────────

class BulkCourseUploadView(generics.CreateAPIView):
    """
    POST multipart/form-data with:
      - file: CSV file
      - program_id: int

    CSV columns: code, name, course_type, credits, hours_per_week, semester_number
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]
    serializer_class = BulkCourseUploadSerializer

    def create(self, request, *args, **kwargs):
        serializer = BulkCourseUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        program_id = serializer.validated_data['program_id']
        try:
            program = Program.objects.get(id=program_id, tenant=request.user.tenant)
        except Program.DoesNotExist:
            return Response({'error': 'Program not found for your tenant.'}, status=status.HTTP_404_NOT_FOUND)

        rows, errors = serializer.parse()
        created, skipped = [], []

        for row in rows:
            try:
                credits = Decimal(str(row.get('credits', '3.0')))
            except InvalidOperation:
                errors.append(f"Invalid credits value: {row.get('credits')}")
                continue

            course, created_flag = Course.objects.get_or_create(
                tenant=request.user.tenant,
                program=program,
                code=row['code'].strip(),
                defaults={
                    'department': program.department,
                    'name': row['name'].strip(),
                    'course_type': row.get('course_type', 'theory').strip(),
                    'credits': credits,
                    'hours_per_week': int(row.get('hours_per_week', 3)),
                    'semester_number': int(row.get('semester_number', 1)),
                }
            )
            if created_flag:
                created.append(course.code)
            else:
                skipped.append(course.code)

        return Response({
            'created': created,
            'skipped_existing': skipped,
            'errors': errors,
        }, status=status.HTTP_201_CREATED)


# ── Seed Data ─────────────────────────────────────────────────────────────────

class SeedAcademicsView(generics.CreateAPIView):
    """
    POST /api/academics/seed/
    Creates sample departments, programs, courses, batches, sections for a tenant.
    Admin-only.
    """
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.role not in ('super_admin', 'tenant_admin'):
            return Response({'error': 'Admin only.'}, status=status.HTTP_403_FORBIDDEN)

        tenant = request.user.tenant
        from django.utils import timezone

        # Academic Year
        ay, _ = AcademicYear.objects.get_or_create(
            tenant=tenant, label='2024-25',
            defaults={'start_date': '2024-07-01', 'end_date': '2025-05-31', 'is_current': True}
        )

        seed_data = [
            {'dept': 'Computer Science Engineering', 'code': 'CSE',
             'programs': [('B.E. CSE', 'BE-CSE', 'ug', 8)]},
            {'dept': 'Electronics Engineering', 'code': 'ECE',
             'programs': [('B.E. ECE', 'BE-ECE', 'ug', 8)]},
            {'dept': 'Management Studies', 'code': 'MBA',
             'programs': [('MBA', 'MBA', 'pg', 4)]},
        ]

        created_summary = {}
        for item in seed_data:
            dept, _ = Department.objects.get_or_create(
                tenant=tenant, code=item['code'],
                defaults={'name': item['dept']}
            )
            for pname, pcode, ptype, sems in item['programs']:
                prog, _ = Program.objects.get_or_create(
                    tenant=tenant, department=dept, code=pcode,
                    defaults={
                        'name': pname, 'program_type': ptype,
                        'total_semesters': sems, 'scheme_type': 'credit'
                    }
                )
                # Batch
                batch, _ = Batch.objects.get_or_create(
                    tenant=tenant, program=prog, academic_year=ay,
                    defaults={'batch_label': '2024-28', 'intake': 60}
                )
                # Sections
                for sec_name in ['A', 'B']:
                    Section.objects.get_or_create(
                        batch=batch, name=sec_name,
                        defaults={'strength': 30}
                    )
                # Sample courses
                sample_courses = [
                    (f'{pcode}101', 'Mathematics I', 'theory', 4, 4, 1),
                    (f'{pcode}102', 'Programming Lab', 'lab', 2, 4, 1),
                    (f'{pcode}201', 'Data Structures', 'theory', 3, 3, 2),
                ]
                for ccode, cname, ctype, credits, hrs, sem in sample_courses:
                    Course.objects.get_or_create(
                        tenant=tenant, program=prog, code=ccode,
                        defaults={
                            'department': dept, 'name': cname,
                            'course_type': ctype, 'credits': credits,
                            'hours_per_week': hrs, 'semester_number': sem,
                        }
                    )
                created_summary[pcode] = 'seeded'

        return Response({'status': 'Seed complete', 'programs': created_summary})
