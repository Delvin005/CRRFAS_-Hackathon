import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { InputField } from '../../components/FormField'

const EMPTY = { name: '', code: '' }

export default function DepartmentsPage() {
  const { items, loading, refetch } = useList(ACADEMICS.departments)
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModal(true) }
  function openEdit(row) { setEditing(row); setForm({ name: row.name, code: row.code }); setErrors({}); setModal(true) }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.code.trim()) e.code = 'Code is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      if (editing) {
        await apiClient.patch(`${ACADEMICS.departments}${editing.id}/`, form)
      } else {
        await apiClient.post(ACADEMICS.departments, form)
      }
      setModal(false)
      refetch()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0]
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : (data[firstKey] || 'Save failed.')
        setErrors({ api: `${firstKey}: ${msg}` })
      } else {
        setErrors({ api: 'Save failed — check your inputs.' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row) {
    if (!window.confirm(`Delete "${row.name}"?`)) return
    await apiClient.delete(`${ACADEMICS.departments}${row.id}/`)
    refetch()
  }

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Department Name' },
    { key: 'head_name', label: 'HoD' },
    {
      key: 'is_active', label: 'Status',
      render: r => <span className={r.is_active ? 'badge-approved' : 'badge-rejected'}>{r.is_active ? 'Active' : 'Inactive'}</span>
    },
  ]

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage academic departments"
        actions={<button className="btn-primary text-sm" onClick={openCreate}>+ Add Department</button>}
      />
      <DataTable columns={columns} rows={items} loading={loading}
        actions={row => (
          <>
            <button className="text-accent-cyan text-xs hover:underline" onClick={() => openEdit(row)}>Edit</button>
            <button className="text-accent-red text-xs hover:underline ml-2" onClick={() => handleDelete(row)}>Delete</button>
          </>
        )}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Department' : 'New Department'}>
        <div className="space-y-4">
          <InputField label="Department Name" required value={form.name} error={errors.name}
            onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science Engineering" />
          <InputField label="Code" required value={form.code} error={errors.code}
            onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. CSE" />
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
