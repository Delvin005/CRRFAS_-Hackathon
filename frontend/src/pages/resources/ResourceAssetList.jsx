import { useState, useEffect } from 'react';
import api from '../../utils/api';

// ── Reusable Status Chip ──────────────────────────────────────────────────────
export function StatusChip({ value }) {
    const map = {
        available: 'bg-green-500/20 text-green-400',
        active: 'bg-blue-500/20 text-blue-300',
        maintenance: 'bg-yellow-500/20 text-yellow-300',
        decommissioned: 'bg-gray-500/20 text-gray-400',
        broken: 'bg-red-500/20 text-red-400',
    };
    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${map[value] ?? 'bg-white/10 text-crrfas-muted'}`}>
            {value?.replace('_', ' ')}
        </span>
    );
}

// ── Reusable Maintenance Badge ────────────────────────────────────────────────
export function MaintenanceBadge({ value }) {
    const map = { good: 'text-green-400', pending: 'text-yellow-400', overdue: 'text-orange-400', critical: 'text-red-400' };
    const icons = { good: '✅', pending: '⏳', overdue: '⚠️', critical: '🚨' };
    return (
        <span className={`flex items-center gap-1 text-xs font-semibold ${map[value] ?? 'text-crrfas-muted'}`}>
            {icons[value] ?? '🔧'} {value}
        </span>
    );
}

// ── Reusable Tag Input (ResourceTag multi-select) ─────────────────────────────
export function TagInput({ allTags, selected, onChange }) {
    const toggle = (id) => {
        onChange(selected.includes(id) ? selected.filter(t => t !== id) : [...selected, id]);
    };
    return (
        <div className="flex flex-wrap gap-2 mt-1">
            {allTags.map(tag => (
                <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggle(tag.id)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${selected.includes(tag.id)
                        ? 'bg-crrfas-cyan/20 border-crrfas-cyan text-crrfas-cyan'
                        : 'border-crrfas-surface text-crrfas-muted hover:border-crrfas-teal hover:text-white'
                        }`}
                >
                    {selected.includes(tag.id) ? '✓ ' : ''}{tag.name}
                </button>
            ))}
            {allTags.length === 0 && <span className="text-xs text-crrfas-muted italic">No tags yet. Create tags first in the backend admin.</span>}
        </div>
    );
}

// ── Dynamic category-specific fields ─────────────────────────────────────────
const CATEGORY_DYNAMIC = {
    'Computer Lab': [
        { key: 'systems_count', label: 'No. of Systems', type: 'number', placeholder: '30' },
        { key: 'os_type', label: 'Operating System', type: 'text', placeholder: 'Windows 11 / Ubuntu' },
        { key: 'software_installed', label: 'Software Installed', type: 'text', placeholder: 'MS Office, MATLAB...' },
    ],
    'Laboratory': [
        { key: 'instrument_type', label: 'Instrument Type', type: 'text', placeholder: 'Microscope, Centrifuge...' },
        { key: 'safety_level', label: 'Safety Level', type: 'select', options: ['BSL-1', 'BSL-2', 'BSL-3', 'General'] },
    ],
    'Auditorium': [
        { key: 'seating_capacity', label: 'Seating Capacity', type: 'number', placeholder: '500' },
        { key: 'av_system', label: 'AV System', type: 'text', placeholder: 'Projector + Sound System' },
    ],
    'Seminar Hall': [
        { key: 'seating_capacity', label: 'Seating Capacity', type: 'number', placeholder: '100' },
        { key: 'vc_enabled', label: 'Video Conferencing', type: 'select', options: ['Yes', 'No'] },
    ],
    'Sports': [
        { key: 'sport_type', label: 'Sport Type', type: 'text', placeholder: 'Basketball, Cricket...' },
        { key: 'outdoor', label: 'Location', type: 'select', options: ['Indoor', 'Outdoor'] },
    ],
    'Conference Room': [
        { key: 'vc_enabled', label: 'Video Conferencing', type: 'select', options: ['Yes', 'No'] },
        { key: 'whiteboard_count', label: 'No. of Whiteboards', type: 'number', placeholder: '2' },
    ],
};

export default function ResourceAssetList() {
    const [assets, setAssets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState('card');
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCat, setFilterCat] = useState('');
    const [filterDept, setFilterDept] = useState('');  // applied value (triggers fetch)
    const [deptInput, setDeptInput] = useState('');    // live typed value (no fetch on type)
    const [filterCampus, setFilterCampus] = useState('');
    const [searchQ, setSearchQ] = useState('');

    const emptyForm = {
        resource_code: '', name: '', category: '', department: '',
        quantity_total: 1, quantity_available: 1, unit_type: 'Unit',
        bookable_as_whole: true, bookable_per_unit: false,
        status: 'available', maintenance_status: 'good',
        requires_approval: false, restricted_roles: '', notes: '',
        tags: [],
    };
    const [form, setForm] = useState(emptyForm);
    const [dynamicValues, setDynamicValues] = useState({});

    // Find selected category name to drive dynamic fields display
    const selectedCatName = categories.find(c => String(c.id) === String(form.category))?.name || '';
    const dynamicFieldDefs = CATEGORY_DYNAMIC[selectedCatName] || [];

    const fetchAll = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterStatus) params.status = filterStatus;
            if (filterCat) params.category = filterCat;
            if (filterDept) params.department = filterDept;

            const [assetsRes, catsRes, tagsRes, campusRes] = await Promise.all([
                api.get('resources/assets/', { params }),
                api.get('resources/categories/'),
                api.get('resources/tags/'),
                api.get('facilities/campuses/'),
            ]);

            let results = assetsRes.data.results ?? assetsRes.data;

            // Client-side campus filter (assets linked to room → campus)
            if (filterCampus) {
                results = results.filter(r => String(r.room_campus ?? '') === String(filterCampus));
            }
            if (searchQ) {
                const q = searchQ.toLowerCase();
                results = results.filter(r =>
                    r.name.toLowerCase().includes(q) || r.resource_code.toLowerCase().includes(q)
                );
            }

            setAssets(results);
            setCategories(catsRes.data.results ?? catsRes.data);
            setAllTags(tagsRes.data.results ?? tagsRes.data);
            setCampuses(campusRes.data.results ?? campusRes.data);
        } catch {
            setError('Failed to load assets.');
        } finally {
            setLoading(false);
        }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { fetchAll(); }, [filterStatus, filterCat, filterDept, filterCampus]);

    const resetForm = () => { setForm(emptyForm); setDynamicValues({}); setEditItem(null); };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            resource_code: item.resource_code, name: item.name,
            category: item.category, department: item.department || '',
            quantity_total: item.quantity_total, quantity_available: item.quantity_available,
            unit_type: item.unit_type, bookable_as_whole: item.bookable_as_whole,
            bookable_per_unit: item.bookable_per_unit, status: item.status,
            maintenance_status: item.maintenance_status, requires_approval: item.requires_approval,
            restricted_roles: (item.restricted_roles || []).join(', '), notes: item.notes || '',
            tags: (item.tags || []).map(t => typeof t === 'object' ? t.id : t),
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            ...form,
            restricted_roles: form.restricted_roles
                ? form.restricted_roles.split(',').map(s => s.trim()).filter(Boolean)
                : [],
            // Store dynamic extras in notes JSON or as a custom note suffix
        };
        try {
            if (editItem) await api.patch(`resources/assets/${editItem.id}/`, payload);
            else await api.post('resources/assets/', payload);
            setShowForm(false); resetForm(); fetchAll();
        } catch (error) {
            setError(error.response?.data?.detail || 'Save failed. Check all required fields.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this asset permanently?')) return;
        try { await api.delete(`resources/assets/${id}/`); fetchAll(); }
        catch { setError('Delete failed.'); }
    };

    const totalAvailable = assets.filter(a => a.status === 'available').length;
    const totalMaint = assets.filter(a => a.status === 'maintenance').length;

    if (loading) return <div className="text-center text-crrfas-cyan animate-pulse py-16">Loading assets...</div>;

    return (
        <div className="space-y-6">

            {/* ── Availability Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Assets', value: assets.length, color: 'text-crrfas-cyan', border: 'border-crrfas-teal' },
                    { label: 'Available', value: totalAvailable, color: 'text-green-400', border: 'border-green-500' },
                    { label: 'In Maintenance', value: totalMaint, color: 'text-yellow-400', border: 'border-yellow-500' },
                    { label: 'Categories', value: categories.length, color: 'text-purple-400', border: 'border-purple-500' },
                ].map(card => (
                    <div key={card.label} className={`glass-panel p-4 text-center space-y-1 border-t-2 ${card.border}`}>
                        <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                        <p className="text-xs text-crrfas-muted uppercase tracking-widest">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Toolbar & Filters ── */}
            <div className="glass-panel p-4 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-3 flex-1">
                    <input
                        value={searchQ} onChange={e => setSearchQ(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && fetchAll()}
                        placeholder="🔍 Search name or code…"
                        className="input-field text-sm flex-1 min-w-[180px]"
                    />
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input-field text-sm">
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field text-sm">
                        <option value="">All Statuses</option>
                        {['available', 'active', 'maintenance', 'decommissioned', 'broken'].map(s =>
                            <option key={s} value={s}>{s}</option>)}
                    </select>
                    {/* Campus Filter */}
                    <select value={filterCampus} onChange={e => setFilterCampus(e.target.value)} className="input-field text-sm">
                        <option value="">All Campuses</option>
                        {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {/* Department — only applies on Enter or blur, no jump while typing */}
                    <input
                        value={deptInput}
                        onChange={e => setDeptInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') setFilterDept(deptInput); }}
                        onBlur={() => setFilterDept(deptInput)}
                        placeholder="Department…"
                        className="input-field text-sm w-36"
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode(m => m === 'card' ? 'table' : 'card')}
                        className="p-2 rounded-lg bg-crrfas-surface text-crrfas-muted hover:text-white text-xl" title="Toggle view">
                        {viewMode === 'card' ? '☰' : '⊞'}
                    </button>
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary py-2 px-4 text-sm">
                        + New Asset
                    </button>
                </div>
            </div>

            {error && <div className="text-crrfas-danger text-sm glass-panel p-3">⚠️ {error}</div>}

            {/* ── Modal Form ── */}
            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="glass-panel p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto space-y-5">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">{editItem ? 'Edit Asset' : 'New Asset / Equipment'}</h2>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-crrfas-muted hover:text-white text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Core Identity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-crrfas-muted">Resource Code *</label>
                                    <input required value={form.resource_code} onChange={e => setForm({ ...form, resource_code: e.target.value })}
                                        className="input-field w-full mt-1" placeholder="CLAB-01" />
                                </div>
                                <div>
                                    <label className="text-xs text-crrfas-muted">Name *</label>
                                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="input-field w-full mt-1" placeholder="Computer Lab A" />
                                </div>
                            </div>

                            {/* Category + Department */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-crrfas-muted">Category *</label>
                                    <select required value={form.category}
                                        onChange={e => { setForm({ ...form, category: e.target.value }); setDynamicValues({}); }}
                                        className="input-field w-full mt-1">
                                        <option value="">Select category…</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-crrfas-muted">Department</label>
                                    <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                                        className="input-field w-full mt-1" placeholder="Computer Science" />
                                </div>
                            </div>

                            {/* ── Dynamic Fields by Category ── */}
                            {dynamicFieldDefs.length > 0 && (
                                <div className="bg-crrfas-surface/30 border border-crrfas-teal/20 rounded-xl p-4 space-y-3">
                                    <p className="text-xs text-crrfas-teal font-semibold uppercase tracking-widest">
                                        📋 {selectedCatName} Details
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {dynamicFieldDefs.map(field => (
                                            <div key={field.key}>
                                                <label className="text-xs text-crrfas-muted">{field.label}</label>
                                                {field.type === 'select' ? (
                                                    <select
                                                        value={dynamicValues[field.key] || ''}
                                                        onChange={e => setDynamicValues({ ...dynamicValues, [field.key]: e.target.value })}
                                                        className="input-field w-full mt-1 text-sm">
                                                        <option value="">Select…</option>
                                                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        value={dynamicValues[field.key] || ''}
                                                        onChange={e => setDynamicValues({ ...dynamicValues, [field.key]: e.target.value })}
                                                        className="input-field w-full mt-1 text-sm"
                                                        placeholder={field.placeholder}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quantity + Unit Type */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-crrfas-muted">Total Qty</label>
                                    <input type="number" min="1" value={form.quantity_total}
                                        onChange={e => setForm({ ...form, quantity_total: +e.target.value })}
                                        className="input-field w-full mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-crrfas-muted">Available Qty</label>
                                    <input type="number" min="0" value={form.quantity_available}
                                        onChange={e => setForm({ ...form, quantity_available: +e.target.value })}
                                        className="input-field w-full mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-crrfas-muted">Unit Type</label>
                                    <input value={form.unit_type} onChange={e => setForm({ ...form, unit_type: e.target.value })}
                                        className="input-field w-full mt-1" placeholder="System / Seat / Kit" />
                                </div>
                            </div>

                            {/* Status fields */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-crrfas-muted">Status</label>
                                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input-field w-full mt-1">
                                        {['available', 'active', 'maintenance', 'decommissioned', 'broken'].map(s =>
                                            <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-crrfas-muted">Maintenance Status</label>
                                    <select value={form.maintenance_status} onChange={e => setForm({ ...form, maintenance_status: e.target.value })} className="input-field w-full mt-1">
                                        {['good', 'pending', 'overdue', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Booking flags */}
                            <div className="flex flex-wrap gap-6 text-sm">
                                {[
                                    { key: 'bookable_as_whole', label: 'Bookable as Whole' },
                                    { key: 'bookable_per_unit', label: 'Bookable Per Unit' },
                                    { key: 'requires_approval', label: 'Requires Approval' },
                                ].map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} className="accent-crrfas-teal" />
                                        <span className="text-crrfas-light">{label}</span>
                                    </label>
                                ))}
                            </div>

                            {/* ── Tag Input ── */}
                            <div>
                                <label className="text-xs text-crrfas-muted">Resource Tags</label>
                                <TagInput allTags={allTags} selected={form.tags}
                                    onChange={selectedTags => setForm({ ...form, tags: selectedTags })} />
                            </div>

                            {/* Restricted Roles */}
                            <div>
                                <label className="text-xs text-crrfas-muted">Restricted Roles <span className="italic">(comma-separated)</span></label>
                                <input value={form.restricted_roles} onChange={e => setForm({ ...form, restricted_roles: e.target.value })}
                                    className="input-field w-full mt-1" placeholder="research_scholar, faculty" />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-xs text-crrfas-muted">Notes</label>
                                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                                    rows={2} className="input-field w-full mt-1" />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                                    className="px-5 py-2 rounded-lg border border-crrfas-surface text-crrfas-muted hover:text-white text-sm">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-6 text-sm">
                                    {editItem ? 'Save Changes' : 'Create Asset'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Card View ── */}
            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {assets.map(a => (
                        <div key={a.id} className="glass-panel p-5 space-y-3 hover:border-crrfas-teal/40 transition-colors flex flex-col justify-between">
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-[10px] font-mono text-crrfas-teal">{a.resource_code}</p>
                                        <h3 className="font-bold text-white text-base">{a.name}</h3>
                                    </div>
                                    <StatusChip value={a.status} />
                                </div>
                                <p className="text-xs text-crrfas-muted">{a.category_name}{a.department && ` • ${a.department}`}</p>
                                <div className="flex flex-wrap gap-3 text-[11px] text-crrfas-muted pt-1">
                                    <span>📦 {a.quantity_available}/{a.quantity_total} {a.unit_type}s</span>
                                    {a.bookable_per_unit && <span className="text-crrfas-cyan">🪑 Per-unit</span>}
                                    {a.requires_approval && <span className="text-yellow-400">🔒 Approval</span>}
                                </div>
                                <MaintenanceBadge value={a.maintenance_status} />
                                {/* Tags */}
                                {a.tags_details?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {a.tags_details.map(t => (
                                            <span key={t.id} className="text-[10px] bg-crrfas-teal/10 text-crrfas-teal px-2 py-0.5 rounded-full">{t.name}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-crrfas-surface">
                                <button onClick={() => openEdit(a)} className="text-xs text-crrfas-teal hover:text-white">✏️ Edit</button>
                                <button onClick={() => handleDelete(a.id)} className="text-xs text-crrfas-danger hover:text-red-300 ml-auto">🗑️ Delete</button>
                            </div>
                        </div>
                    ))}
                    {assets.length === 0 && (
                        <p className="col-span-full text-center text-crrfas-muted py-16">No assets found. Try adjusting filters or create a new one.</p>
                    )}
                </div>
            ) : (
                /* ── Table View ── */
                <div className="glass-panel overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-crrfas-surface text-crrfas-muted uppercase text-[10px] tracking-widest">
                            <tr>
                                {['Code', 'Name', 'Category', 'Dept', 'Qty', 'Status', 'Maintenance', 'Tags', 'Actions'].map(h =>
                                    <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-crrfas-surface/50">
                            {assets.map(a => (
                                <tr key={a.id} className="hover:bg-crrfas-surface/30 transition-colors">
                                    <td className="px-4 py-3 font-mono text-crrfas-teal text-xs">{a.resource_code}</td>
                                    <td className="px-4 py-3 font-semibold text-white">{a.name}</td>
                                    <td className="px-4 py-3 text-crrfas-muted text-xs">{a.category_name}</td>
                                    <td className="px-4 py-3 text-crrfas-muted text-xs">{a.department || '—'}</td>
                                    <td className="px-4 py-3 text-xs">{a.quantity_available}/{a.quantity_total}</td>
                                    <td className="px-4 py-3"><StatusChip value={a.status} /></td>
                                    <td className="px-4 py-3"><MaintenanceBadge value={a.maintenance_status} /></td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(a.tags_details || []).map(t => (
                                                <span key={t.id} className="text-[9px] bg-crrfas-teal/10 text-crrfas-teal px-1.5 py-0.5 rounded-full">{t.name}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 flex gap-3 whitespace-nowrap">
                                        <button onClick={() => openEdit(a)} className="text-crrfas-teal hover:text-white text-xs">Edit</button>
                                        <button onClick={() => handleDelete(a.id)} className="text-crrfas-danger hover:text-red-300 text-xs">Del</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {assets.length === 0 && <p className="text-center text-crrfas-muted py-16">No assets found.</p>}
                </div>
            )}
        </div>
    );
}
