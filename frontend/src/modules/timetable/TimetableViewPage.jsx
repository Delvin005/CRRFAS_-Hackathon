import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { TIMETABLE } from '../../api/timetableEndpoints'
import { ACADEMICS } from '../../api/academicsEndpoints'
import { ENDPOINTS } from '../../api/endpoints'
import PageHeader from '../../components/PageHeader'
import { SelectField } from '../../components/FormField'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export default function TimetableViewPage() {
  const [filters, setFilters] = useState({ department: '', faculty: '', room: '', batch: '' })

  const queryParams = new URLSearchParams()
  if (filters.department) queryParams.append('department', filters.department)
  if (filters.faculty) queryParams.append('faculty_assignments__faculty', filters.faculty)
  if (filters.room) queryParams.append('room_assignments__room', filters.room)
  if (filters.batch) queryParams.append('batch', filters.batch)
  
  // Fetch active sessions with filters applied
  const { items: sessions, loading } = useList(`${TIMETABLE.sessions}?status=active&${queryParams.toString()}`)
  
  const { items: depts } = useList(ACADEMICS.departments)
  const { items: faculty } = useList(ACADEMICS.facultyProfiles)
  const { items: rooms } = useList(ENDPOINTS.resources)
  const { items: batches } = useList(ACADEMICS.batches)

  function f(updates) { setFilters(prev => ({ ...prev, ...updates })) }

  // Group by day for simple rendering
  const sessionsByDay = {}
  DAYS.forEach(d => sessionsByDay[d] = [])
  sessions.forEach(s => {
    if (sessionsByDay[s.day]) {
      sessionsByDay[s.day].push(s)
    }
  })
  // sort each day by start time
  Object.values(sessionsByDay).forEach(list => list.sort((a,b) => a.start_time.localeCompare(b.start_time)))

  return (
    <div className="flex flex-col h-full">
      <div className="print:hidden">
        <PageHeader title="Weekly Timetable View" subtitle="Filter and print class schedules"
          actions={<button className="btn-secondary text-sm" onClick={() => window.print()}>🖨️ Print</button>}
        />
        
        {/* Filters */}
        <div className="card p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <SelectField label="Department" value={filters.department} onChange={e => f({ department: e.target.value })}>
            <option value="">All Departments</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </SelectField>
          <SelectField label="Faculty" value={filters.faculty} onChange={e => f({ faculty: e.target.value })}>
            <option value="">All Faculty</option>
            {faculty.map(fac => <option key={fac.id} value={fac.id}>{fac.full_name}</option>)}
          </SelectField>
          <SelectField label="Room" value={filters.room} onChange={e => f({ room: e.target.value })}>
            <option value="">All Rooms</option>
            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </SelectField>
          <SelectField label="Batch" value={filters.batch} onChange={e => f({ batch: e.target.value })}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.batch_label}</option>)}
          </SelectField>
        </div>
      </div>

      <div className="print:block">
        <h2 className="hidden print:block text-2xl font-bold mb-4 text-neutral-800">Weekly Timetable</h2>
        {/* Print-friendly grid */}
        {loading ? <p>Loading...</p> : (
          <div className="space-y-6">
            {DAYS.map(day => {
              const daySessions = sessionsByDay[day]
              if (daySessions.length === 0) return null
              
              return (
                <div key={day} className="border border-primary-600/30 print:border-neutral-300 rounded overflow-hidden break-inside-avoid">
                  <div className="bg-primary-800 print:bg-neutral-200 print:text-neutral-900 px-4 py-2 font-bold uppercase tracking-wider text-sm">
                    {day}
                  </div>
                  <div className="divide-y divide-primary-600/10 print:divide-neutral-200 border-t border-primary-600/30 print:border-neutral-300">
                    {daySessions.map(sess => (
                      <div key={sess.id} className="p-3 flex flex-col sm:flex-row gap-4 justify-between hover:bg-primary-900/50 print:text-neutral-900">
                        <div className="flex-[2]">
                          <div className="font-bold text-accent-cyan print:text-blue-700">{sess.course_code} - {sess.course_name}</div>
                          <div className="text-xs text-neutral-400 print:text-neutral-600 uppercase tracking-widest mt-1">
                            {sess.session_type} | {sess.section_name ? `Sec ${sess.section_name}` : `Batch ${sess.batch_label}`}
                          </div>
                        </div>
                        <div className="flex-1 text-sm">
                          <span className="text-neutral-400 print:text-neutral-500 text-xs block mb-0.5">Time</span>
                          <span className="font-mono">{sess.start_time.slice(0,5)} - {sess.end_time.slice(0,5)}</span>
                        </div>
                        <div className="flex-1 text-sm">
                          <span className="text-neutral-400 print:text-neutral-500 text-xs block mb-0.5">Room</span>
                          {sess.room_assignments?.[0]?.room_name || 'TBA'}
                        </div>
                        <div className="flex-1 text-sm">
                          <span className="text-neutral-400 print:text-neutral-500 text-xs block mb-0.5">Faculty</span>
                          {sess.faculty_assignments?.[0]?.faculty_name || 'TBA'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {Object.values(sessionsByDay).every(list => list.length === 0) && (
              <p className="text-neutral-400 italic">No scheduled sessions for the selected filters.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
