import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';

export default function RoomDetail() {
    const { id } = useParams();
    const [room, setRoom] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRoom = async () => {
            try {
                const res = await api.get(`facilities/rooms/${id}/`);
                setRoom(res.data);
            } catch (error) { console.error(error); 
                setError('Failed to load room details.');
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-crrfas-teal animate-pulse">Scanning Space...</div>;
    if (error) return <div className="p-8 text-center text-crrfas-danger">{error}</div>;
    if (!room) return <div className="p-8 text-center text-crrfas-muted">Space not found.</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Breadcrumbs */}
            <nav className="flex gap-2 text-xs text-crrfas-muted">
                <Link to="/facilities" className="hover:text-crrfas-cyan">Facilities</Link>
                <span>/</span>
                <span className="text-white">Room {room.room_number}</span>
            </nav>

            {/* Hero Section */}
            <div className="glass-panel p-8 border-l-8 border-l-crrfas-teal flex flex-col md:flex-row justify-between items-start gap-8 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-crrfas-teal/5 rounded-full blur-3xl"></div>

                <div className="space-y-4 relative z-10">
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${room.status === 'available' ? 'bg-crrfas-success/20 text-crrfas-success' : 'bg-crrfas-warning/20 text-crrfas-warning'
                            }`}>
                            {room.status}
                        </span>
                        <span className="text-crrfas-teal font-mono">#{room.id}</span>
                    </div>
                    <h1 className="text-4xl font-black text-white">{room.name}</h1>
                    <p className="text-xl text-crrfas-muted max-w-2xl">{room.description || 'No description available for this space.'}</p>

                    <div className="flex flex-wrap gap-6 pt-4">
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-crrfas-surface rounded-lg text-xl">🏛️</span>
                            <div>
                                <p className="text-[10px] uppercase text-crrfas-muted">Campus</p>
                                <p className="text-sm font-semibold">{room.campus_name || room.campus}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-crrfas-surface rounded-lg text-xl">🏢</span>
                            <div>
                                <p className="text-[10px] uppercase text-crrfas-muted">Building</p>
                                <p className="text-sm font-semibold">{room.building_name || room.building}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 bg-crrfas-surface rounded-lg text-xl">🪜</span>
                            <div>
                                <p className="text-[10px] uppercase text-crrfas-muted">Level</p>
                                <p className="text-sm font-semibold">Floor {room.floor_name || room.floor}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel bg-white/5 p-6 min-w-[200px] border-crrfas-teal/20 text-center space-y-2">
                    <p className="text-xs text-crrfas-muted uppercase tracking-tighter">Current Capacity</p>
                    <p className="text-5xl font-black text-white">{room.capacity}</p>
                    <p className="text-xs text-crrfas-teal">Seated Units</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Facilities & Amenities */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-panel p-6 space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-crrfas-teal rounded-full"></span>
                            Available Facilities
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {room.available_facilities_details?.map(tag => (
                                <div key={tag.id} className="flex items-center gap-3 p-3 bg-crrfas-surface/30 rounded-xl border border-crrfas-surface hover:border-crrfas-teal/50 transition-colors">
                                    <span className="text-lg">✨</span>
                                    <span className="text-sm text-crrfas-light">{tag.name}</span>
                                </div>
                            ))}
                            {(!room.available_facilities_details || room.available_facilities_details.length === 0) && (
                                <p className="text-sm text-crrfas-muted italic col-span-full">No specific facilities registered for this space.</p>
                            )}
                        </div>
                    </div>

                    <div className="glass-panel p-6 space-y-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-crrfas-primary rounded-full"></span>
                            Accessibility Features
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {room.accessibility_flags && Object.entries(room.accessibility_flags).map(([key, value]) => (
                                <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${value ? 'bg-crrfas-success/10 border-crrfas-success/50 text-crrfas-success' : 'bg-crrfas-surface opacity-30 border-transparent text-crrfas-muted'
                                    }`}>
                                    <span className="text-lg">{key === 'wheelchair_desks' ? '♿' : '👂'}</span>
                                    <div className="text-left">
                                        <p className="text-[10px] uppercase font-bold tracking-tighter">{key.replace('_', ' ')}</p>
                                        <p className="text-sm">{typeof value === 'boolean' ? (value ? 'Available' : 'N/A') : `${value} Units`}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Technical Metadata */}
                <div className="space-y-8">
                    <div className="glass-panel p-6 space-y-4 divide-y divide-crrfas-surface">
                        <h3 className="text-lg font-bold text-white pb-2">Space Metadata</h3>
                        <div className="py-3 flex justify-between text-sm">
                            <span className="text-crrfas-muted">Room Type</span>
                            <span className="text-crrfas-cyan font-semibold">{room.room_type_name || room.room_type}</span>
                        </div>
                        <div className="py-3 flex justify-between text-sm">
                            <span className="text-crrfas-muted">Department</span>
                            <span className="text-white font-medium">{room.department || 'General Inventory'}</span>
                        </div>
                        <div className="py-3 flex justify-between text-sm">
                            <span className="text-crrfas-muted">Created</span>
                            <span className="text-white font-medium">{new Date(room.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="py-3 flex justify-between text-sm">
                            <span className="text-crrfas-muted">Last Audit</span>
                            <span className="text-white font-medium">{new Date(room.updated_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <Link to="/facilities" className="w-full btn-primary bg-crrfas-surface border border-crrfas-teal text-crrfas-cyan py-3 flex justify-center items-center gap-2 hover:bg-crrfas-teal/10">
                        <span>↩</span> Return to Registry
                    </Link>
                </div>
            </div>
        </div>
    );
}
