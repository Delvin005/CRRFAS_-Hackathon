import { useState } from 'react';
import api from '../../utils/api';

export default function RoomBulkUpload() {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setError('');
        setResult(null);
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('facilities/rooms/csv_template/', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'room_upload_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) { console.error(error); 
            setError('Failed to download template.');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('facilities/rooms/bulk_upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResult(res.data);
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to upload CSV. Ensure building codes and floor numbers match exactly.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="glass-panel p-8 space-y-6 border-t-4 border-t-crrfas-cyan shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Bulk Space Ingestion</h2>
                        <p className="text-crrfas-muted text-sm mt-1">Upload multiple rooms at once using a CSV file.</p>
                    </div>
                    <button
                        onClick={handleDownloadTemplate}
                        className="text-crrfas-cyan hover:text-white text-sm flex items-center gap-2 transition-colors"
                    >
                        ⬇️ Download Template
                    </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                    <div className="border-2 border-dashed border-crrfas-surface rounded-2xl p-10 text-center hover:border-crrfas-teal/40 transition-colors group relative">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-2 pointer-events-none">
                            <div className="text-4xl group-hover:scale-110 transition-transform duration-300">📊</div>
                            <p className="text-crrfas-light font-medium">
                                {file ? file.name : "Drag and drop your CSV here, or click to browse"}
                            </p>
                            <p className="text-xs text-crrfas-muted">Supported format: .csv Max size: 5MB</p>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-crrfas-danger/10 border border-crrfas-danger/20 text-crrfas-danger p-4 rounded-xl text-sm animate-pulse">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={loading || !file}
                            className={`btn-primary py-3 px-10 rounded-full font-bold shadow-lg shadow-crrfas-cyan/20 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1 active:translate-y-0'}`}
                        >
                            {loading ? "Processing..." : "🚀 Upload & Sync Rooms"}
                        </button>
                    </div>
                </form>

                {result && (
                    <div className="mt-8 space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-crrfas-success/10 border border-crrfas-success/20 text-crrfas-success p-6 rounded-2xl">
                            <h3 className="font-bold text-lg">Upload Summary</h3>
                            <p className="text-sm mt-1">{result.message}</p>
                        </div>

                        {result.errors && result.errors.length > 0 && (
                            <div className="bg-crrfas-warning/10 border border-crrfas-warning/20 text-crrfas-warning p-4 rounded-xl space-y-2 max-h-40 overflow-y-auto">
                                <p className="text-xs font-bold uppercase tracking-widest">Row Exceptions ({result.errors.length})</p>
                                <ul className="text-[11px] list-disc list-inside opacity-80">
                                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="glass-panel p-4 text-crrfas-muted flex gap-3 italic">
                    <span className="text-lg">💡</span>
                    <span>Ensure <b>buildingCode</b> matches the codes defined in the Buildings tab.</span>
                </div>
                <div className="glass-panel p-4 text-crrfas-muted flex gap-3 italic">
                    <span className="text-lg">💡</span>
                    <span>Make sure <b>floorNumber</b> is a numeric value representing existing floors.</span>
                </div>
                <div className="glass-panel p-4 text-crrfas-muted flex gap-3 italic">
                    <span className="text-lg">💡</span>
                    <span>Status choices: <b>available</b>, <b>maintenance</b>, <b>booked</b>, or <b>inactive</b>.</span>
                </div>
            </div>
        </div>
    );
}
