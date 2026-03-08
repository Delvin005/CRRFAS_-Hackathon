import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import { InputField, SelectField } from '../../components/FormField'

const EMPTY_BATCH = { program: '', academic_year: '', batch_label: '', intake: 60 }
const EMPTY_SECTION = { batch: '', name: 'A', strength: 60 }

export default function BatchSectionPage() {
  const { items: batches, loading: batchLoading, refetch: refetchBatches } = useList(ACADEMICS.batches)
  const { items: sections, loading: secLoading, refetch: refetchSections } = useList(ACADEMICS.sections)
  const { items: programs } = useList(ACADEMICS.programs)
  const { items: academicYears } = useList(ACADEMICS.academicYears)
  const [batchModal, setBatchModal] = useState(false)
  const [sectionModal, setSectionModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [editingSection, setEditingSection] = useState(null)
  const [batchForm, setBatchForm] = useState(EMPTY_BATCH)
  const [secForm, setSecForm] = useState(EMPTY_SECTION)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [filterBatch, setFilterBatch] = useState('')

  const bf = v => setBatchForm(p => ({ ...p, ...v }))
  const sf = v => setSecForm(p => ({ ...p, ...v }))

  function openBatchCreate() { setEditingBatch(null); setBatchForm(EMPTY_BATCH); setErrors({}); setBatchModal(true) }
  function openBatchEdit(row) {
    setEditingBatch(row)
    setBatchForm({ program: row.program, academic_year: row.academic_year, batch_label: row.batch_label, intake: row.intake })
    setErrors({}); setBatchModal(true)
  }
  function openSecCreate() { setEditingSection(null); setSecForm(EMPTY_SECTION); setErrors({}); setSectionModal(true) }
  function openSecEdit(row) {
    setEditingSection(row)
    setSecForm({ batch: row.batch, name: row.name, strength: row.strength })
    setErrors({}); setSectionModal(true)
  }

  async function saveBatch() {
    const e = {}
    if (!batchForm.program) e.program = 'Required'
    if (!batchForm.academic_year) e.academic_year = 'Required'
    if (!batchForm.batch_label.trim()) e.batch_label = 'Required'
    setErrors(e); if (Object.keys(e).length) return
    setSaving(true)
    try {
      if (editingBatch) await apiClient.patch(`${ACADEMICS.batches}${editingBatch.id}/`, batchForm)
      else await apiClient.post(ACADEMICS.batches, batchForm)
      setBatchModal(false); refetchBatches()
    } catch (err) { setErrors({ api: err.response?.data?.detail || 'Failed' }) }
    finally { setSaving(false) }
  }

  async function saveSection() {
    const e = {}
    if (!secForm.batch) e.batch = 'Required'
    if (!secForm.name.trim()) e.name = 'Required'
    setErrors(e); if (Object.keys(e).length) return
    setSaving(true)
    try {
      if (editingSection) await apiClient.patch(`${ACADEMICS.sections}${editingSection.id}/`, secForm)
      else await apiClient.post(ACADEMICS.sections, secForm)
      setSectionModal(false); refetchSections()
    } catch (err) { setErrors({ api: err.response?.data?.detail || 'Failed' }) }
    finally { setSaving(false) }
  }

  const filteredSections = filterBatch ? sections.filter(s => String(s.batch) === filterBatch) : sections

  const batchCols = [
    { key: 'batch_label', label: 'Batch' },
    { key: 'program_name', label: 'Program' },
    { key: 'intake', label: 'Intake' },
    { key: 'is_active', label: 'Status', render: r => <span className={r.is_active ? 'badge-approved' : 'badge-rejected'}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ]
  const secCols = [
    { key: 'name', label: 'Section' },
    { key: 'batch_label', label: 'Batch' },
    { key: 'strength', label: 'Strength' },
    { key: 'class_teacher_name', label: 'Class Teacher' },
  ]

  return (
    <div className="space-y-8">
      {/* Batches */}
      <div>
        <PageHeader title="Batches" subtitle="Manage student batches"
          actions={<button className="btn-primary text-sm" onClick={openBatchCreate}>+ Add Batch</button>}
        />
        <DataTable columns={batchCols} rows={batches} loading={batchLoading}
          actions={row => <button className="text-accent-cyan text-xs hover:underline" onClick={() => openBatchEdit(row)}>Edit</button>}
        />
      </div>

      {/* Sections */}
      <div>
        <PageHeader title="Sections" subtitle="Sections within batches"
          actions={<button className="btn-primary text-sm" onClick={openSecCreate}>+ Add Section</button>}
        />
        <div className="mb-3">
          <select className="input w-56 text-sm" value={filterBatch} onChange={e => setFilterBatch(e.target.value)}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.batch_label} - {b.program_name}</option>)}
          </select>
        </div>
        <DataTable columns={secCols} rows={filteredSections} loading={secLoading}
          actions={row => <button className="text-accent-cyan text-xs hover:underline" onClick={() => openSecEdit(row)}>Edit</button>}
        />
      </div>

      {/* Batch Modal */}
      <Modal open={batchModal} onClose={() => setBatchModal(false)} title={editingBatch ? 'Edit Batch' : 'New Batch'}>
        <div className="space-y-3">
          <SelectField label="Program" required value={batchForm.program} error={errors.program}
            onChange={e => bf({ program: e.target.value })}>
            <option value="">Select...</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </SelectField>
          <SelectField label="Academic Year" required value={batchForm.academic_year} error={errors.academic_year}
            onChange={e => bf({ academic_year: e.target.value })}>
            <option value="">Select...</option>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
          </SelectField>
          <InputField label="Batch Label" required value={batchForm.batch_label} error={errors.batch_label}
            onChange={e => bf({ batch_label: e.target.value })} placeholder="e.g. 2022-26" />
          <InputField label="Intake" type="number" min="1" value={batchForm.intake}
            onChange={e => bf({ intake: Number(e.target.value) })} />
          {errors.api && <p className="text-accent-red text-xs">{errors.api}</p>}
          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1" onClick={saveBatch} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn-secondary flex-1" onClick={() => setBatchModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Section Modal */}
      <Modal open={sectionModal} onClose={() => setSectionModal(false)} title={editingSection ? 'Edit Section' : 'New Section'}>
        <div className="space-y-3">
          <SelectField label="Batch" required value={secForm.batch} error={errors.batch}
            onChange={e => sf({ batch: e.target.value })}>
            <option value="">Select...</option>
            {batches.map(b => <option key={b.id} value={b.id}>{b.batch_label} - {b.program_name}</option>)}
          </SelectField>
          <InputField label="Section Name" required value={secForm.name} error={errors.name}
            onChange={e => sf({ name: e.target.value })} placeholder="A, B, C ..." />
          <InputField label="Strength" type="number" min="1" value={secForm.strength}
            onChange={e => sf({ strength: Number(e.target.value) })} />
          {errors.api && <p className="text-accent-red text-xs">{errors.api}</p>}
          <div className="flex gap-2 pt-2">
            <button className="btn-primary flex-1" onClick={saveSection} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn-secondary flex-1" onClick={() => setSectionModal(false)}>Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
