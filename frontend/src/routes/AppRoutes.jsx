import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../auth/ProtectedRoute'
import DashboardLayout from '../layouts/DashboardLayout'
import AuthLayout from '../layouts/AuthLayout'

import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import ResourcesPage from '../pages/ResourcesPage'
import BookingsPage from '../pages/BookingsPage'
import ExamPlansPage from '../pages/exams/ExamPlansPage'
import ExamEditorPage from '../pages/exams/ExamEditorPage'
import PrintableExamView from '../pages/exams/PrintableExamView'
import ReportsPage from '../pages/ReportsPage'
import CampusPage from '../pages/CampusPage'
import UsersPage from '../pages/UsersPage'
import NotFoundPage from '../pages/NotFoundPage'

// Timetable module
import TimetablePlansPage from '../modules/timetable/TimetablePlansPage'
import TimetableEditorPage from '../modules/timetable/TimetableEditorPage'
import TimetableViewPage from '../modules/timetable/TimetableViewPage'

// Academics module
import DepartmentsPage from '../modules/academics/DepartmentsPage'
import ProgramsPage from '../modules/academics/ProgramsPage'
import SemestersPage from '../modules/academics/SemestersPage'
import CoursesPage from '../modules/academics/CoursesPage'
import CourseSectionsPage from '../modules/academics/CourseSectionsPage'
import FacultyListPage from '../modules/academics/FacultyListPage'
import FacultyAvailabilityPage from '../modules/academics/FacultyAvailabilityPage'
import FacultyPreferencePage from '../modules/academics/FacultyPreferencePage'
import BatchSectionPage from '../modules/academics/BatchSectionPage'
import CsvImportPage from '../modules/academics/CsvImportPage'

import ErrorBoundary from '../components/ErrorBoundary'
import CalendarPage from '../pages/calendar/CalendarPage'

// Reports module
import RoomUtilizationReport from '../pages/reports/RoomUtilizationReport'
import FacultyWorkloadReport from '../pages/reports/FacultyWorkloadReport'
import DepartmentTimetableReport from '../pages/reports/DepartmentTimetableReport'
import ResourceUtilizationReport from '../pages/reports/ResourceUtilizationReport'
import ExamScheduleReport from '../pages/reports/ExamScheduleReport'
import EventBookingsReport from '../pages/reports/EventBookingsReport'
import LabEquipmentReport from '../pages/reports/LabEquipmentReport'
import SportsUtilizationReport from '../pages/reports/SportsUtilizationReport'

export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/campus" element={<CampusPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/room-utilization" element={<RoomUtilizationReport />} />
        <Route path="/reports/faculty-workload" element={<FacultyWorkloadReport />} />
        <Route path="/reports/department-timetable" element={<DepartmentTimetableReport />} />
        <Route path="/reports/resource-utilization" element={<ResourceUtilizationReport />} />
        <Route path="/reports/exam-schedule" element={<ExamScheduleReport />} />
        <Route path="/reports/event-bookings" element={<EventBookingsReport />} />
        <Route path="/reports/lab-equipment" element={<LabEquipmentReport />} />
        <Route path="/reports/sports-utilization" element={<SportsUtilizationReport />} />
        <Route path="/exams" element={<Navigate to="/exams/plans" replace />} />
        <Route path="/exams/plans" element={<ExamPlansPage />} />
        <Route path="/exams/editor/:id" element={<ExamEditorPage />} />
        <Route path="/exams/printable/:sessionId" element={<PrintableExamView />} />
        
        {/* Module index redirects */}
        <Route path="/timetable" element={<Navigate to="/timetable/plans" replace />} />
        <Route path="/academics" element={<Navigate to="/academics/departments" replace />} />
        {/* Timetable module routes */}
        <Route path="/timetable/plans" element={<TimetablePlansPage />} />
        <Route path="/timetable/editor/:id" element={<TimetableEditorPage />} />
        <Route path="/timetable/view" element={<TimetableViewPage />} />
        
        {/* Academics module routes */}
        <Route path="/academics/departments" element={<DepartmentsPage />} />
        <Route path="/academics/programs" element={<ProgramsPage />} />
        <Route path="/academics/semesters" element={<SemestersPage />} />
        <Route path="/academics/courses" element={<CoursesPage />} />
        <Route path="/academics/courses/import" element={<CsvImportPage />} />
        <Route path="/academics/course-sections" element={<CourseSectionsPage />} />
        <Route path="/academics/faculty" element={<FacultyListPage />} />
        <Route path="/academics/faculty/availability" element={<FacultyAvailabilityPage />} />
        <Route path="/academics/faculty/preferences" element={<FacultyPreferencePage />} />
        <Route path="/academics/batches" element={<BatchSectionPage />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'tenant_admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}

