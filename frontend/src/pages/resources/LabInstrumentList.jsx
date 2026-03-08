import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function LabInstrumentList() {
    const [instruments, setInstruments] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [, setEditItem] = useState(null);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        resource: '', model_number: '', manufacturer: '',
        last_calibration_date: '', next_calibration_due: '',
        safety_instructions: '', is_high_precision: false,
    });

    const fetch = async () => {
        setLoading(true);
        try {
            const [, assetsRes] = await Promise.all([
                api.get('resources/assets/?status=available'),
                api.get('resources/assets/'),
            ]);
            // lab instruments are resources with lab_details
            const all = assetsRes.data.results ?? assetsRes.data;
            setAssets(all);
            setInstruments(all.filter(a => a.lab_details));
        } catch { setError('Failed to load lab instruments.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch();  
        }, []);

    const resetForm = () => {
        setForm({
            resource: '', model_number: '', manufacturer: '',
            last_calibration_date: '', next_calibration_due: '',
            safety_instructions: '', is_high_precision: false
        });
        setEditItem(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Update via PATCH to the resource with embedded lab_details
            await api.patch(`resources/assets/${form.resource}/`, {
                lab_details: {
                    model_number: form.model_number,
                    manufacturer: form.manufacturer,
                    last_calibration_date: form.last_calibration_date || null,
                    next_calibration_due: form.next_calibration_due || null,
                    safety_instructions: form.safety_instructions,
                    is_high_precision: form.is_high_precision,
                }
            });
            setShowForm(false); resetForm(); fetch();
        } catch { setError('Save failed. Ensure the resource exists.'); }
    };

    const calDue = (date) => {
        if (!date) return null;
        return new Date(date) < new Date() ? 'overdue' : 'ok';
    };

    if (loading) return <div className="text-center text-crrfas-cyan animate-pulse py-12">Loading lab instruments...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white">Lab Instruments</h2>
                    <p className="text-xs text-crrfas-muted mt-1">Assets with specialized calibration & safety requirements</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary py-2 px-4 text-sm">+ Add Instrument Details</button>
            </div>

            {error && <div className="text-crrfas-danger text-sm glass-panel p-3">⚠️ {error}</div>}

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="glass-panel p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Lab Instrument Specs</h3>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-crrfas-muted hover:text-white text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted">Link to Resource *</label>
                                <select required value={form.resource} onChange={e => setForm({ ...form, resource: e.target.value })} className="input-field w-full mt-1">
                                    <option value="">Select a resource...</option>
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.resource_code})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-crrfas-muted">Model Number</label>
                                    <input value={form.model_number} onChange={e => setForm({ ...form, model_number: e.target.value })}
                                        className="input-field w-full mt-1" placeholder="e.g. Olympus CX23" />
                                </div>
                                <div>
                                    <label className="text-xs text-crrfas-muted">Manufacturer</label>
                                    <input value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })}
                                        className="input-field w-full mt-1" placeholder="e.g. Olympus" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-crrfas-muted">Last Calibration</label>
                                    <input type="date" value={form.last_calibration_date} onChange={e => setForm({ ...form, last_calibration_date: e.target.value })}
                                        className="input-field w-full mt-1" />
                                </div>
                                <div>
                                    <label className="text-xs text-crrfas-muted">Next Calibration Due</label>
                                    <input type="date" value={form.next_calibration_due} onChange={e => setForm({ ...form, next_calibration_due: e.target.value })}
                                        className="input-field w-full mt-1" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted">Safety Instructions</label>
                                <textarea value={form.safety_instructions} onChange={e => setForm({ ...form, safety_instructions: e.target.value })}
                                    rows={3} className="input-field w-full mt-1" placeholder="Handling, PPE requirements, disposal..." />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                                <input type="checkbox" checked={form.is_high_precision} onChange={e => setForm({ ...form, is_high_precision: e.target.checked })} className="accent-crrfas-teal" />
                                <span className="text-crrfas-light">High-Precision Instrument (restricted handling)</span>
                            </label>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                                    className="px-5 py-2 rounded-lg border border-crrfas-surface text-crrfas-muted hover:text-white text-sm">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-5 text-sm">Save Specs</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {instruments.map(inst => {
                    const lab = inst.lab_details;
                    const calStatus = calDue(lab.next_calibration_due);
                    return (
                        <div key={inst.id} className="glass-panel p-5 space-y-3 hover:border-crrfas-teal/40 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-mono text-crrfas-teal">{inst.resource_code}</p>
                                    <h3 className="font-bold text-white">{inst.name}</h3>
                                </div>
                                {lab.is_high_precision && (
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">🔬 High Precision</span>
                                )}
                            </div>
                            <div className="text-xs text-crrfas-muted space-y-1">
                                {lab.manufacturer && <p>🏭 {lab.manufacturer} — {lab.model_number}</p>}
                                {lab.next_calibration_due && (
                                    <p className={calStatus === 'overdue' ? 'text-red-400' : 'text-green-400'}>
                                        ⚗️ Cal. Due: {new Date(lab.next_calibration_due).toLocaleDateString()} {calStatus === 'overdue' && '⚠️ OVERDUE'}
                                    </p>
                                )}
                                {lab.safety_instructions && (
                                    <p className="text-yellow-400/80">🦺 {lab.safety_instructions.slice(0, 80)}{lab.safety_instructions.length > 80 ? '...' : ''}</p>
                                )}
                            </div>
                        </div>
                    );
                })}
                {instruments.length === 0 && (
                    <p className="col-span-full text-center text-crrfas-muted py-12">
                        No lab instruments yet. Add instrument specs to any existing asset using the button above.
                    </p>
                )}
            </div>
        </div>
    );
}
