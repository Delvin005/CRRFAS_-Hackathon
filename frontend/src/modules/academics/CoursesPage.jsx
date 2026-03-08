import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { InputField, SelectField } from '../../components/FormField'

const COURSE_TYPES = ['theory', 'lab', 'tutorial', 'project', 'elective', 'audit']
const EMPTY = { code: '', name: '', department: '', program: '', course_type: 'theory',
  credits: 3, hours_per_week: 3, semester_number: 1, is_elective: false }

export default function CoursesPage() {
  const { items, loading, refetch } = useList(ACADEMICS.courses)
  const { items: departments } = useList(ACADEMICS.departments)
  const { items: programs } = useList(ACADEMICS.programs)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [filters, setFilters] = useState({ dept: '', program: '', type: '' })

  const f = v => setForm(p => ({ ...p, ...v }))
  const filt = v => setFilters(p => ({ ...p, ...v }))

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ code: row.code, name: row.name, department: row.department, program: row.program,
      course_type: row.course_type, credits: row.credits, hours_per_week: row.hours_per_week,
      semester_number: row.semester_number, is_elective: row.is_elective })
    setErrors({}); setModal(true)
  }

  function validate() {
    const e = {}
    if (!form.code.trim()) e.code = 'Required'
    if (!form.name.trim()) e.name = 'Required'
    if (!form.department) e.department = 'Required'
    if (!form.program) e.program = 'Required'
    if (form.hours_per_week < 1 || form.hours_per_week > 40)
      e.hours_per_week = 'Must be 1–40'
    if (form.credits < 0) e.credits = 'Must be ≥ 0'
    setErrors(e); return !Object.keys(e).length
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      // Cast numeric fields so Django DecimalField / IntegerField accept them
      const payload = {
        ...form,
        credits: Number(form.credits),
        hours_per_week: Number(form.hours_per_week),
        semester_number: Number(form.semester_number),
      }
      if (editing) await apiClient.patch(`${ACADEMICS.courses}${editing.id}/`, payload)
      else await apiClient.post(ACADEMICS.courses, payload)
      setModal(false); refetch()
    } catch (err) {
      // DRF returns field errors as { field: ["msg"] } or { detail: "msg" }
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0]
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey]
        setErrors({ api: `${firstKey}: ${msg}` })
      } else {
        setErrors({ api: 'Save failed — check all fields and try again.' })
      }
    } finally { setSaving(false) }
  }

  const progByDept = filters.dept
    ? programs.filter(p => String(p.department) === filters.dept)
    : programs

  const displayed = items.filter(c =>
    (!filters.dept || String(c.department) === filters.dept) &&
    (!filters.program || String(c.program) === filters.program) &&
    (!filters.type || c.course_type === filters.type)
  )

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Course Name' },
    { key: 'program_name', label: 'Program' },
    { key: 'course_type', label: 'Type', render: r => <span className="capitalize">{r.course_type}</span> },
    { key: 'credits', label: 'Credits' },
    { key: 'hours_per_week', label: 'Hrs/Week' },
    { key: 'semester_number', label: 'Sem' },
  ]

  return (
    <div>
      <PageHeader title="Courses" subtitle="Course master data"
        actions={
          <>
            <a href="/academics/courses/import" className="btn-secondary text-sm">↑ Import CSV</a>
            <button className="btn-primary text-sm" onClick={openCreate}>+ Add Course</button>
          </>
        }
      />
      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="input w-48 text-sm" value={filters.dept} onChange={e => { filt({ dept: e.target.value, program: '' }) }}>
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-48 text-sm" value={filters.program} onChange={e => filt({ program: e.target.value })}>
          <option value="">All Programs</option>
          {progByDept.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="input w-40 text-sm" value={filters.type} onChange={e => filt({ type: e.target.value })}>
          <option value="">All Types</option>
          {COURSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <DataTable columns={columns} rows={displayed} loading={loading}
        actions={row => <button className="text-accent-cyan text-xs hover:underline" onClick={() => openEdit(row)}>Edit</button>}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Course' : 'New Course'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Course Code" required value={form.code} error={errors.code}
              onChange={e => f({ code: e.target.value })} placeholder="CSE101" />
            <SelectField label="Type" required value={form.course_type} onChange={e => f({ course_type: e.target.value })}>
              {COURSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </SelectField>
          </div>
          <InputField label="Course Name" required value={form.name} error={errors.name}
            onChange={e => f({ name: e.target.value })} placeholder="e.g. Data Structures" />
          <SelectField label="Department" required value={form.department} error={errors.department}
            onChange={e => { f({ department: e.target.value, program: '' }) }}>
            <option value="">Select...</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </SelectField>
          <SelectField label="Program" required value={form.program} error={errors.program}
            onChange={e => f({ program: e.target.value })}>
            <option value="">Select...</option>
            {progByDept.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <div className="grid grid-cols-3 gap-3">
            <InputField label="Credits" type="number" step="0.5" min="0" value={form.credits} error={errors.credits}
              onChange={e => f({ credits: e.target.value })} />
            <InputField label="Hrs/Week" type="number" min="1" max="40" value={form.hours_per_week} error={errors.hours_per_week}
              onChange={e => f({ hours_per_week: Number(e.target.value) })} />
            <InputField label="Semester" type="number" min="1" max="16" value={form.semester_number}
              onChange={e => f({ semester_number: Number(e.target.value) })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
            <input type="checkbox" checked={form.is_elective} onChange={e => f({ is_elective: e.target.checked })}
              className="accent-blue-500" />
            Mark as Elective
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
