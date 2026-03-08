import random
from django.db import transaction
from django.db.models import Count
from apps.exams.models import ExamPlan, ExamHallAllocation, InvigilatorAssignment
from apps.academics.models import FacultyProfile, FacultyAvailability

class InvigilatorService:
    def __init__(self, plan_id):
        self.plan = ExamPlan.objects.get(id=plan_id)
        self.tenant = self.plan.tenant

    @transaction.atomic
    def assign(self):
        InvigilatorAssignment.objects.filter(allocation__session__plan=self.plan).delete()
        
        allocations = ExamHallAllocation.objects.filter(session__plan=self.plan).select_related('session')
        
        stats = {
            'allocations_needing_invigilators': len(allocations),
            'invigilators_assigned': 0,
            'warnings': []
        }

        # Fetch all active faculty who could invigilate
        pool = list(FacultyProfile.objects.filter(tenant=self.tenant, is_active=True))

        for alloc in allocations:
            session = alloc.session
            
            # Simple check: Faculty cannot be busy invoking another hall in the same session
            busy_faculty_ids = InvigilatorAssignment.objects.filter(
                allocation__session=session
            ).values_list('faculty_id', flat=True)
            
            available_faculty = [f for f in pool if f.id not in busy_faculty_ids]
            
            if not available_faculty:
                stats['warnings'].append(f"No available faculty for {alloc.resource.name} during {session}")
                continue
                
            # Pick a random available faculty (for PoC). Could weight by department proximity or load.
            chosen = random.choice(available_faculty)
            
            InvigilatorAssignment.objects.create(
                allocation=alloc,
                faculty=chosen,
                is_chief_invigilator=alloc.allocated_capacity >= 60 # Chief if hall is large
            )
            stats['invigilators_assigned'] += 1

        return stats
