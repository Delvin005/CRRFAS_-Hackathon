from django.db import transaction
from apps.exams.models import ExamPlan, ExamCourseAssignment, ExamHallAllocation, SeatingPlan

class SeatGenerator:
    def __init__(self, plan_id):
        self.plan = ExamPlan.objects.get(id=plan_id)

    @transaction.atomic
    def generate(self):
        # Clear existing seating for this plan (Drafts are overwritten)
        SeatingPlan.objects.filter(allocation__session__plan=self.plan).delete()
        
        allocations = list(ExamHallAllocation.objects.filter(session__plan=self.plan).order_by('session', 'resource__name'))
        
        stats = {
            'total_seats_generated': 0,
            'warnings': []
        }

        # Group allocations by session
        session_map = {}
        for alloc in allocations:
            if alloc.session_id not in session_map:
                session_map[alloc.session_id] = []
            session_map[alloc.session_id].append(alloc)

        # For each session, distribute students among the allocated halls
        for session_id, halls in session_map.items():
            courses = ExamCourseAssignment.objects.filter(session_id=session_id).order_by('course__code')
            
            # Simple list of students: For this PoC, we mock roll numbers up to the enrolled count.
            # In a full system, we would query the actual Student models linked to the Batch/Section.
            all_students = []
            for ca in courses:
                enrolled = ca.section.strength if ca.section else (ca.batch.intake if ca.batch else 60)
                prefix = f"{ca.course.code}-"
                for i in range(1, enrolled + 1):
                    all_students.append({
                        'roll_no': f"{prefix}{str(i).zfill(3)}",
                        'course_assignment': ca
                    })
            
            # Seat generation strategy: fill hall by hall, leaving a gap if necessary, but here we just pack them sequentially
            student_idx = 0
            student_count = len(all_students)

            for hall in halls:
                cap = hall.allocated_capacity
                seats_assigned_here = 0
                
                while seats_assigned_here < cap and student_idx < student_count:
                    student = all_students[student_idx]
                    SeatingPlan.objects.create(
                        allocation=hall,
                        course_assignment=student['course_assignment'],
                        student_roll_number=student['roll_no'],
                        seat_number=seats_assigned_here + 1
                    )
                    seats_assigned_here += 1
                    student_idx += 1
                    stats['total_seats_generated'] += 1

            if student_idx < student_count:
                stats['warnings'].append(f"Not enough seats allocated for session {session_id}. {student_count - student_idx} students unseated.")

        return stats
