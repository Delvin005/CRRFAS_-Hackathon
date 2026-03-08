import { useState, useEffect } from 'react';
import api from '../../utils/api';

const STATUS_COLORS = {
    scheduled: 'bg-blue-500/20 text-blue-300',
    in_progress: 'bg-yellow-500/20 text-yellow-300',
    completed: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-gray-500/20 text-gray-400',
};

const TYPE_ICONS = {
    routine: '🔄',
    repair: '🔧',
    calibration: '⚗️',
    upgrade: '⬆️',
};

export default function MaintenanceScheduler() {
    const [schedules, setSchedules] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [error, setError] = useState('');
    const [completing, setCompleting] = useState(null);

    const [form, setForm] = useState({
        resource: '', maintenance_type: 'routine',
        start_time: '', end_time: '', performed_by: '',
        status: 'scheduled', work_description: '', cost: '',
    });

    const fetch = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            const [schedRes, assetsRes] = await Promise.all([
                api.get('resources/maintenance/', { params }),
                api.get('resources/assets/'),
            ]);
            setSchedules(schedRes.data.results ?? schedRes.data);
            setAssets(assetsRes.data.results ?? assetsRes.data);
        } catch { setError('Failed to load schedules.'); }
        finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetch(); }, [filterStatus]);

    const resetForm = () => {
        setForm({
            resource: '', maintenance_type: 'routine', start_time: '', end_time: '',
            performed_by: '', status: 'scheduled', work_description: '', cost: ''
        });
        setEditItem(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = { ...form, cost: form.cost ? +form.cost : null };
        try {
            if (editItem) await api.patch(`resources/maintenance/${editItem.id}/`, payload);
            else await api.post('resources/maintenance/', payload);
            setShowForm(false); resetForm(); fetch();
        } catch { setError('Save failed.'); }
    };

    const handleComplete = async (id) => {
        setCompleting(id);
        try {
            await api.post(`resources/maintenance/${id}/complete/`);
            fetch();
        } catch { setError('Could not mark complete.'); }
        finally { setCompleting(null); }
    };

    const getAssetName = id => assets.find(a => a.id === id)?.name || id;

    const upcoming = schedules.filter(s => s.status === 'scheduled').length;
    const inProgress = schedules.filter(s => s.status === 'in_progress').length;
    const completed = schedules.filter(s => s.status === 'completed').length;

    if (loading) return <div className="text-center text-crrfas-cyan animate-pulse py-12">Loading maintenance schedules...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-white">Maintenance Scheduler</h2>
                    <p className="text-xs text-crrfas-muted mt-1">Schedule, track, and complete maintenance on campus resources</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary py-2 px-4 text-sm">+ Schedule Maintenance</button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-panel p-4 text-center border-t-2 border-blue-400">
                    <p className="text-3xl font-black text-blue-400">{upcoming}</p>
                    <p className="text-xs text-crrfas-muted uppercase tracking-widest">Scheduled</p>
                </div>
                <div className="glass-panel p-4 text-center border-t-2 border-yellow-400">
                    <p className="text-3xl font-black text-yellow-400">{inProgress}</p>
                    <p className="text-xs text-crrfas-muted uppercase tracking-widest">In Progress</p>
                </div>
                <div className="glass-panel p-4 text-center border-t-2 border-green-400">
                    <p className="text-3xl font-black text-green-400">{completed}</p>
                    <p className="text-xs text-crrfas-muted uppercase tracking-widest">Completed</p>
                </div>
            </div>

            {/* Filter */}
            <div className="glass-panel p-4">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm">
                    <option value="">All Statuses</option>
                    {['scheduled', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {error && <div className="text-crrfas-danger text-sm glass-panel p-3">⚠️ {error}</div>}

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="glass-panel p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">{editItem ? 'Edit Schedule' : 'New Maintenance Schedule'}</h3>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-crrfas-muted hover:text-white text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted">Resource *</label>
                                <select required value={form.resource} onChange={e => setForm({ ...form, resource: e.target.value })} className="input-field w-full mt-1">
                                    <option value="">Select resource...</option>
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.resource_code})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-crrfas-muted">Maintenance Type</label>
                                    <select value={form.maintenance_type} onChange={e => setForm({ ...form, maintenance_type: e.target.value })} className="input-field w-full mt-1">
                                        {['routine', 'repair', 'calibration', 'upgrade'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-crrfas-muted">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field w-full mt-1">
                                        {['scheduled', 'in_progress', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-crrfas-muted">Start Date/Time *</label>
                                    <input required type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} className="input-field w-full mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-crrfas-muted">End Date/Time *</label>
                                    <input required type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} className="input-field w-full mt-1" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted">Performed By</label>
                                <input value={form.performed_by} onChange={e => setForm({ ...form, performed_by: e.target.value })}
                                    className="input-field w-full mt-1" placeholder="Technician name or vendor" />
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted">Work Description</label>
                                <textarea value={form.work_description} onChange={e => setForm({ ...form, work_description: e.target.value })}
                                    rows={2} className="input-field w-full mt-1" />
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted">Cost (₹)</label>
                                <input type="number" min="0" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })}
                                    className="input-field w-full mt-1" placeholder="Optional" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                                    className="px-5 py-2 rounded-lg border border-crrfas-surface text-crrfas-muted hover:text-white text-sm">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-5 text-sm">{editItem ? 'Save Changes' : 'Create Schedule'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Schedule Cards */}
            <div className="space-y-3">
                {schedules.map(s => (
                    <div key={s.id} className="glass-panel p-5 flex flex-col md:flex-row justify-between gap-4 hover:border-crrfas-teal/30 transition-colors">
                        <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-xl">{TYPE_ICONS[s.maintenance_type] || '🔧'}</span>
                                <h3 className="font-bold text-white">{s.resource_name || getAssetName(s.resource)}</h3>
                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${STATUS_COLORS[s.status]}`}>
                                    {s.status}
                                </span>
                                <span className="text-xs text-crrfas-muted capitalize">{s.maintenance_type}</span>
                            </div>
                            <div className="flex flex-wrap gap-4 text-xs text-crrfas-muted">
                                <span>🗓️ {new Date(s.start_time).toLocaleString()} → {new Date(s.end_time).toLocaleString()}</span>
                                {s.performed_by && <span>👷 {s.performed_by}</span>}
                                {s.cost && <span>💰 ₹{s.cost}</span>}
                            </div>
                            {s.work_description && <p className="text-xs text-crrfas-muted italic">{s.work_description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                            {s.status !== 'completed' && s.status !== 'cancelled' && (
                                <button onClick={() => handleComplete(s.id)} disabled={completing === s.id}
                                    className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50">
                                    {completing === s.id ? '...' : '✅ Mark Complete'}
                                </button>
                            )}
                            <button onClick={() => {
                                setEditItem(s);
                                setForm({
                                    resource: s.resource, maintenance_type: s.maintenance_type,
                                    start_time: s.start_time?.slice(0, 16), end_time: s.end_time?.slice(0, 16),
                                    performed_by: s.performed_by || '', status: s.status,
                                    work_description: s.work_description || '', cost: s.cost || ''
                                });
                                setShowForm(true);
                            }} className="text-xs text-crrfas-teal hover:text-white px-2 py-1.5">✏️</button>
                        </div>
                    </div>
                ))}
                {schedules.length === 0 && <p className="text-center text-crrfas-muted py-12">No maintenance schedules yet.</p>}
            </div>
        </div>
    );
}
