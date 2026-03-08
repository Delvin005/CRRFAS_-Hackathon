import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { InputField, SelectField } from '../../components/FormField'

const EMPTY = { program: '', academic_year: '', number: 1, start_date: '', end_date: '', is_current: false }

export default function SemestersPage() {
  const { items, loading, refetch } = useList(ACADEMICS.semesters)
  const { items: programs } = useList(ACADEMICS.programs)
  const { items: academicYears } = useList(ACADEMICS.academicYears)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [filterProgram, setFilterProgram] = useState('')

  const f = v => setForm(p => ({ ...p, ...v }))

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ program: row.program, academic_year: row.academic_year, number: row.number,
      start_date: row.start_date ?? '', end_date: row.end_date ?? '', is_current: row.is_current })
    setErrors({}); setModal(true)
  }

  function validate() {
    const e = {}
    if (!form.program) e.program = 'Required'
    if (!form.academic_year) e.academic_year = 'Required'
    if (!form.number) e.number = 'Required'
    setErrors(e); return !Object.keys(e).length
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) await apiClient.patch(`${ACADEMICS.semesters}${editing.id}/`, form)
      else await apiClient.post(ACADEMICS.semesters, form)
      setModal(false); refetch()
    } catch (err) {
      setErrors({ api: err.response?.data?.detail || 'Save failed.' })
    } finally { setSaving(false) }
  }

  const filtered = filterProgram ? items.filter(s => String(s.program) === filterProgram) : items

  const columns = [
    { key: 'number', label: 'Semester' },
    { key: 'program_name', label: 'Program' },
    { key: 'academic_year_label', label: 'Academic Year' },
    { key: 'start_date', label: 'Start' },
    { key: 'end_date', label: 'End' },
    { key: 'is_current', label: 'Current', render: r => r.is_current ? <span className="badge-approved">Current</span> : '—' },
  ]

  return (
    <div>
      <PageHeader title="Semesters" subtitle="Setup semesters per program and academic year"
        actions={<button className="btn-primary text-sm" onClick={openCreate}>+ Add Semester</button>}
      />
      <div className="mb-4">
        <select className="input w-56 text-sm" value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
          <option value="">All Programs</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <DataTable columns={columns} rows={filtered} loading={loading}
        actions={row => <button className="text-accent-cyan text-xs hover:underline" onClick={() => openEdit(row)}>Edit</button>}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Semester' : 'New Semester'}>
        <div className="space-y-3">
          <SelectField label="Program" required value={form.program} error={errors.program}
            onChange={e => f({ program: e.target.value })}>
            <option value="">Select...</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <SelectField label="Academic Year" required value={form.academic_year} error={errors.academic_year}
            onChange={e => f({ academic_year: e.target.value })}>
            <option value="">Select...</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
          </SelectField>
          <InputField label="Semester Number" required type="number" min={1} max={16} value={form.number}
            error={errors.number} onChange={e => f({ number: Number(e.target.value) })} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Start Date" type="date" value={form.start_date} onChange={e => f({ start_date: e.target.value })} />
            <InputField label="End Date" type="date" value={form.end_date} onChange={e => f({ end_date: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
            <input type="checkbox" checked={form.is_current} onChange={e => f({ is_current: e.target.checked })}
              className="accent-blue-500" />
            Mark as Current Semester
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
