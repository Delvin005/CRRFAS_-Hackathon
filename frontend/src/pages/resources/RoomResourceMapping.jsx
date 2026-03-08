import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function RoomResourceMapping() {
    const [mappings, setMappings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [error, setError] = useState('');

    const [form, setForm] = useState({ room: '', resource: '', quantity: 1 });

    const fetch = async () => {
        setLoading(true);
        try {
            const [mapRes, roomsRes, assetsRes] = await Promise.all([
                api.get('resources/room-mappings/'),
                api.get('facilities/rooms/'),
                api.get('resources/assets/'),
            ]);
            setMappings(mapRes.data.results ?? mapRes.data);
            setRooms(roomsRes.data.results ?? roomsRes.data);
            setAssets(assetsRes.data.results ?? assetsRes.data);
        } catch { setError('Failed to load mappings.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(); }, []);

    const resetForm = () => { setForm({ room: '', resource: '', quantity: 1 }); setEditItem(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) await api.patch(`resources/room-mappings/${editItem.id}/`, form);
            else await api.post('resources/room-mappings/', form);
            setShowForm(false); resetForm(); fetch();
        } catch { setError('Save failed.'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this mapping?')) return;
        await api.delete(`resources/room-mappings/${id}/`); fetch();
    };

    const getRoomName = id => rooms.find(r => r.id === id)?.name || rooms.find(r => r.id === id)?.room_number || id;
    const getAssetName = id => assets.find(a => a.id === id)?.name || id;

    if (loading) return <div className="text-center text-crrfas-cyan animate-pulse py-12">Loading room-resource mappings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <h2 className="text-xl font-bold text-white">Room ↔ Resource Mapping</h2>
                    <p className="text-xs text-crrfas-muted mt-1">Track which assets are physically located in which rooms</p>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary py-2 px-4 text-sm">+ New Mapping</button>
            </div>

            {error && <div className="text-crrfas-danger text-sm glass-panel p-3">⚠️ {error}</div>}

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="glass-panel p-6 w-full max-w-md space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">{editItem ? 'Edit Mapping' : 'New Room-Resource Mapping'}</h3>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-crrfas-muted hover:text-white text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted">Room *</label>
                                <select required value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className="input-field w-full mt-1">
                                    <option value="">Select room...</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name || r.room_number} ({r.room_number})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted">Resource / Asset *</label>
                                <select required value={form.resource} onChange={e => setForm({ ...form, resource: e.target.value })} className="input-field w-full mt-1">
                                    <option value="">Select asset...</option>
                                    {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.resource_code})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted">Quantity in Room</label>
                                <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })}
                                    className="input-field w-full mt-1" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                                    className="px-5 py-2 rounded-lg border border-crrfas-surface text-crrfas-muted hover:text-white text-sm">Cancel</button>
                                <button type="submit" className="btn-primary py-2 px-5 text-sm">{editItem ? 'Save' : 'Create'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-panel overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-crrfas-surface text-crrfas-muted uppercase text-[10px] tracking-widest">
                        <tr>
                            {['Room', 'Asset / Resource', 'Quantity in Room', 'Actions'].map(h =>
                                <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-crrfas-surface/50">
                        {mappings.map(m => (
                            <tr key={m.id} className="hover:bg-crrfas-surface/30 transition-colors">
                                <td className="px-4 py-3 text-white text-sm">{getRoomName(m.room)}</td>
                                <td className="px-4 py-3">
                                    <span className="text-crrfas-light">{m.resource_name || getAssetName(m.resource)}</span>
                                </td>
                                <td className="px-4 py-3 text-crrfas-cyan font-bold">{m.quantity}</td>
                                <td className="px-4 py-3 flex gap-3">
                                    <button onClick={() => {
                                        setEditItem(m);
                                        setForm({ room: m.room, resource: m.resource, quantity: m.quantity });
                                        setShowForm(true);
                                    }} className="text-crrfas-teal hover:text-white text-xs">Edit</button>
                                    <button onClick={() => handleDelete(m.id)} className="text-crrfas-danger hover:text-red-300 text-xs">Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {mappings.length === 0 && <p className="text-center text-crrfas-muted py-12">No mappings yet. Link assets to rooms to track physical inventory.</p>}
            </div>
        </div>
    );
}
