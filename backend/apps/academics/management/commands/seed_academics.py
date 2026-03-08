from django.core.management.base import BaseCommand, CommandError
from apps.tenants.models import Tenant
from apps.academics.models import (
    Department, Program, AcademicYear, Course, Batch, Section
)


class Command(BaseCommand):
    help = 'Seed sample academic master data for a tenant.'

    def add_arguments(self, parser):
        parser.add_argument('--tenant-slug', required=True, help='Slug of the target tenant')

    def handle(self, *args, **options):
        slug = options['tenant_slug']
        try:
            tenant = Tenant.objects.get(slug=slug)
        except Tenant.DoesNotExist:
            raise CommandError(f"Tenant with slug '{slug}' not found.")

        self.stdout.write(f"Seeding academics for tenant: {tenant.name}")

        ay, _ = AcademicYear.objects.get_or_create(
            tenant=tenant, label='2024-25',
            defaults={'start_date': '2024-07-01', 'end_date': '2025-05-31', 'is_current': True}
        )

        seed = [
            {
                'dept': 'Computer Science Engineering', 'code': 'CSE',
                'programs': [
                    ('B.E. CSE', 'BE-CSE', 'ug', 8, 'credit'),
                    ('M.E. CSE', 'ME-CSE', 'pg', 4, 'credit'),
                ],
                'courses': [
                    ('CSE101', 'Mathematics I', 'theory', 4, 4, 1),
                    ('CSE102', 'Programming Fundamentals', 'theory', 3, 3, 1),
                    ('CSE103', 'Programming Lab', 'lab', 2, 4, 1),
                    ('CSE201', 'Data Structures', 'theory', 3, 3, 2),
                    ('CSE202', 'Digital Electronics', 'theory', 3, 3, 2),
                ],
            },
            {
                'dept': 'Electronics & Communication Engineering', 'code': 'ECE',
                'programs': [
                    ('B.E. ECE', 'BE-ECE', 'ug', 8, 'credit'),
                ],
                'courses': [
                    ('ECE101', 'Circuit Theory', 'theory', 4, 4, 1),
                    ('ECE102', 'Circuits Lab', 'lab', 2, 4, 1),
                    ('ECE201', 'Signals & Systems', 'theory', 3, 3, 2),
                ],
            },
            {
                'dept': 'Management Studies', 'code': 'MGMT',
                'programs': [
                    ('MBA', 'MBA', 'pg', 4, 'credit'),
                ],
                'courses': [
                    ('MBA101', 'Principles of Management', 'theory', 3, 3, 1),
                    ('MBA102', 'Business Economics', 'theory', 3, 3, 1),
                    ('MBA103', 'Case Study Lab', 'tutorial', 2, 2, 1),
                ],
            },
        ]

        for item in seed:
            dept, _ = Department.objects.get_or_create(
                tenant=tenant, code=item['code'],
                defaults={'name': item['dept']}
            )
            self.stdout.write(f"  Department: {dept.name}")

            for pname, pcode, ptype, sems, scheme in item['programs']:
                prog, _ = Program.objects.get_or_create(
                    tenant=tenant, department=dept, code=pcode,
                    defaults={
                        'name': pname, 'program_type': ptype,
                        'total_semesters': sems, 'scheme_type': scheme
                    }
                )
                self.stdout.write(f"    Program: {prog.name}")

                # Batch
                batch = Batch.objects.filter(
                    tenant=tenant, program=prog, academic_year=ay, batch_label='2024-28'
                ).first()
                if not batch:
                    batch = Batch.objects.create(
                        tenant=tenant, program=prog, academic_year=ay,
                        batch_label='2024-28', intake=60
                    )
                # Sections A and B
                for sec in ('A', 'B'):
                    Section.objects.get_or_create(
                        batch=batch, name=sec,
                        defaults={'strength': 30}
                    )

            # Courses for first program only
            if item['programs']:
                first_prog_code = item['programs'][0][1]
                try:
                    prog = Program.objects.get(tenant=tenant, code=first_prog_code)
                    for ccode, cname, ctype, credits, hrs, sem in item['courses']:
                        Course.objects.get_or_create(
                            tenant=tenant, program=prog, code=ccode,
                            defaults={
                                'department': dept, 'name': cname,
                                'course_type': ctype, 'credits': credits,
                                'hours_per_week': hrs, 'semester_number': sem,
                            }
                        )
                        self.stdout.write(f"      Course: {ccode} - {cname}")
                except Program.DoesNotExist:
                    pass

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Seeded academic data for '{tenant.name}'."
        ))
