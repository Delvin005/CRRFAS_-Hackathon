import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function BuildingList() {
    const [buildings, setBuildings] = useState([]);
    const [campuses, setCampuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        campus: '',
        floors: 1,
        description: '',
        status: 'active',
        accessibility_flags: { wheelchair: false, elevators: false, ramps: false }
    });

    useEffect(() => {
        fetchData();
     
        }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bRes, cRes] = await Promise.all([
                api.get('facilities/buildings/'),
                api.get('facilities/campuses/')
            ]);
            setBuildings(bRes.data.results || bRes.data);
            setCampuses(cRes.data.results || cRes.data);
            if (cRes.data.length > 0) {
                setFormData(prev => ({ ...prev, campus: cRes.data[0].id }));
            }
        } catch (error) { console.error(error); 
            setError('Failed to fetch buildings and campus data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('facilities/buildings/', formData);
            setIsFormOpen(false);
            setFormData({
                name: '', code: '', campus: campuses[0]?.id || '', floors: 1,
                description: '', status: 'active',
                accessibility_flags: { wheelchair: false, elevators: false, ramps: false }
            });
            fetchData();
        } catch (error) { console.error(error); 
            setError('Failed to create building. Code must be unique.');
        }
    };

    const getCampusName = (id) => campuses.find(c => c.id === id)?.name || 'Unknown Campus';

    const handleAccessibilityChange = (flag) => {
        setFormData(prev => ({
            ...prev,
            accessibility_flags: {
                ...prev.accessibility_flags,
                [flag]: !prev.accessibility_flags[flag]
            }
        }));
    };

    if (loading) return <div className="text-crrfas-purple animate-pulse py-8 text-center text-lg">Loading Building Directory...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-crrfas-light">Building Directory</h2>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-crrfas-surface border border-crrfas-purple text-crrfas-cyan px-4 py-2 rounded-lg text-sm hover:bg-crrfas-purple/20 transition-all active:scale-95"
                >
                    {isFormOpen ? 'Close Panel' : '+ New Building'}
                </button>
            </div>

            {error && <div className="bg-crrfas-danger/20 border border-crrfas-danger/50 text-crrfas-danger px-4 py-2 rounded-lg text-sm">{error}</div>}

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-6 mb-8 border-crrfas-purple/40 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 border-b border-crrfas-surface pb-3">
                        <div className="w-2 h-6 bg-crrfas-purple rounded-full"></div>
                        <h3 className="text-lg font-medium text-white">Configure Building Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Parent Campus</label>
                                <select
                                    className="input-field"
                                    value={formData.campus}
                                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                                    required
                                >
                                    {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Building Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Science Block A"
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
                                    placeholder="SBA"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Total Floors</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    min="1"
                                    value={formData.floors}
                                    onChange={(e) => setFormData({ ...formData, floors: parseInt(e.target.value) || 1 })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Operational Status</label>
                                <select
                                    className="input-field"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active / Operational</option>
                                    <option value="maintenance">Under Maintenance</option>
                                    <option value="closed">Permanently Closed</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted ml-1 mb-1 block">Description</label>
                                <textarea
                                    className="input-field h-[82px] resize-none"
                                    placeholder="Purpose and notes..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-crrfas-muted ml-1 mb-3 block">Accessibility Features</label>
                            <div className="space-y-3 bg-crrfas-surface/30 p-4 rounded-xl border border-crrfas-surface">
                                {Object.keys(formData.accessibility_flags).map(flag => (
                                    <label key={flag} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.accessibility_flags[flag]}
                                                onChange={() => handleAccessibilityChange(flag)}
                                            />
                                            <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${formData.accessibility_flags[flag] ? 'bg-crrfas-purple border-crrfas-purple' : 'border-crrfas-muted group-hover:border-crrfas-cyan'}`}>
                                                {formData.accessibility_flags[flag] && <span className="text-xs text-crrfas-bg font-bold">✓</span>}
                                            </div>
                                        </div>
                                        <span className="text-sm text-crrfas-light capitalize">{flag} Access</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-crrfas-surface">
                        <button type="submit" className="btn-primary py-2 px-8 text-sm bg-gradient-to-r from-crrfas-purple to-crrfas-primary transition-transform active:scale-95 shadow-lg shadow-crrfas-purple/20">
                            Register Building
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buildings.map(building => (
                    <div key={building.id} className="glass-panel p-5 border-l-4 border-l-crrfas-purple hover:border-crrfas-cyan/50 hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-crrfas-cyan transition-colors">{building.name}</h3>
                                <p className="text-[10px] text-crrfas-teal font-mono uppercase tracking-widest">{building.code}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-tighter ${building.status === 'active' ? 'bg-crrfas-success/20 text-crrfas-success' :
                                    building.status === 'maintenance' ? 'bg-crrfas-warning/20 text-crrfas-warning' :
                                        'bg-crrfas-danger/20 text-crrfas-danger'
                                }`}>
                                {building.status}
                            </span>
                        </div>

                        <div className="space-y-3 text-sm text-crrfas-muted">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-crrfas-surface rounded-lg">📍</span>
                                <span>{getCampusName(building.campus)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-crrfas-surface rounded-lg">🏢</span>
                                <span>{building.floors} Levels</span>
                            </div>
                        </div>

                        {building.description && (
                            <p className="mt-4 text-xs italic text-crrfas-muted border-t border-crrfas-surface pt-3 line-clamp-2">
                                "{building.description}"
                            </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                            {building.accessibility_flags && Object.entries(building.accessibility_flags).map(([key, value]) => value && (
                                <span key={key} title={key} className="p-1 bg-crrfas-surface/50 rounded border border-crrfas-surface text-[10px] hover:text-crrfas-cyan transition-colors">
                                    {key === 'wheelchair' ? '♿' : key === 'elevators' ? '🛗' : '🪜'}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
                {buildings.length === 0 && !isFormOpen && (
                    <div className="col-span-full py-20 glass-panel border-dashed border-2 border-crrfas-surface text-center">
                        <div className="text-4xl mb-3 opacity-20">🏢</div>
                        <p className="text-crrfas-muted">No buildings registered yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

