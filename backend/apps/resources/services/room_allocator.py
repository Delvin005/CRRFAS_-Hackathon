from apps.resources.models import Resource
from apps.academics.models import DepartmentRoomPreference

def rank_and_allocate_room(
    tenant_id,
    capacity_needed,
    resource_type='classroom',
    required_facilities=None,
    department_id=None,
    previously_used_room_ids=None,
    occupied_room_ids=None
):
    """
    Room Allocation Engine.
    Assigns the most suitable room based on ranked criteria:
    1. room availability (status == 'available' and not in occupied_room_ids)
    2. capacity >= class size
    3. required facilities present (has_projector, has_ac, has_whiteboard)
    4. proximity to department primary building
    5. minimize room changes (favor previously_used_room_ids)

    Returns:
        dict: {
            "allocated_room": Resource or None,
            "alternatives": [Resource, ...],
            "explanation": "String explaining the choice"
        }
    """
    if required_facilities is None:
        required_facilities = []
    if previously_used_room_ids is None:
        previously_used_room_ids = []
    if occupied_room_ids is None:
        occupied_room_ids = []

    # 1. Base query: available rooms of correct type
    rooms = Resource.objects.select_related('floor__building').filter(
        tenant_id=tenant_id,
        status='available',
        resource_type=resource_type
    ).exclude(id__in=occupied_room_ids)

    # Fetch Department Preferences if applicable
    preferred_building = None
    if department_id:
        prefs = DepartmentRoomPreference.objects.filter(
            department_id=department_id, 
            resource_type=resource_type
        ).first()
        if prefs and prefs.preferred_building_name:
            preferred_building = prefs.preferred_building_name.lower()

    candidates = []
    for room in rooms:
        # 2. Hard constraint: Capacity must be >= needed
        if room.capacity < capacity_needed:
            continue

        # 3. Hard constraint: Required facilities must be present
        missing_facility = False
        for fac in required_facilities:
            if fac == 'projector' and not room.has_projector:
                missing_facility = True
            elif fac == 'ac' and not room.has_ac:
                missing_facility = True
            elif fac == 'whiteboard' and not room.has_whiteboard:
                missing_facility = True
        
        if missing_facility:
            continue

        # Valid candidate, calculate score for ranking
        score = 0
        reasons = []

        # Criterion: Smallest room that fits (save larger rooms for larger classes)
        # Higher score for rooms with capacity closer to needed
        capacity_diff = room.capacity - capacity_needed
        # Max score for perfect fit is 100, drops as room gets too large
        score += max(0, 100 - capacity_diff)
        reasons.append(f"Capacity fit (+{max(0, 100 - capacity_diff)})")

        # 4. Proximity to department
        if preferred_building and room.floor and room.floor.building:
            b_name = room.floor.building.name.lower()
            if preferred_building in b_name or b_name in preferred_building:
                score += 50
                reasons.append("In preferred department building (+50)")

        # 5. Minimize room changes
        if room.id in previously_used_room_ids:
            score += 75
            reasons.append("Previously used for this course (+75)")

        candidates.append({
            'room': room,
            'score': score,
            'reasons': reasons
        })

    if not candidates:
        return {
            "allocated_room": None,
            "alternatives": [],
            "explanation": "No available rooms met the capacity and facility requirements."
        }

    # Sort by score descending
    candidates.sort(key=lambda c: c['score'], reverse=True)

    best_match = candidates[0]
    alternatives = [c['room'] for c in candidates[1:4]] # Top 3 alternatives

    explanation_str = "Selected because: " + ", ".join(best_match['reasons']) + f" (Score: {best_match['score']})"

    return {
        "allocated_room": best_match['room'],
        "alternatives": alternatives,
        "explanation": explanation_str
    }
