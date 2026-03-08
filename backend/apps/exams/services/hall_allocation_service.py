from django.db import transaction
from apps.exams.models import ExamPlan, ExamSession, ExamCourseAssignment, ExamHallAllocation
from apps.resources.models import Resource
from apps.resources.services.room_allocator import rank_and_allocate_room

class ExamHallAllocator:
    def __init__(self, plan_id):
        self.plan = ExamPlan.objects.get(id=plan_id)
        self.tenant = self.plan.tenant

    def _get_enrolled_count(self, assignment):
        # A simple heuristic: if a specific section is assigned, use its strength.
        # Otherwise, use the batch's total intake.
        if assignment.section:
            return assignment.section.strength
        elif assignment.batch:
            return assignment.batch.intake
        else:
            # Fallback: sum all sections for the course in that semester
            sections = assignment.course.sections.filter(semester=self.plan.semester)
            return sum(s.max_students for s in sections) if sections.exists() else 60

    @transaction.atomic
    def allocate(self):
        # Clear existing allocations for draft
        ExamHallAllocation.objects.filter(session__plan=self.plan).delete()
        
        sessions = list(ExamSession.objects.filter(plan=self.plan).prefetch_related('course_assignments'))
        
        stats = {
            'total_sessions': len(sessions),
            'sessions_allocated': 0,
            'total_halls_needed': 0,
            'halls_allocated': 0,
            'warnings': []
        }

        for session in sessions:
            assignments = session.course_assignments.all()
            if not assignments.exists():
                continue

            # Calculate total capacity needed for this session across all exams
            total_capacity_needed = sum(self._get_enrolled_count(a) for a in assignments)
            stats['total_halls_needed'] += 1

            occupied_room_ids = list(ExamHallAllocation.objects.filter(
                session__date=session.date,
                session__session_type=session.session_type
            ).values_list('resource_id', flat=True))

            capacity_met = 0
            # Strategy: Keep allocating rooms until capacity is met for the session
            # We use the modular room_allocator from the resources app.
            
            # Since an exam might need multiple halls if it's large, we loop.
            # But the 'rank_and_allocate_room' function assigns ONE best room.
            
            while capacity_met < total_capacity_needed:
                remaining_capacity = total_capacity_needed - capacity_met
                
                # Check for available rooms that can fit remaining, or just get the biggest available
                # If we expect the room allocator to find rooms >= capacity, it might fail if no single room is big enough
                # So we let the room allocator try to find *any* suitable classroom/hall, favoring larger ones if needed
                # Actually, the room_allocator strictly enforces capacity. So if we ask for 200, it returns None if max is 100.
                # Since exams often span multiple rooms, we need to adapt our request.
                
                # We ask for a room closest to 'remaining_capacity'. If it fails, we ask for a smaller capacity (e.g. 50).
                request_cap = min(remaining_capacity, 150) # Assuming largest hall is ~150
                
                res = rank_and_allocate_room(
                    tenant_id=self.tenant.id,
                    capacity_needed=request_cap,
                    resource_type='classroom', # Assume generic classrooms for exams
                    occupied_room_ids=occupied_room_ids
                )
                
                # If it fails to find a room fitting `request_cap`, try asking for something smaller like 40 to piece it together.
                if not res.get('allocated_room') and request_cap > 40:
                    res = rank_and_allocate_room(
                        tenant_id=self.tenant.id,
                        capacity_needed=40, # Any small room
                        resource_type='classroom',
                        occupied_room_ids=occupied_room_ids
                    )

                if not res.get('allocated_room'):
                    stats['warnings'].append(f"Insufficient hall capacity for session {session}. Needed {remaining_capacity} more seats.")
                    break
                
                room = res['allocated_room']
                occupied_room_ids.append(room.id)
                
                allocated_cap = min(remaining_capacity, room.capacity)
                capacity_met += allocated_cap
                
                ExamHallAllocation.objects.create(
                    session=session,
                    resource=room,
                    allocated_capacity=allocated_cap
                )
                stats['halls_allocated'] += 1

            if capacity_met >= total_capacity_needed:
                stats['sessions_allocated'] += 1
                
        return stats
