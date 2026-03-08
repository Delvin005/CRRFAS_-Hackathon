import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { SelectField } from '../../components/FormField'

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday' }
const EMPTY = { faculty: '', day: 'mon', start_time: '09:00', end_time: '10:00', is_available: true }

export default function FacultyAvailabilityPage() {
  const { items, loading, refetch } = useList(ACADEMICS.facultyAvailability)
  const { items: faculty } = useList(ACADEMICS.facultyProfiles)
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
    setForm({ faculty: row.faculty, day: row.day, start_time: row.start_time,
      end_time: row.end_time, is_available: row.is_available })
    setErrors({}); setModal(true)
  }

  function validate() {
    const e = {}
    if (!form.faculty) e.faculty = 'Required'
    if (form.start_time >= form.end_time) e.end_time = 'End must be after start'
    setErrors(e); return !Object.keys(e).length
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) await apiClient.patch(`${ACADEMICS.facultyAvailability}${editing.id}/`, form)
      else await apiClient.post(ACADEMICS.facultyAvailability, form)
      setModal(false); refetch()
    } catch (err) {
      setErrors({ api: err.response?.data?.detail || 'Save failed.' })
    } finally { setSaving(false) }
  }

  const displayed = filterFaculty ? items.filter(i => String(i.faculty) === filterFaculty) : items

  const columns = [
    { key: 'faculty', label: 'Faculty ID' },
    { key: 'day', label: 'Day', render: r => DAY_LABELS[r.day] ?? r.day },
    { key: 'start_time', label: 'Start' },
    { key: 'end_time', label: 'End' },
    { key: 'is_available', label: 'Available', render: r => <span className={r.is_available ? 'badge-approved' : 'badge-rejected'}>{r.is_available ? 'Yes' : 'No'}</span> },
  ]

  return (
    <div>
      <PageHeader title="Faculty Availability"
        subtitle="Define weekly available slots for each faculty"
        actions={<button className="btn-primary text-sm" onClick={openCreate}>+ Add Slot</button>}
      />
      <div className="mb-4">
        <select className="input w-56 text-sm" value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)}>
          <option value="">All Faculty</option>
          {faculty.map(fa => <option key={fa.id} value={fa.id}>{fa.full_name} (#{fa.id})</option>)}
        </select>
      </div>

      <DataTable columns={columns} rows={displayed} loading={loading}
        actions={row => <button className="text-accent-cyan text-xs hover:underline" onClick={() => openEdit(row)}>Edit</button>}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Availability' : 'Add Availability Slot'}>
        <div className="space-y-3">
          <SelectField label="Faculty" required value={form.faculty} error={errors.faculty}
            onChange={e => f({ faculty: e.target.value })}>
            <option value="">Select...</option>
            {faculty.map(fa => <option key={fa.id} value={fa.id}>{fa.full_name}</option>)}
          </SelectField>
          <SelectField label="Day" value={form.day} onChange={e => f({ day: e.target.value })}>
            {DAYS.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Start Time</label>
              <input type="time" value={form.start_time} onChange={e => f({ start_time: e.target.value })} className="input" />
            </div>
            <div>
              <label className="text-xs text-neutral-400 block mb-1">End Time</label>
              <input type="time" value={form.end_time} onChange={e => f({ end_time: e.target.value })} className="input" />
              {errors.end_time && <p className="text-accent-red text-xs mt-1">{errors.end_time}</p>}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
            <input type="checkbox" checked={form.is_available} onChange={e => f({ is_available: e.target.checked })} className="accent-blue-500" />
            Available (uncheck = blocked time)
          </label>
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
