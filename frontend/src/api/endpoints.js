// All API endpoint strings in one place
export const ENDPOINTS = {
  auth: {
    token: '/auth/token/',
    refresh: '/auth/token/refresh/',
  },
  accounts: {
    me: '/accounts/me/',
    register: '/accounts/register/',
    users: '/accounts/users/',
  },
  tenants: '/tenants/',
  campus: {
    campuses: '/campus/campuses/',
    buildings: '/campus/buildings/',
    floors: '/campus/floors/',
  },
  resources: '/resources/',
  bookings: {
    list: '/bookings/',
    approveReject: (id) => `/bookings/${id}/approve_reject/`,
  },
  academics: {
    departments: '/academics/departments/',
    programs: '/academics/programs/',
    academicYears: '/academics/academic-years/',
  },
  timetable: {
    slots: '/timetable/slots/',
    calendarFeed: '/timetable/calendar-feed/',
  },
  exams: {
    schedules: '/exams/schedules/',
    plans: '/exams/plans/',
    sessions: '/exams/sessions/',
    courseAssignments: '/exams/course-assignments/',
    hallAllocations: '/exams/hall-allocations/',
    invigilation: '/exams/invigilations/',
    generateAllocations: (id) => `/exams/plans/${id}/generate-allocations/`,
    autoAllocate: (id) => `/exams/plans/${id}/auto-allocate-halls/`,
    generateSeating: (id) => `/exams/plans/${id}/generate-seating/`,
    assignInvigilators: (id) => `/exams/plans/${id}/assign-invigilators/`,
    publish: (id) => `/exams/plans/${id}/publish-action/`,
    printableSeating: (id) => `/exams/sessions/${id}/printable-seating/`,
  },
  reports: {
    roomUtilization:       '/reports/room-utilization/',
    facultyWorkload:       '/reports/faculty-workload/',
    departmentTimetable:   '/reports/department-timetable/',
    resourceUtilization:   '/reports/resource-utilization/',
    examSchedule:          '/reports/exam-schedule/',
    eventBookings:         '/reports/event-bookings/',
    labEquipment:          '/reports/lab-equipment/',
    sportsUtilization:     '/reports/sports-utilization/',
  },
  notifications: '/notifications/',
}
