import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { InputField, SelectField } from '../../components/FormField'

const DESIGNATIONS = ['professor', 'associate_professor', 'assistant_professor', 'lecturer', 'guest_faculty', 'lab_instructor']
const EMPTY = { user: '', department: '', designation: 'assistant_professor', specialization: '', max_hours_per_week: 18, joining_date: '' }

export default function FacultyListPage() {
  const { items, loading, refetch } = useList(ACADEMICS.facultyProfiles)
  const { items: departments } = useList(ACADEMICS.departments)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [filterDept, setFilterDept] = useState('')

  const f = v => setForm(p => ({ ...p, ...v }))

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ user: row.user, department: row.department, designation: row.designation,
      specialization: row.specialization, max_hours_per_week: row.max_hours_per_week,
      joining_date: row.joining_date ?? '' })
    setErrors({}); setModal(true)
  }

  function validate() {
    const e = {}
    if (!form.user) e.user = 'User ID required'
    if (!form.department) e.department = 'Required'
    if (form.max_hours_per_week < 1 || form.max_hours_per_week > 40)
      e.max_hours_per_week = 'Must be 1–40 hrs/week'
    setErrors(e); return !Object.keys(e).length
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) await apiClient.patch(`${ACADEMICS.facultyProfiles}${editing.id}/`, form)
      else await apiClient.post(ACADEMICS.facultyProfiles, form)
      setModal(false); refetch()
    } catch (err) {
      setErrors({ api: err.response?.data?.user?.[0] || err.response?.data?.detail || 'Save failed.' })
    } finally { setSaving(false) }
  }

  const displayed = filterDept ? items.filter(f => String(f.department) === filterDept) : items

  const columns = [
    { key: 'id', label: 'User ID', render: r => r.user },
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'department_name', label: 'Department' },
    { key: 'designation', label: 'Designation', render: r => r.designation.replace(/_/g, ' ') },
    { key: 'max_hours_per_week', label: 'Max Hrs/Week' },
    { key: 'is_active', label: 'Status', render: r => <span className={r.is_active ? 'badge-approved' : 'badge-rejected'}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ]

  return (
    <div>
      <PageHeader title="Faculty" subtitle="Faculty profiles and settings"
        actions={<button className="btn-primary text-sm" onClick={openCreate}>+ Add Faculty Profile</button>}
      />
      <div className="mb-4">
        <select className="input w-56 text-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} rows={displayed} loading={loading}
        actions={row => <button className="text-accent-cyan text-xs hover:underline" onClick={() => openEdit(row)}>Edit</button>}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Faculty Profile' : 'New Faculty Profile'}>
        <div className="space-y-3">
          <InputField label="User ID" required type="number" value={form.user} error={errors.user}
            onChange={e => f({ user: Number(e.target.value) })}
            placeholder="User ID (must have role=faculty)" />
          <SelectField label="Department" required value={form.department} error={errors.department}
            onChange={e => f({ department: e.target.value })}>
            <option value="">Select...</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </SelectField>
          <SelectField label="Designation" value={form.designation} onChange={e => f({ designation: e.target.value })}>
            {DESIGNATIONS.map(d => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
          </SelectField>
          <InputField label="Specialization" value={form.specialization}
            onChange={e => f({ specialization: e.target.value })} placeholder="e.g. Machine Learning" />
          <InputField label="Max Hours/Week" type="number" min="1" max="40"
            value={form.max_hours_per_week} error={errors.max_hours_per_week}
            onChange={e => f({ max_hours_per_week: Number(e.target.value) })} />
          <InputField label="Joining Date" type="date" value={form.joining_date}
            onChange={e => f({ joining_date: e.target.value })} />
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
