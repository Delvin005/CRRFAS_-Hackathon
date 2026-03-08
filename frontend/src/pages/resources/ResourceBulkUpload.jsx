import { useState } from 'react';
import api from '../../utils/api';

export default function ResourceBulkUpload() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleDownloadTemplate = () => {
        const headers = 'resource_code,name,category_name,department,quantity,status,unit_type';
        const example = 'CLAB-01,Computer Lab Alpha,Computer Lab,Computer Science,10,available,System';
        const example2 = 'MICRO-01,Olympus Microscopes,Laboratory,Biology,5,available,Instrument';
        const csv = [headers, example, example2].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'resource_upload_template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) { setError('Please select a CSV file.'); return; }
        setLoading(true); setError(''); setResult(null);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post('resources/assets/bulk_upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Upload failed. Check your CSV format.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="glass-panel p-8 space-y-6 border-t-4 border-t-crrfas-primary shadow-xl">
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Bulk Asset Ingestion</h2>
                        <p className="text-crrfas-muted text-sm mt-1">Upload your entire resource inventory via CSV in seconds.</p>
                    </div>
                    <button onClick={handleDownloadTemplate}
                        className="text-crrfas-cyan hover:text-white text-sm flex items-center gap-2 transition-colors border border-crrfas-teal/30 px-4 py-2 rounded-xl">
                        ⬇️ Download Template
                    </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="border-2 border-dashed border-crrfas-surface rounded-2xl p-12 text-center hover:border-crrfas-primary/40 transition-colors group relative">
                        <input type="file" accept=".csv" onChange={e => { setFile(e.target.files[0]); setError(''); setResult(null); }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="space-y-2 pointer-events-none">
                            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">📦</div>
                            <p className="text-crrfas-light font-medium">
                                {file ? file.name : 'Drag and drop your CSV here, or click to browse'}
                            </p>
                            <p className="text-xs text-crrfas-muted">Required columns: resource_code, name, category_name, quantity, status</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-crrfas-danger/10 border border-crrfas-danger/20 text-crrfas-danger p-4 rounded-xl text-sm">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="flex justify-center">
                        <button type="submit" disabled={loading || !file}
                            className={`btn-primary py-3 px-12 rounded-full font-bold shadow-lg shadow-crrfas-primary/20 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}`}>
                            {loading ? '⏳ Processing...' : '🚀 Upload Resources'}
                        </button>
                    </div>
                </form>

                {result && (
                    <div className="mt-6 space-y-4">
                        <div className="bg-crrfas-success/10 border border-crrfas-success/20 text-crrfas-success p-6 rounded-2xl">
                            <h3 className="font-bold text-lg">✅ Upload Complete</h3>
                            <p className="text-sm mt-1">{result.created} resource(s) created or updated successfully.</p>
                        </div>
                        {result.errors?.length > 0 && (
                            <div className="bg-crrfas-warning/10 border border-crrfas-warning/20 text-crrfas-warning p-4 rounded-xl max-h-44 overflow-y-auto">
                                <p className="text-xs font-bold uppercase">Row Exceptions ({result.errors.length})</p>
                                <ul className="text-[11px] list-disc list-inside mt-2 opacity-80 space-y-1">
                                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {[
                    { icon: '💡', text: '<b>category_name</b> will be auto-created if it does not already exist.' },
                    { icon: '📦', text: 'Duplicate <b>resource_code</b> entries will update the existing asset.' },
                    { icon: '✅', text: 'Valid statuses: <b>available</b>, <b>maintenance</b>, <b>active</b>, <b>broken</b>.' },
                ].map((tip, i) => (
                    <div key={i} className="glass-panel p-4 text-crrfas-muted flex gap-3 italic">
                        <span className="text-lg not-italic">{tip.icon}</span>
                        <span dangerouslySetInnerHTML={{ __html: tip.text }} />
                    </div>
                ))}
            </div>
        </div>
    );
}
