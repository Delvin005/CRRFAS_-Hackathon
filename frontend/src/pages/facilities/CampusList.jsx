import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function CampusList() {
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '', code: '', address: '',
        description: '', contact_email: '', contact_phone: ''
    });

    useEffect(() => {
        fetchCampuses();
     
        }, []);

    const fetchCampuses = async () => {
        setLoading(true);
        try {
            const res = await api.get('facilities/campuses/');
            setCampuses(res.data.results || res.data);
        } catch (error) { console.error(error); 
            setError('Failed to fetch campuses.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('facilities/campuses/', formData);
            setIsFormOpen(false);
            setFormData({ name: '', code: '', address: '', description: '', contact_email: '', contact_phone: '' });
            fetchCampuses();
        } catch (error) { console.error(error); 
            setError('Failed to create campus. Ensure the code is unique.');
        }
    };

    if (loading) return <div className="text-crrfas-cyan animate-pulse py-8 text-center text-lg">Synchronizing Campus Registry...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-crrfas-light">Institutional Campuses</h2>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-crrfas-surface border border-crrfas-primary text-crrfas-cyan px-4 py-2 rounded-lg text-sm hover:bg-crrfas-primary/20 transition-all active:scale-95"
                >
                    {isFormOpen ? 'Close Panel' : '+ New Campus'}
                </button>
            </div>

            {error && <div className="bg-crrfas-danger/20 border border-crrfas-danger/50 text-crrfas-danger px-4 py-2 rounded-lg text-sm">{error}</div>}

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-6 mb-8 border-crrfas-primary/40 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 border-b border-crrfas-surface pb-3">
                        <div className="w-2 h-6 bg-crrfas-primary rounded-full"></div>
                        <h3 className="text-lg font-medium text-white">Campus Specification</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Campus Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. North Metropolitan Campus"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Short Code</label>
                                <input
                                    type="text"
                                    className="input-field uppercase"
                                    placeholder="NMC"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Contact Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    placeholder="admin@campus.edu"
                                    value={formData.contact_email}
                                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Physical Address</label>
                                <textarea
                                    className="input-field h-[82px] resize-none"
                                    placeholder="Full mailing address..."
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Description</label>
                                <textarea
                                    className="input-field h-[82px] resize-none"
                                    placeholder="Brief overview of the mission or facilities..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Contact Phone</label>
                                <input
                                    type="tel"
                                    className="input-field"
                                    placeholder="+1 (555) 000-0000"
                                    value={formData.contact_phone}
                                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-crrfas-surface">
                        <button type="submit" className="btn-primary py-2 px-8 text-sm bg-gradient-to-r from-crrfas-primary to-crrfas-cyan shadow-lg shadow-crrfas-primary/20">
                            Register Campus
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campuses.map(campus => (
                    <div key={campus.id} className="glass-panel p-5 hover:border-crrfas-cyan/50 transition-all duration-300 relative group overflow-hidden border-t-2 border-t-crrfas-primary">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-crrfas-cyan transition-colors">{campus.name}</h3>
                                <p className="text-[10px] text-crrfas-teal font-mono tracking-tighter uppercase">{campus.code}</p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${campus.is_active ? 'bg-crrfas-success shadow-sm shadow-crrfas-success' : 'bg-crrfas-danger'}`} title={campus.is_active ? 'Online' : 'Offline'}></div>
                        </div>

                        <div className="space-y-4">
                            <div className="text-sm text-crrfas-muted">
                                <p className="line-clamp-2 leading-relaxed italic opacity-80 mb-3 block">
                                    "{campus.description || 'No description provided.'}"
                                </p>
                                <div className="space-y-2">
                                    <p className="flex items-center gap-2"><span className="opacity-50">📍</span> {campus.address}</p>
                                    {(campus.contact_email || campus.contact_phone) && (
                                        <div className="flex gap-4 pt-2 border-t border-crrfas-surface/50 mt-2">
                                            {campus.contact_email && <p className="text-[10px] flex items-center gap-1">✉️ <span className="opacity-70">{campus.contact_email}</span></p>}
                                            {campus.contact_phone && <p className="text-[10px] flex items-center gap-1">📞 <span className="opacity-70">{campus.contact_phone}</span></p>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {campuses.length === 0 && !isFormOpen && (
                    <div className="col-span-full py-20 glass-panel border-dashed border-2 border-crrfas-surface text-center">
                        <div className="text-4xl mb-3 opacity-20">🏫</div>
                        <p className="text-crrfas-muted">No campuses found. Register the first one to start defining buildings.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

