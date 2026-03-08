import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { InputField, SelectField } from '../../components/FormField'

const EMPTY = { course: '', semester: '', section_label: 'A', max_students: 60 }

export default function CourseSectionsPage() {
  const { items, loading, refetch } = useList(ACADEMICS.courseSections)
  const { items: courses } = useList(ACADEMICS.courses)
  const { items: semesters } = useList(ACADEMICS.semesters)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [assignModal, setAssignModal] = useState(null) // {sectionId, facultyId}
  const [facultyUserId, setFacultyUserId] = useState('')
  const [filterCourse, setFilterCourse] = useState('')

  const f = v => setForm(p => ({ ...p, ...v }))

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true) }
  function openEdit(row) {
    setEditing(row)
    setForm({ course: row.course, semester: row.semester, section_label: row.section_label, max_students: row.max_students })
    setErrors({}); setModal(true)
  }

  async function handleSave() {
    const e = {}
    if (!form.course) e.course = 'Required'
    if (!form.semester) e.semester = 'Required'
    if (!form.section_label.trim()) e.section_label = 'Required'
    setErrors(e); if (Object.keys(e).length) return

    setSaving(true)
    try {
      if (editing) await apiClient.patch(`${ACADEMICS.courseSections}${editing.id}/`, form)
      else await apiClient.post(ACADEMICS.courseSections, form)
      setModal(false); refetch()
    } catch (err) {
      setErrors({ api: err.response?.data?.detail || 'Save failed.' })
    } finally { setSaving(false) }
  }

  async function handleAssign() {
    if (!facultyUserId) return
    try {
      await apiClient.post(ACADEMICS.assignFaculty(assignModal), { faculty_user_id: Number(facultyUserId) })
      setAssignModal(null); setFacultyUserId(''); refetch()
    } catch (err) {
      alert(err.response?.data?.faculty_user_id?.[0] || 'Assignment failed.')
    }
  }

  async function handleUnassign(id) {
    await apiClient.post(ACADEMICS.unassignFaculty(id))
    refetch()
  }

  const displayed = filterCourse ? items.filter(s => String(s.course) === filterCourse) : items

  const columns = [
    { key: 'course_code', label: 'Course' },
    { key: 'course_name', label: 'Name' },
    { key: 'section_label', label: 'Section' },
    { key: 'max_students', label: 'Capacity' },
    { key: 'faculty_name', label: 'Faculty', render: r => r.faculty_name || <span className="text-neutral-400 text-xs">Unassigned</span> },
  ]

  return (
    <div>
      <PageHeader title="Course Sections" subtitle="Manage sections and faculty assignments"
        actions={<button className="btn-primary text-sm" onClick={openCreate}>+ Add Section</button>}
      />
      <div className="mb-4">
        <select className="input w-56 text-sm" value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} rows={displayed} loading={loading}
        actions={row => (
          <div className="flex gap-3">
            <button className="text-accent-cyan text-xs hover:underline" onClick={() => openEdit(row)}>Edit</button>
            {row.faculty_name
              ? <button className="text-accent-red text-xs hover:underline" onClick={() => handleUnassign(row.id)}>Unassign</button>
              : <button className="text-accent-teal text-xs hover:underline" onClick={() => setAssignModal(row.id)}>Assign Faculty</button>
            }
          </div>
        )}
      />

      {/* Create/Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Course Section' : 'New Course Section'}>
        <div className="space-y-3">
          <SelectField label="Course" required value={form.course} error={errors.course}
            onChange={e => f({ course: e.target.value })}>
            <option value="">Select...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
          </SelectField>
          <SelectField label="Semester" required value={form.semester} error={errors.semester}
            onChange={e => f({ semester: e.target.value })}>
            <option value="">Select...</option>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.program_name} - Sem {s.number} ({s.academic_year_label})</option>)}
          </SelectField>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Section Label" required value={form.section_label} error={errors.section_label}
              onChange={e => f({ section_label: e.target.value })} placeholder="A" />
            <InputField label="Max Students" type="number" min="1" value={form.max_students}
              onChange={e => f({ max_students: Number(e.target.value) })} />
          </div>
          {errors.api && <p className="text-accent-red text-xs">{errors.api}</p>}
          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn-secondary flex-1" onClick={() => setModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Assign Faculty modal */}
      <Modal open={!!assignModal} onClose={() => { setAssignModal(null); setFacultyUserId('') }} title="Assign Faculty">
        <div className="space-y-3">
          <InputField label="Faculty User ID" type="number" value={facultyUserId}
            onChange={e => setFacultyUserId(e.target.value)} placeholder="Enter user ID of faculty" />
          <p className="text-xs text-neutral-400">Find the faculty user ID from the Faculty page.</p>
          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1" onClick={handleAssign}>Assign</button>
            <button className="btn-secondary flex-1" onClick={() => { setAssignModal(null); setFacultyUserId('') }}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
