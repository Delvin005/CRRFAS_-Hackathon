import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { StatusChip } from './ResourceAssetList';

export default function SubResourceUnitList() {
    const [units, setUnits] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [filterAsset, setFilterAsset] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        resource: '', unit_identifier: '', status: 'available', is_bookable: true, notes: '',
    });

    const fetch = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterAsset) params.resource = filterAsset;
            if (filterStatus) params.status = filterStatus;
            const [unitsRes, assetsRes] = await Promise.all([
                api.get('resources/items/', { params }),
                api.get('resources/assets/'),
            ]);
            setUnits(unitsRes.data.results ?? unitsRes.data);
            setAssets(assetsRes.data.results ?? assetsRes.data);
        } catch { setError('Failed to load sub-units.'); }
        finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetch(); }, [filterAsset, filterStatus]);

    const resetForm = () => {
        setForm({ resource: '', unit_identifier: '', status: 'available', is_bookable: true, notes: '' });
        setEditItem(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) await api.patch(`resources/items/${editItem.id}/`, form);
            else await api.post('resources/items/', form);
            setShowForm(false); resetForm(); fetch();
        } catch { setError('Save failed.'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this unit?')) return;
        await api.delete(`resources/items/${id}/`); fetch();
    };

    if (loading) return <div className="text-center text-crrfas-cyan animate-pulse py-12">Loading units...</div>;

    const availableCount = units.filter(u => u.status === 'available' && u.is_bookable).length;
    const totalCount = units.length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-white">Sub-Resource Units</h2>
                    <p className="text-xs text-crrfas-muted mt-1">Individual seats, systems, or instruments within a resource group</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary py-2 px-4 text-sm">+ Add Unit</button>
            </div>

            {/* Availability Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-panel p-4 text-center">
                    <p className="text-3xl font-black text-crrfas-cyan">{totalCount}</p>
                    <p className="text-xs text-crrfas-muted uppercase tracking-widest">Total Units</p>
                </div>
                <div className="glass-panel p-4 text-center">
                    <p className="text-3xl font-black text-green-400">{availableCount}</p>
                    <p className="text-xs text-crrfas-muted uppercase tracking-widest">Available</p>
                </div>
                <div className="glass-panel p-4 text-center">
                    <p className="text-3xl font-black text-yellow-400">{totalCount - availableCount}</p>
                    <p className="text-xs text-crrfas-muted uppercase tracking-widest">In Use / Offline</p>
                </div>
            </div>

            {/* Filters */}
            <div className="glass-panel p-4 flex flex-wrap gap-3">
                <select value={filterAsset} onChange={e => setFilterAsset(e.target.value)} className="input-field text-sm flex-1 min-w-[180px]">
                    <option value="">All Resources</option>
                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.resource_code})</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm">
                    <option value="">All Statuses</option>
                    {['available', 'active', 'maintenance', 'broken'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {error && <div className="text-crrfas-danger text-sm glass-panel p-3">⚠️ {error}</div>}

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="glass-panel p-6 w-full max-w-md space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">{editItem ? 'Edit Unit' : 'New Sub-Unit'}</h3>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-crrfas-muted hover:text-white text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted">Parent Resource *</label>
                                <select required value={form.resource} onChange={e => setForm({ ...form, resource: e.target.value })} className="input-field w-full mt-1">
                                    <option value="">Select resource...</option>
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted">Unit Identifier *</label>
                                <input required value={form.unit_identifier} onChange={e => setForm({ ...form, unit_identifier: e.target.value })}
                                    className="input-field w-full mt-1" placeholder="e.g. SYS-001, SEAT-A3" />
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted">Status</label>
                                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field w-full mt-1">
                                    {['available', 'active', 'maintenance', 'broken', 'decommissioned'].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="checkbox" checked={form.is_bookable} onChange={e => setForm({ ...form, is_bookable: e.target.checked })} className="accent-crrfas-teal" />
                                <span className="text-crrfas-light">Bookable by users</span>
                            </label>
                            <div>
                                <label className="text-xs text-crrfas-muted">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                    rows={2} className="input-field w-full mt-1" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                                    className="px-5 py-2 rounded-lg border border-crrfas-surface text-crrfas-muted hover:text-white text-sm">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-5 text-sm">{editItem ? 'Save' : 'Create Unit'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Unit Grid */}
            <div className="glass-panel overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-crrfas-surface text-crrfas-muted uppercase text-[10px] tracking-widest">
                        <tr>
                            {['Unit ID', 'Parent Resource', 'Status', 'Bookable', 'Notes', 'Actions'].map(h =>
                                <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-crrfas-surface/50">
                        {units.map(unit => (
                            <tr key={unit.id} className="hover:bg-crrfas-surface/30 transition-colors">
                                <td className="px-4 py-3 font-mono text-crrfas-cyan text-xs">{unit.unit_identifier}</td>
                                <td className="px-4 py-3 text-crrfas-light text-xs">
                                    {assets.find(a => a.id === unit.resource)?.name || unit.resource}
                                </td>
                                <td className="px-4 py-3"><StatusChip value={unit.status} /></td>
                                <td className="px-4 py-3">
                                    <span className={unit.is_bookable ? 'text-green-400' : 'text-crrfas-muted'}>
                                        {unit.is_bookable ? '✅ Yes' : '🚫 No'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-crrfas-muted text-xs">{unit.notes || '—'}</td>
                                <td className="px-4 py-3 flex gap-3">
                                    <button onClick={() => {
                                        setEditItem(unit);
                                        setForm({
                                            resource: unit.resource, unit_identifier: unit.unit_identifier,
                                            status: unit.status, is_bookable: unit.is_bookable, notes: unit.notes || ''
                                        });
                                        setShowForm(true);
                                    }} className="text-crrfas-teal hover:text-white text-xs">Edit</button>
                                    <button onClick={() => handleDelete(unit.id)} className="text-crrfas-danger hover:text-red-300 text-xs">Del</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {units.length === 0 && <p className="text-center text-crrfas-muted py-12">No sub-units yet. Add individual seats or systems to enable per-unit booking.</p>}
            </div>
        </div>
    );
}
