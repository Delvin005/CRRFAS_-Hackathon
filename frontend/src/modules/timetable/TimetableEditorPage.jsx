import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import apiClient from '../../api/apiClient'
import { useApi, useList } from '../../utils/useApi'
import { TIMETABLE } from '../../api/timetableEndpoints'
import { ACADEMICS } from '../../api/academicsEndpoints'
import { ENDPOINTS } from '../../api/endpoints'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'
import { InputField, SelectField } from '../../components/FormField'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export default function TimetableEditorPage() {
  const { id } = useParams()
  const { data: plan } = useApi(`${TIMETABLE.plans}${id}/`)
  const { items: sessions, refetch: refetchSessions } = useList(`${TIMETABLE.sessions}?plan=${id}`)
  const { items: templates } = useList(TIMETABLE.timeSlotTemplates)
  const { items: courses } = useList(ACADEMICS.courses)
  const { items: faculty } = useList(ACADEMICS.facultyProfiles)
  const { items: rooms } = useList(ENDPOINTS.resources)
  const { items: batches } = useList(ACADEMICS.batches)
  const { items: courseSections } = useList(ACADEMICS.courseSections)

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({})
  const [conflicts, setConflicts] = useState([])
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState(null)

  function openAdd(day = 'mon', start = '09:00', end = '10:00') {
    setEditingId(null)
    setForm({ plan: id, day, start_time: start, end_time: end, session_type: 'lecture', course: '', faculty_id: '', room_id: '', batch: '', course_section: '' })
    setConflicts([])
    setModal(true)
  }

  function openEdit(sess) {
    setEditingId(sess.id)
    setForm({
      plan: id, 
      day: sess.day, 
      start_time: sess.start_time, 
      end_time: sess.end_time, 
      session_type: sess.session_type, 
      course: sess.course || '', 
      faculty_id: sess.faculty_assignments?.[0]?.faculty || '', 
      room_id: sess.room_assignments?.[0]?.room || '', 
      batch: sess.batch || '', 
      course_section: sess.course_section || ''
    })
    setConflicts([])
    setModal(true)
  }

  async function checkConflicts(currentForm) {
    if (!currentForm.day || !currentForm.start_time || !currentForm.end_time) return
    setChecking(true)
    try {
      const payload = {
        day: currentForm.day, start_time: currentForm.start_time, end_time: currentForm.end_time,
        session_type: currentForm.session_type,
        faculty_profile_ids: currentForm.faculty_id ? [Number(currentForm.faculty_id)] : [],
        room_ids: currentForm.room_id ? [Number(currentForm.room_id)] : [],
        batch_id: currentForm.batch ? Number(currentForm.batch) : null,
        course_section_id: currentForm.course_section ? Number(currentForm.course_section) : null,
      }
      const res = await apiClient.post(TIMETABLE.checkConflicts, payload)
      setConflicts(res.data.conflicts || [])
    } catch (e) {
      console.error(e)
    } finally { setChecking(false) }
  }

  const f = (updates) => {
    const nextForm = { ...form, ...updates }
    setForm(nextForm)
    checkConflicts(nextForm)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingId) {
        await apiClient.delete(`${TIMETABLE.sessions}${editingId}/`)
      }

      // Create session
      const sessRes = await apiClient.post(TIMETABLE.sessions, {
        plan: id, 
        academic_year: plan.academic_year, 
        semester: plan.semester,
        department: plan.department,
        day: form.day, 
        start_time: form.start_time, 
        end_time: form.end_time,
        session_type: form.session_type, 
        course: form.course || null,
        batch: form.batch || null, 
        course_section: form.course_section || null,
      })
      const sessId = sessRes.data.id

      // Create assignments
      if (form.faculty_id) {
        await apiClient.post(TIMETABLE.facultyAssignments, { session: sessId, faculty: form.faculty_id, is_primary: true })
      }
      if (form.room_id) {
        await apiClient.post(TIMETABLE.roomAssignments, { session: sessId, room: form.room_id })
      }

      setModal(false)
      refetchSessions()
    } catch (err) {
      alert(err.response?.data?.detail || 'Save failed. Check form data.')
    } finally { setSaving(false) }
  }

  async function handleDelete(sessId) {
    if (!window.confirm('Delete this session?')) return
    await apiClient.delete(`${TIMETABLE.sessions}${sessId}/`)
    refetchSessions()
  }

  if (!plan) return <p className="p-6 text-neutral-400">Loading plan...</p>

  // Group sessions by day
  const sessionsByDay = {}
  DAYS.forEach(d => sessionsByDay[d] = [])
  sessions.forEach(s => { if (sessionsByDay[s.day]) sessionsByDay[s.day].push(s) })

  return (
    <div>
      <div className="mb-4">
        <Link to="/timetable/plans" className="text-accent-cyan text-sm hover:underline">← Back to Plans</Link>
      </div>
      <PageHeader title={`Editor: ${plan.name}`} subtitle={`Sem ${plan.semester_label} | ${plan.status.toUpperCase()}`}
        actions={<button className="btn-primary text-sm" onClick={() => openAdd()}>+ Add Session slot</button>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {DAYS.map(day => (
          <div key={day} className="card p-0 overflow-hidden hidden xl:block first:block [&:nth-child(-n+2)]:block">
            {/* simple responsive layout */}
            <div className="bg-primary-900 border-b border-primary-600/20 px-4 py-3 flex justify-between items-center text-sm font-bold uppercase tracking-wider text-neutral-300">
              {day}
              <button className="text-accent-cyan text-xs capitalize hover:underline" onClick={() => openAdd(day)}>+ Add</button>
            </div>
            <div className="p-1 space-y-1">
              {sessionsByDay[day].map(s => (
                <div key={s.id} className="bg-primary-900/50 rounded p-3 text-sm flex justify-between group border border-transparent hover:border-primary-600/30">
                  <div>
                    <div className="font-bold text-accent-cyan">{s.course_code} - <span className="text-neutral-300 font-medium">{s.session_type}</span></div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {s.start_time.slice(0,5)} – {s.end_time.slice(0,5)} | 
                      Room: {s.room_assignments?.[0]?.room_name || 'TBA'} | 
                      Fac: {s.faculty_assignments?.[0]?.faculty_name || 'TBA'}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 border-l border-primary-600/30 pl-2 ml-2">
                    <button onClick={() => openEdit(s)} className="text-accent-cyan hover:text-white text-xs font-medium text-left">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="text-accent-red hover:text-red-400 text-xs font-medium text-left">Del</button>
                  </div>
                </div>
              ))}
              {sessionsByDay[day].length === 0 && <p className="text-xs text-neutral-500 p-3 italic">No sessions.</p>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Class Session">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <SelectField label="Day" value={form.day} onChange={e => f({ day: e.target.value })}>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </SelectField>
            <InputField label="Start Time" type="time" value={form.start_time} onChange={e => f({ start_time: e.target.value })} />
            <InputField label="End Time" type="time" value={form.end_time} onChange={e => f({ end_time: e.target.value })} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Course" value={form.course} onChange={e => f({ course: e.target.value })}>
              <option value="">Select...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
            </SelectField>
            <SelectField label="Type" value={form.session_type} onChange={e => f({ session_type: e.target.value })}>
              <option value="lecture">Lecture</option><option value="lab">Lab</option><option value="tutorial">Tutorial</option>
            </SelectField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Batch" value={form.batch} onChange={e => f({ batch: e.target.value })}>
              <option value="">None</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_label}</option>)}
            </SelectField>
            <SelectField label="Section (A/B)" value={form.course_section} onChange={e => f({ course_section: e.target.value })}>
              <option value="">None</option>
              {courseSections.map(s => <option key={s.id} value={s.id}>{s.course_code} - Sec {s.section_label}</option>)}
            </SelectField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Faculty" value={form.faculty_id} onChange={e => f({ faculty_id: e.target.value })}>
              <option value="">Unassigned</option>
              {faculty.map(fac => <option key={fac.id} value={fac.id}>{fac.full_name}</option>)}
            </SelectField>
            <SelectField label="Room" value={form.room_id} onChange={e => f({ room_id: e.target.value })}>
              <option value="">Unassigned</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
            </SelectField>
          </div>

          {checking && <p className="text-xs text-accent-cyan">Checking conflicts...</p>}
          {conflicts.length > 0 && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
              <p className="text-xs font-bold text-accent-red mb-1">Conflicts Found!</p>
              <ul className="text-xs text-accent-red space-y-1 list-disc pl-4">
                {conflicts.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving || conflicts.length > 0}>
              {saving ? 'Saving...' : 'Save Session'}
            </button>
            <button className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
