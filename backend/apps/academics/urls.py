from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DepartmentViewSet, ProgramViewSet, AcademicYearViewSet, SemesterViewSet,
    CourseViewSet, CourseSectionViewSet,
    FacultyProfileViewSet, FacultyAvailabilityViewSet, FacultyPreferenceViewSet,
    BatchViewSet, SectionViewSet, StudentGroupViewSet,
    DepartmentRoomPreferenceViewSet,
    BulkCourseUploadView, SeedAcademicsView,
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'semesters', SemesterViewSet, basename='semester')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'course-sections', CourseSectionViewSet, basename='course-section')
router.register(r'faculty-profiles', FacultyProfileViewSet, basename='faculty-profile')
router.register(r'faculty-availability', FacultyAvailabilityViewSet, basename='faculty-availability')
router.register(r'faculty-preferences', FacultyPreferenceViewSet, basename='faculty-preference')
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'student-groups', StudentGroupViewSet, basename='student-group')
router.register(r'room-preferences', DepartmentRoomPreferenceViewSet, basename='room-preference')

urlpatterns = [
    path('', include(router.urls)),
    path('bulk-upload/', BulkCourseUploadView.as_view(), name='bulk-course-upload'),
    path('seed/', SeedAcademicsView.as_view(), name='seed-academics'),
]
