from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Resource
from .serializers import ResourceSerializer

class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['resource_type', 'status', 'tenant', 'floor']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return Resource.objects.all()
        return Resource.objects.filter(tenant=user.tenant)

    @action(detail=False, methods=['post'], url_path='allocate')
    def allocate(self, request):
        """
        POST /api/resources/allocate/
        Body: 
        {
           "capacity_needed": 60,
           "resource_type": "classroom",
           "required_facilities": ["projector"],
           "department_id": 1,
           "previously_used_room_ids": [5, 6],
           "occupied_room_ids": [10, 11]
        }
        """
        from .services.room_allocator import rank_and_allocate_room
        
        def coerce_to_list(val):
            if isinstance(val, str):
                return [int(x.strip()) for x in val.split(',') if x.strip().isdigit()]
            if isinstance(val, list):
                return [int(x) for x in val if str(x).isdigit()]
            return []
            
        data = request.data
        capacity_needed = int(data.get('capacity_needed', 0))
        resource_type = data.get('resource_type', 'classroom')
        required_facilities = data.get('required_facilities', [])
        if isinstance(required_facilities, str):
            required_facilities = [x.strip() for x in required_facilities.split(',')]
            
        department_id = data.get('department_id')
        if department_id: department_id = int(department_id)
        
        previously_used_room_ids = coerce_to_list(data.get('previously_used_room_ids', []))
        occupied_room_ids = coerce_to_list(data.get('occupied_room_ids', []))
        
        result = rank_and_allocate_room(
            tenant_id=request.user.tenant_id,
            capacity_needed=capacity_needed,
            resource_type=resource_type,
            required_facilities=required_facilities,
            department_id=department_id,
            previously_used_room_ids=previously_used_room_ids,
            occupied_room_ids=occupied_room_ids
        )
        
        response_data = {
            "allocated_room": self.get_serializer(result["allocated_room"]).data if result["allocated_room"] else None,
            "alternatives": self.get_serializer(result["alternatives"], many=True).data,
            "explanation": result["explanation"]
        }
        return Response(response_data)
