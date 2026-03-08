import { useState } from 'react'
import { Link } from 'react-router-dom'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { TIMETABLE } from '../../api/timetableEndpoints'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { InputField, SelectField } from '../../components/FormField'

const EMPTY = { name: '', department: '', academic_year: '', semester: '' }

export default function TimetablePlansPage() {
  const { items, loading, refetch } = useList(TIMETABLE.plans)
  const { items: depts } = useList(ACADEMICS.departments)
  const { items: ays } = useList(ACADEMICS.academicYears)
  const { items: sems } = useList(ACADEMICS.semesters)

  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const f = v => setForm(p => ({ ...p, ...v }))

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ name: row.name, department: row.department, academic_year: row.academic_year, semester: row.semester })
    setErrors({}); setModal(true)
  }

  async function handleSave() {
    const e = {}
    if (!form.name) e.name = 'Required'
    if (!form.department) e.department = 'Required'
    if (!form.academic_year) e.academic_year = 'Required'
    if (!form.semester) e.semester = 'Required'
    setErrors(e); if (Object.keys(e).length) return

    setSaving(true)
    
    // Convert string IDs from Select to integers for the Django backend
    const payload = {
      name: form.name,
      department: parseInt(form.department, 10),
      academic_year: parseInt(form.academic_year, 10),
      semester: parseInt(form.semester, 10),
    }

    try {
      if (editing) await apiClient.patch(`${TIMETABLE.plans}${editing.id}/`, payload)
      else await apiClient.post(TIMETABLE.plans, payload)
      setModal(false); refetch()
    } catch (err) { setErrors({ api: err.response?.data?.detail || err.response?.data?.department || 'Save failed' }) }
    finally { setSaving(false) }
  }

  async function handlePublishAction(row, action) {
    if (!window.confirm(`Are you sure you want to ${action} this plan?`)) return
    try {
      await apiClient.post(TIMETABLE.publishAction(row.id), { action })
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed')
    }
  }

  async function handleAutoSchedule(row) {
    if (!window.confirm(`Are you sure you want to auto-generate the timetable for "${row.name}"? This may take a minute.`)) return
    
    setGenerating(true)
    try {
      await apiClient.post(TIMETABLE.autoSchedule(row.id))
      setSuccessMsg('Timetable generated successfully!')
      setTimeout(() => setSuccessMsg(''), 3000)
      refetch()
    } catch (err) {
      alert(err.response?.data?.error || 'Auto-generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const columns = [
    { key: 'name', label: 'Plan Name' },
    { key: 'department_name', label: 'Department' },
    { key: 'semester_label', label: 'Semester' },
    { key: 'status', label: 'Status', render: r => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_published ? 'bg-accent-green/20 text-accent-green' : 'bg-primary-600/30 text-neutral-300'}`}>
        {r.status.toUpperCase()}
      </span>
    )},
  ]

  return (
    <div>
      <PageHeader title="Timetable Plans" subtitle="Create and manage semester timetables"
        actions={<button className="btn-primary text-sm" onClick={openCreate}>+ Add Plan</button>}
      />

      {generating && (
        <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-primary-800 border border-primary-600 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-accent-cyan border-t-transparent rounded-full animate-spin"></div>
            <p className="text-neutral-200 font-medium">Generating optimal timetable... This may take a few seconds.</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-accent-green/20 border border-accent-green text-accent-green px-4 py-3 rounded shadow-lg z-50 flex items-center gap-2 animate-[slideIn_0.3s_ease-out]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <DataTable columns={columns} rows={items} loading={loading} actions={row => (
        <div className="flex gap-2 justify-end items-center">
          {!row.is_published ? (
            <>
              <button className="bg-primary-700 hover:bg-primary-600 text-accent-cyan text-[11px] font-medium px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors border border-primary-600/50" onClick={() => handleAutoSchedule(row)}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                Auto-Gen
              </button>
              <Link to={`/timetable/editor/${row.id}`} className="bg-primary-700 hover:bg-primary-600 text-neutral-200 text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors border border-primary-600/50">Edit Grid</Link>
              <button className="bg-primary-700 hover:bg-primary-600 text-neutral-300 text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors border border-primary-600/50" onClick={() => openEdit(row)}>Rename</button>
              <button className="bg-accent-green/10 hover:bg-accent-green/20 text-accent-green text-[11px] font-bold px-2.5 py-1.5 rounded transition-colors border border-accent-green/30" onClick={() => handlePublishAction(row, 'publish')}>Publish</button>
            </>
          ) : (
            <>
              <Link to={`/timetable/view?department=${row.department}`} className="bg-primary-700 hover:bg-primary-600 text-accent-cyan text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors border border-primary-600/50">View</Link>
              <button className="bg-accent-amber/10 hover:bg-accent-amber/20 text-accent-amber text-[11px] font-bold px-2.5 py-1.5 rounded transition-colors border border-accent-amber/30" onClick={() => handlePublishAction(row, 'unpublish')}>Unpublish</button>
            </>
          )}
        </div>
      )} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Plan' : 'New Plan'}>
        <div className="space-y-3">
          <SelectField label="Department" required value={form.department} error={errors.department} onChange={e => f({ department: e.target.value })}>
            <option value="">Select...</option>
            {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </SelectField>
          <SelectField label="Academic Year" required value={form.academic_year} error={errors.academic_year} onChange={e => f({ academic_year: e.target.value })}>
            <option value="">Select...</option>
            {ays.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
          </SelectField>
          <SelectField label="Semester" required value={form.semester} error={errors.semester} onChange={e => f({ semester: e.target.value })}>
            <option value="">Select...</option>
            {sems.map(s => <option key={s.id} value={s.id}>Sem {s.number} ({s.academic_year_label})</option>)}
          </SelectField>
          <InputField label="Plan Name" required value={form.name} error={errors.name} onChange={e => f({ name: e.target.value })} placeholder="e.g. Fall 2024 Final" />
          
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
