from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.tenants.models import Tenant
from apps.academics.models import AcademicYear, Semester, Course, Batch, Section, FacultyProfile
from apps.exams.models import ExamPlan, ExamSession, ExamCourseAssignment

class Command(BaseCommand):
    help = 'Seeds sample exam plan data for testing the scheduling engine'

    def handle(self, *args, **kwargs):
        tenant = Tenant.objects.first()
        if not tenant:
            self.stdout.write(self.style.ERROR('No tenant found. Cannot seed.'))
            return

        ay = AcademicYear.objects.filter(tenant=tenant).first()
        if not ay:
            self.stdout.write(self.style.ERROR('No Academic Year found.'))
            return

        sem = Semester.objects.filter(academic_year=ay).first()
        if not sem:
            self.stdout.write(self.style.ERROR('No Semester found.'))
            return

        # Create Plan
        plan_name = f'Midterms {ay.label}'
        plan, created = ExamPlan.objects.get_or_create(
            tenant=tenant, academic_year=ay, semester=sem,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=5),
            defaults={'name': plan_name}
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created ExamPlan: {plan.name}'))

        courses = Course.objects.filter(tenant=tenant)[:3]
        batch = Batch.objects.filter(tenant=tenant).first()

        if courses and batch:
            for i, course in enumerate(courses):
                session_date = plan.start_date + timedelta(days=i)
                session, _ = ExamSession.objects.get_or_create(
                    plan=plan, date=session_date, session_type='forenoon',
                    defaults={'start_time': '10:00', 'end_time': '13:00'}
                )
                
                ExamCourseAssignment.objects.get_or_create(
                    session=session, course=course, batch=batch,
                    defaults={'section': batch.sections.first() if hasattr(batch, 'sections') else None}
                )
            
            self.stdout.write(self.style.SUCCESS('Successfully seeded Exam Sessions and Course Assignments.'))
        else:
            self.stdout.write(self.style.WARNING('Missing courses or batches to seed sessions. Run core seeds first.'))
