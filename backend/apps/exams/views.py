from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from apps.exams.models import (
    ExamPlan, ExamSession, ExamCourseAssignment, ExamHallAllocation,
    SeatingPlan, InvigilatorAssignment, ExamPublishLog
)
from apps.exams.serializers import (
    ExamPlanSerializer, ExamSessionSerializer, ExamCourseAssignmentSerializer,
    ExamHallAllocationSerializer, SeatingPlanSerializer, InvigilatorAssignmentSerializer,
    ExamPublishLogSerializer
)

class ExamPlanViewSet(viewsets.ModelViewSet):
    serializer_class = ExamPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['academic_year', 'semester', 'status']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return ExamPlan.objects.all()
        return ExamPlan.objects.filter(tenant=user.tenant)

    def perform_create(self, serializer):
        tenant = self.request.user.tenant
        if not tenant:
            from apps.tenants.models import Tenant
            tenant = Tenant.objects.first()
        serializer.save(tenant=tenant, created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='publish-action')
    def publish_action(self, request, pk=None):
        plan = self.get_object()
        action_type = request.data.get('action') # publish, unpublish, archive

        if action_type == 'publish':
            plan.status = 'published'
            plan.is_published = True
            plan.published_by = request.user
            plan.published_at = timezone.now()
        elif action_type == 'unpublish':
            plan.status = 'draft'
            plan.is_published = False
        elif action_type == 'archive':
            plan.status = 'archived'
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        plan.save()
        ExamPublishLog.objects.create(plan=plan, action=action_type, performed_by=request.user)
        return Response({'success': True, 'status': plan.status})

    @action(detail=True, methods=['post'], url_path='auto-allocate-halls')
    def auto_allocate_halls(self, request, pk=None):
        plan = self.get_object()
        if plan.is_published: return Response({'error': 'Cannot modify a published plan'}, status=400)
        
        try:
            from apps.exams.services.hall_allocation_service import ExamHallAllocator
            allocator = ExamHallAllocator(plan.id)
            stats = allocator.allocate()
            return Response({'success': True, 'stats': stats})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'], url_path='generate-seating')
    def generate_seating(self, request, pk=None):
        plan = self.get_object()
        if plan.is_published: return Response({'error': 'Cannot modify a published plan'}, status=400)
        
        try:
            from apps.exams.services.seat_generation_service import SeatGenerator
            generator = SeatGenerator(plan.id)
            stats = generator.generate()
            return Response({'success': True, 'stats': stats})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=True, methods=['post'], url_path='assign-invigilators')
    def assign_invigilators(self, request, pk=None):
        plan = self.get_object()
        if plan.is_published: return Response({'error': 'Cannot modify a published plan'}, status=400)
        
        try:
            from apps.exams.services.invigilator_service import InvigilatorService
            service = InvigilatorService(plan.id)
            stats = service.assign()
            return Response({'success': True, 'stats': stats})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class ExamSessionViewSet(viewsets.ModelViewSet):
    serializer_class = ExamSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['plan', 'date', 'session_type']

    def get_queryset(self):
        return ExamSession.objects.filter(plan__tenant=self.request.user.tenant)

    @action(detail=True, methods=['get'], url_path='printable-seating')
    def printable_seating(self, request, pk=None):
        session = self.get_object()
        allocations = session.hall_allocations.all().prefetch_related('seating_plans__course_assignment__course')
        
        data = []
        for alloc in allocations:
            seats = alloc.seating_plans.order_by('seat_number')
            data.append({
                'hall': alloc.resource.name,
                'capacity': alloc.resource.capacity,
                'seats': [
                    {
                        'seatNo': s.seat_number,
                        'rollNo': s.student_roll_number,
                        'course': s.course_assignment.course.code
                    } for s in seats
                ]
            })
        return Response(data)

class ExamCourseAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = ExamCourseAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['session', 'course', 'batch']

    def get_queryset(self):
        return ExamCourseAssignment.objects.filter(session__plan__tenant=self.request.user.tenant)

class ExamHallAllocationViewSet(viewsets.ModelViewSet):
    serializer_class = ExamHallAllocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['session', 'resource']

    def get_queryset(self):
        return ExamHallAllocation.objects.filter(session__plan__tenant=self.request.user.tenant)

class SeatingPlanViewSet(viewsets.ModelViewSet):
    serializer_class = SeatingPlanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['allocation', 'course_assignment']

    def get_queryset(self):
        return SeatingPlan.objects.filter(allocation__session__plan__tenant=self.request.user.tenant)
