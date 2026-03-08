import { useState } from 'react'
import apiClient from '../../api/apiClient'
import { useList } from '../../utils/useApi'
import { ACADEMICS } from '../../api/academicsEndpoints'
import PageHeader from '../../components/PageHeader'
import { SelectField } from '../../components/FormField'

export default function CsvImportPage() {
  const { items: programs } = useList(ACADEMICS.programs)
  const [programId, setProgramId] = useState('')
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleUpload() {
    setError(''); setResult(null)
    if (!programId) { setError('Select a program first.'); return }
    if (!file) { setError('Select a CSV file.'); return }
    if (!file.name.endsWith('.csv')) { setError('Only .csv files are accepted.'); return }

    const fd = new FormData()
    fd.append('file', file)
    fd.append('program_id', programId)

    setUploading(true)
    try {
      const res = await apiClient.post(ACADEMICS.bulkUpload, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.file?.[0] || err.response?.data?.detail || 'Upload failed.')
    } finally { setUploading(false) }
  }

  return (
    <div>
      <PageHeader title="Import Courses" subtitle="Bulk upload courses from a CSV file" />

      <div className="card max-w-xl space-y-5">
        {/* Template download */}
        <div className="bg-primary-900/60 rounded-lg p-4 text-sm text-neutral-400 space-y-1">
          <p className="font-medium text-neutral-300">CSV Format</p>
          <p>Required columns:</p>
          <code className="text-accent-cyan block text-xs bg-primary-900 rounded px-3 py-2 mt-1">
            code,name,course_type,credits,hours_per_week,semester_number
          </code>
          <p className="text-xs mt-1">course_type: theory | lab | tutorial | project | elective | audit</p>
          <button
            className="text-accent-cyan text-xs underline mt-2"
            onClick={() => {
              const csv = 'code,name,course_type,credits,hours_per_week,semester_number\nCSE101,Mathematics I,theory,4,4,1\nCSE102,Programming Lab,lab,2,4,1'
              const blob = new Blob([csv], { type: 'text/csv' })
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
              a.download = 'course_template.csv'; a.click()
            }}
          >⬇ Download Template</button>
        </div>

        {/* Form */}
        <SelectField label="Target Program" required value={programId}
          onChange={e => setProgramId(e.target.value)}>
          <option value="">Select program...</option>
          {programs.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
        </SelectField>

        <div>
          <label className="text-xs text-neutral-400 block mb-1">CSV File <span className="text-accent-red">*</span></label>
          <input
            type="file" accept=".csv"
            onChange={e => setFile(e.target.files[0])}
            className="block w-full text-sm text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
          />
        </div>

        {error && <p className="text-accent-red text-sm">{error}</p>}

        <button className="btn-primary w-full" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : '↑ Upload CSV'}
        </button>

        {/* Result */}
        {result && (
          <div className="space-y-2 text-sm">
            <p className="text-accent-green font-medium">Upload complete!</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-accent-green/10 border border-accent-green/20 rounded-lg p-3">
                <p className="text-xs text-neutral-400">Created</p>
                <p className="text-lg font-bold text-accent-green">{result.created?.length ?? 0}</p>
                <p className="text-xs text-neutral-400 mt-1">{result.created?.join(', ') || '—'}</p>
              </div>
              <div className="bg-accent-amber/10 border border-accent-amber/20 rounded-lg p-3">
                <p className="text-xs text-neutral-400">Skipped (existing)</p>
                <p className="text-lg font-bold text-accent-amber">{result.skipped_existing?.length ?? 0}</p>
                <p className="text-xs text-neutral-400 mt-1">{result.skipped_existing?.join(', ') || '—'}</p>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg p-3">
                <p className="text-xs font-medium text-accent-red mb-1">Errors ({result.errors.length})</p>
                <ul className="text-xs text-accent-red space-y-0.5">
                  {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
