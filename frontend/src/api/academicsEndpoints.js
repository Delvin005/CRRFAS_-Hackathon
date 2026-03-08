/**
 * Shared academics API endpoint constants.
 * Extends the main endpoints.js pattern.
 */
export const ACADEMICS = {
  departments: '/academics/departments/',
  programs: '/academics/programs/',
  academicYears: '/academics/academic-years/',
  semesters: '/academics/semesters/',
  courses: '/academics/courses/',
  courseSections: '/academics/course-sections/',
  assignFaculty: (id) => `/academics/course-sections/${id}/assign-faculty/`,
  unassignFaculty: (id) => `/academics/course-sections/${id}/unassign-faculty/`,
  facultyProfiles: '/academics/faculty-profiles/',
  facultyAvailability: '/academics/faculty-availability/',
  facultyPreferences: '/academics/faculty-preferences/',
  batches: '/academics/batches/',
  sections: '/academics/sections/',
  studentGroups: '/academics/student-groups/',
  bulkUpload: '/academics/bulk-upload/',
  seed: '/academics/seed/',
}
