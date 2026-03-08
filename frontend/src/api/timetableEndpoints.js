export const TIMETABLE = {
  plans: '/timetable/plans/',
  publishAction: (id) => `/timetable/plans/${id}/publish-action/`,
  publishLogs: (id) => `/timetable/plans/${id}/publish-log/`,
  workingDays: '/timetable/working-days/',
  timeSlotTemplates: '/timetable/time-slot-templates/',
  sessions: '/timetable/sessions/',
  checkConflicts: '/timetable/sessions/check-conflicts/',
  facultyAssignments: '/timetable/faculty-assignments/',
  roomAssignments: '/timetable/room-assignments/',
  autoSchedule: (id) => `/timetable/plans/${id}/auto-schedule/`,
  seed: '/timetable/seed/',
}
