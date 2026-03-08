import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { InputField, SelectField } from '../../components/FormField'

const PROGRAM_TYPES = ['ug', 'pg', 'phd', 'diploma', 'certificate']
const SCHEME_TYPES = ['credit', 'marks', 'grade']
const EMPTY = { name: '', code: '', department: '', program_type: 'ug', scheme_type: 'credit', duration_years: 4, total_semesters: 8 }

export default function ProgramsPage() {
  const { items: programs, loading, refetch } = useList(ACADEMICS.programs)
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
    setForm({
      name: row.name, code: row.code, department: row.department,
      program_type: row.program_type, scheme_type: row.scheme_type,
      duration_years: row.duration_years, total_semesters: row.total_semesters
    })
    setErrors({})
    setModal(true)
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name required'
    if (!form.code.trim()) e.code = 'Code required'
    if (!form.department) e.department = 'Department required'
    if (form.total_semesters < 1) e.total_semesters = 'Min 1'
    setErrors(e)
    return !Object.keys(e).length
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        await apiClient.patch(`${ACADEMICS.programs}${editing.id}/`, form)
      } else {
        await apiClient.post(ACADEMICS.programs, form)
      }
      setModal(false); refetch()
    } catch (err) {
      setErrors({ api: err.response?.data?.detail || 'Save failed.' })
    } finally { setSaving(false) }
  }

  const filtered = filterDept ? programs.filter(p => String(p.department) === filterDept) : programs

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Program' },
    { key: 'department_name', label: 'Department' },
    { key: 'program_type', label: 'Type', render: r => r.program_type.toUpperCase() },
    { key: 'scheme_type', label: 'Scheme', render: r => r.scheme_type },
    { key: 'total_semesters', label: 'Semesters' },
  ]

  return (
    <div>
      <PageHeader title="Programs" subtitle="Academic programs by department"
        actions={<button className="btn-primary text-sm" onClick={openCreate}>+ Add Program</button>}
      />
      {/* Filter */}
      <div className="mb-4">
        <select className="input w-56 text-sm" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <DataTable columns={columns} rows={filtered} loading={loading}
        actions={row => (
          <button className="text-accent-cyan text-xs hover:underline" onClick={() => openEdit(row)}>Edit</button>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Program' : 'New Program'}>
        <div className="space-y-3">
          <SelectField label="Department" required value={form.department} error={errors.department}
            onChange={e => f({ department: e.target.value })}>
            <option value="">Select...</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </SelectField>
          <InputField label="Program Name" required value={form.name} error={errors.name}
            onChange={e => f({ name: e.target.value })} placeholder="e.g. B.E. Computer Science" />
          <InputField label="Code" required value={form.code} error={errors.code}
            onChange={e => f({ code: e.target.value })} placeholder="e.g. BE-CSE" />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Type" required value={form.program_type} onChange={e => f({ program_type: e.target.value })}>
              {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </SelectField>
            <SelectField label="Scheme" value={form.scheme_type} onChange={e => f({ scheme_type: e.target.value })}>
              {SCHEME_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </SelectField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Duration (years)" type="number" value={form.duration_years}
              onChange={e => f({ duration_years: Number(e.target.value) })} min={1} max={10} />
            <InputField label="Total Semesters" type="number" value={form.total_semesters}
              error={errors.total_semesters} onChange={e => f({ total_semesters: Number(e.target.value) })} min={1} max={16} />
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
