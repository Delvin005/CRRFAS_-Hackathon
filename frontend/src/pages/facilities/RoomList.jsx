import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const STATUS_OPTIONS = [
    { label: 'Available', value: 'available', color: 'text-crrfas-success bg-crrfas-success/10' },
    { label: 'Maintenance', value: 'maintenance', color: 'text-crrfas-warning bg-crrfas-warning/10' },
    { label: 'Booked', value: 'booked', color: 'text-crrfas-danger bg-crrfas-danger/10' },
    { label: 'Inactive', value: 'inactive', color: 'text-crrfas-muted bg-crrfas-surface/50' }
];

export default function RoomList() {
    // Data states
    const [rooms, setRooms] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [floors, setFloors] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [facilityTags, setFacilityTags] = useState([]);

    // UI states
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Filter/Search state
    const [filters, setFilters] = useState({
        campus: '', building: '', floor: '', room_type: '', status: '', department: '', search: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        campus: '', building: '', floor: '', room_number: '', name: '',
        room_type: '', capacity: 30, status: 'available', department: '',
        description: '', available_facilities: [],
        accessibility_flags: { wheelchair_desks: 0, hearing_loop: false }
    });

    useEffect(() => {
        loadMetadata();
        fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

    const loadMetadata = async () => {
        try {
            const [cRes, bRes, fRes, rtRes, ftRes] = await Promise.all([
                api.get('facilities/campuses/'),
                api.get('facilities/buildings/'),
                api.get('facilities/floors/'),
                api.get('facilities/room-types/'),
                api.get('facilities/facility-tags/')
            ]);
            setCampuses(cRes.data.results || cRes.data);
            setBuildings(bRes.data.results || bRes.data);
            setFloors(fRes.data.results || fRes.data);
            setRoomTypes(rtRes.data.results || rtRes.data);
            setFacilityTags(ftRes.data.results || ftRes.data);
        } catch (error) {
            console.error("Metadata load failed", error);
        }
    };

    const fetchRooms = useCallback(async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            // Remove empty filters
            Object.keys(params).forEach(key => !params[key] && delete params[key]);

            const res = await api.get('facilities/rooms/', { params });
            setRooms(res.data.results || res.data);
        } catch (error) { console.error(error); 
            setError('Failed to fetch rooms.');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const timer = setTimeout(() => fetchRooms(), 300);
        return () => clearTimeout(timer);
    }, [filters, fetchRooms]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Backend expects array of IDs for M2M available_facilities
            await api.post('facilities/rooms/', formData);
            setIsFormOpen(false);
            setFormData({
                campus: '', building: '', floor: '', room_number: '', name: '',
                room_type: '', capacity: 30, status: 'available', department: '',
                description: '', available_facilities: [],
                accessibility_flags: { wheelchair_desks: 0, hearing_loop: false }
            });
            fetchRooms();
        } catch (error) {
            setError(error.response?.data?.error || 'Validation failed. Ensure IDs are correct.');
        }
    };

    const toggleFacility = (tagId) => {
        setFormData(prev => ({
            ...prev,
            available_facilities: prev.available_facilities.includes(tagId)
                ? prev.available_facilities.filter(id => id !== tagId)
                : [...prev.available_facilities, tagId]
        }));
    };

    const getBuildingName = (id) => buildings.find(b => b.id === id)?.name || 'N/A';
    const getFloorName = (id) => floors.find(f => f.id === id)?.name || 'N/A';
    const getTypeName = (id) => roomTypes.find(t => t.id === id)?.name || 'N/A';

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-crrfas-light">Space Inventory</h2>
                    <div className="flex bg-crrfas-surface p-1 rounded-lg border border-crrfas-surface/50">
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-crrfas-primary/20 text-crrfas-cyan' : 'text-crrfas-muted'}`}
                        >
                            🗂️
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-crrfas-primary/20 text-crrfas-cyan' : 'text-crrfas-muted'}`}
                        >
                            📊
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="btn-primary py-2 px-6 text-sm bg-gradient-to-r from-crrfas-teal to-crrfas-cyan shadow-lg shadow-crrfas-teal/20"
                >
                    {isFormOpen ? '✖ Close Form' : '✚ Configure New Space'}
                </button>
            </div>

            {/* Filter Bar */}
            <div className="glass-panel p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 border-crrfas-surface">
                <select
                    className="input-field py-1.5 text-xs"
                    value={filters.campus}
                    onChange={e => setFilters({ ...filters, campus: e.target.value, building: '', floor: '' })}
                >
                    <option value="">All Campuses</option>
                    {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                    className="input-field py-1.5 text-xs"
                    value={filters.building}
                    onChange={e => setFilters({ ...filters, building: e.target.value, floor: '' })}
                    disabled={!filters.campus}
                >
                    <option value="">All Buildings</option>
                    {buildings.filter(b => !filters.campus || b.campus == filters.campus).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
                <select
                    className="input-field py-1.5 text-xs"
                    value={filters.floor}
                    onChange={e => setFilters({ ...filters, floor: e.target.value })}
                    disabled={!filters.building}
                >
                    <option value="">All Floors</option>
                    {floors.filter(f => !filters.building || f.building == filters.building).map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
                <select
                    className="input-field py-1.5 text-xs"
                    value={filters.room_type}
                    onChange={e => setFilters({ ...filters, room_type: e.target.value })}
                >
                    <option value="">All Types</option>
                    {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select
                    className="input-field py-1.5 text-xs"
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <input
                    type="text"
                    className="input-field py-1.5 text-xs"
                    placeholder="Search room..."
                    value={filters.search}
                    onChange={e => setFilters({ ...filters, search: e.target.value })}
                />
            </div>

            {error && <div className="text-crrfas-danger text-sm text-center">{error}</div>}

            {/* Config Form */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-6 border-crrfas-teal/30 animate-in zoom-in-95 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                        <div className="space-y-4">
                            <h4 className="font-bold text-crrfas-teal uppercase tracking-widest text-[10px]">📍 Location Mapping</h4>
                            <div>
                                <label className="text-[10px] text-crrfas-muted ml-1 mb-1 block">Campus</label>
                                <select className="input-field" value={formData.campus} onChange={e => setFormData({ ...formData, campus: e.target.value })} required>
                                    <option value="">Select Campus</option>
                                    {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-crrfas-muted ml-1 mb-1 block">Building</label>
                                <select className="input-field" value={formData.building} onChange={e => setFormData({ ...formData, building: e.target.value })} required disabled={!formData.campus}>
                                    <option value="">Select Building</option>
                                    {buildings.filter(b => b.campus == formData.campus).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-crrfas-muted ml-1 mb-1 block">Floor</label>
                                <select className="input-field" value={formData.floor} onChange={e => setFormData({ ...formData, floor: e.target.value })} required disabled={!formData.building}>
                                    <option value="">Select Floor</option>
                                    {floors.filter(f => f.building == formData.building).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-crrfas-teal uppercase tracking-widest text-[10px]">🏢 Room Identity</h4>
                            <div>
                                <label className="text-[10px] text-crrfas-muted ml-1 mb-1 block">Room Number</label>
                                <input type="text" className="input-field" placeholder="e.g. 302" value={formData.room_number} onChange={e => setFormData({ ...formData, room_number: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-[10px] text-crrfas-muted ml-1 mb-1 block">Display Name</label>
                                <input type="text" className="input-field" placeholder="e.g. Physics Lab Alpha" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label className="text-[10px] text-crrfas-muted ml-1 mb-1 block">Room Category</label>
                                <select className="input-field" value={formData.room_type} onChange={e => setFormData({ ...formData, room_type: e.target.value })} required>
                                    <option value="">Select Type</option>
                                    {roomTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-crrfas-teal uppercase tracking-widest text-[10px]">⚙️ Stats & Dept</h4>
                            <div>
                                <label className="text-[10px] text-crrfas-muted ml-1 mb-1 block">Max Capacity</label>
                                <input type="number" className="input-field" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value) })} min="1" required />
                            </div>
                            <div>
                                <label className="text-[10px] text-crrfas-muted ml-1 mb-1 block">Current Status</label>
                                <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-crrfas-muted ml-1 mb-1 block">Managed By (Dept)</label>
                                <input type="text" className="input-field" placeholder="e.g. Computer Science" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-crrfas-teal uppercase tracking-widest text-[10px]">✨ Features & Access</h4>
                            <div className="bg-crrfas-surface/30 p-3 rounded-xl border border-crrfas-surface max-h-[160px] overflow-y-auto space-y-2">
                                {facilityTags.map(tag => (
                                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="accent-crrfas-cyan"
                                            checked={formData.available_facilities.includes(tag.id)}
                                            onChange={() => toggleFacility(tag.id)}
                                        />
                                        <span className={`text-[11px] ${formData.available_facilities.includes(tag.id) ? 'text-white' : 'text-crrfas-muted group-hover:text-crrfas-cyan'}`}>{tag.name}</span>
                                    </label>
                                ))}
                                {facilityTags.length === 0 && <p className="text-[10px] text-crrfas-muted italic">Configure facility tags first.</p>}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t border-crrfas-surface">
                        <button type="submit" className="btn-primary py-2 px-10 text-sm bg-gradient-to-r from-crrfas-teal to-crrfas-cyan active:scale-95 transition-all">
                            Finalize Configuration
                        </button>
                    </div>
                </form>
            )}

            {/* List View */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-48 glass-panel animate-pulse bg-crrfas-surface/20 border-transparent"></div>)}
                </div>
            ) : viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {rooms.map(room => (
                        <div key={room.id} className="glass-panel p-5 border-l-4 border-l-crrfas-teal hover:border-crrfas-cyan/50 hover:-translate-y-1 transition-all duration-300 group">
                            <div className="flex justify-between items-start mb-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${STATUS_OPTIONS.find(s => s.value === room.status)?.color}`}>
                                    {room.status}
                                </span>
                                <span className="text-crrfas-muted text-[10px] font-mono">{room.room_number}</span>
                            </div>
                            <Link to={`/facilities/rooms/${room.id}`}>
                                <h3 className="text-lg font-bold text-white group-hover:text-crrfas-cyan transition-colors truncate">{room.name}</h3>
                            </Link>
                            <div className="mt-4 space-y-2 text-[11px] text-crrfas-muted">
                                <p className="flex items-center gap-2 opacity-80 truncate">🏛️ {room.building_name || getBuildingName(room.building)}</p>
                                <p className="flex items-center gap-2 opacity-80">🪜 {room.floor_name || getFloorName(room.floor)}</p>
                                <div className="flex justify-between items-center border-t border-crrfas-surface pt-2 mt-2">
                                    <span className="bg-crrfas-surface px-2 py-1 rounded text-crrfas-light font-medium">{getTypeName(room.room_type)}</span>
                                    <span className="text-crrfas-cyan">👥 {room.capacity}</span>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                                {room.available_facilities_details?.map(tag => (
                                    <span key={tag.id} className="text-[9px] bg-crrfas-primary/10 border border-crrfas-primary/20 px-1.5 py-0.5 rounded text-crrfas-cyan">
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                    {rooms.length === 0 && (
                        <div className="col-span-full py-20 glass-panel text-center text-crrfas-muted border-dashed">
                            No spaces found matching your current filters.
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-panel overflow-hidden border-crrfas-surface">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-crrfas-surface/50 border-b border-crrfas-surface uppercase text-[10px] tracking-widest text-crrfas-muted">
                            <tr>
                                <th className="px-6 py-4">Room / Code</th>
                                <th className="px-6 py-4">Building & Floor</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Capacity</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Dept</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-crrfas-surface">
                            {rooms.map(room => (
                                <tr key={room.id} className="hover:bg-crrfas-surface/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-white">
                                        <Link to={`/facilities/rooms/${room.id}`} className="hover:text-crrfas-cyan">
                                            <div>{room.name}</div>
                                            <div className="text-[10px] text-crrfas-teal">{room.room_number}</div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-crrfas-muted text-xs">
                                        <div>{room.building_name || getBuildingName(room.building)}</div>
                                        <div className="text-[10px] opacity-60">Level {room.floor_name || getFloorName(room.floor)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-crrfas-muted">{getTypeName(room.room_type)}</td>
                                    <td className="px-6 py-4 text-crrfas-cyan font-bold">{room.capacity}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_OPTIONS.find(s => s.value === room.status)?.color}`}>
                                            {room.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-crrfas-muted text-xs">{room.department || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

