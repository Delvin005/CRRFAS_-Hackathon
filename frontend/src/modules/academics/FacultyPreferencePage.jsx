import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { SelectField } from '../../components/FormField'

const PREF_TYPES = ['preferred', 'willing', 'avoid']

const EMPTY = { faculty: '', course: '', preference_type: 'willing', notes: '' }

export default function FacultyPreferencePage() {
  const { items, loading, refetch } = useList(ACADEMICS.facultyPreferences)
  const { items: faculty } = useList(ACADEMICS.facultyProfiles)
  const { items: courses } = useList(ACADEMICS.courses)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [filterFaculty, setFilterFaculty] = useState('')

  const f = v => setForm(p => ({ ...p, ...v }))

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ faculty: row.faculty, course: row.course, preference_type: row.preference_type, notes: row.notes ?? '' })
    setErrors({}); setModal(true)
  }

  async function handleSave() {
    const e = {}
    if (!form.faculty) e.faculty = 'Required'
    if (!form.course) e.course = 'Required'
    setErrors(e); if (Object.keys(e).length) return

    setSaving(true)
    try {
      if (editing) await apiClient.patch(`${ACADEMICS.facultyPreferences}${editing.id}/`, form)
      else await apiClient.post(ACADEMICS.facultyPreferences, form)
      setModal(false); refetch()
    } catch (err) {
      setErrors({ api: err.response?.data?.detail || 'Save failed.' })
    } finally { setSaving(false) }
  }

  const prefBadge = t => ({
    preferred: 'text-accent-green border border-accent-green/30 bg-accent-green/10',
    willing: 'text-accent-cyan border border-accent-cyan/30 bg-accent-cyan/10',
    avoid: 'text-accent-red border border-accent-red/30 bg-accent-red/10',
  })[t] ?? ''

  const displayed = filterFaculty ? items.filter(i => String(i.faculty) === filterFaculty) : items

  const columns = [
    { key: 'faculty', label: 'Faculty ID' },
    { key: 'course_code', label: 'Course' },
    { key: 'course_name', label: 'Course Name' },
    { key: 'preference_type', label: 'Preference', render: r => <span className={`text-xs px-2 py-0.5 rounded-full ${prefBadge(r.preference_type)}`}>{r.preference_type}</span> },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div>
      <PageHeader title="Faculty Preferences"
        subtitle="Course teaching preferences for timetable generation"
        actions={<button className="btn-primary text-sm" onClick={openCreate}>+ Add Preference</button>}
      />
      <div className="mb-4">
        <select className="input w-56 text-sm" value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}>
          <option value="">All Faculty</option>
          {faculty.map(fa => <option key={fa.id} value={fa.id}>{fa.full_name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} rows={displayed} loading={loading}
        actions={row => <button className="text-accent-cyan text-xs hover:underline" onClick={() => openEdit(row)}>Edit</button>}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Preference' : 'Add Faculty Preference'}>
        <div className="space-y-3">
          <SelectField label="Faculty" required value={form.faculty} error={errors.faculty}
            onChange={e => f({ faculty: e.target.value })}>
            <option value="">Select...</option>
            {faculty.map(fa => <option key={fa.id} value={fa.id}>{fa.full_name}</option>)}
          </SelectField>
          <SelectField label="Course" required value={form.course} error={errors.course}
            onChange={e => f({ course: e.target.value })}>
            <option value="">Select...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </SelectField>
          <SelectField label="Preference Type" value={form.preference_type}
            onChange={e => f({ preference_type: e.target.value })}>
            {PREF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </SelectField>
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes}
              onChange={e => f({ notes: e.target.value })} placeholder="Optional notes..." />
          </div>
          {errors.api && <p className="text-accent-red text-xs">{errors.api}</p>}
          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
