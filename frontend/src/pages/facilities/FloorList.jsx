import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function FloorList() {
    const [floors, setFloors] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ building: '', floor_number: '', name: '', map_url: '' });

    useEffect(() => {
        fetchData();
     
        }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [fRes, bRes] = await Promise.all([
                api.get('facilities/floors/'),
                api.get('facilities/buildings/')
            ]);
            setFloors(fRes.data.results || fRes.data);
            setBuildings(bRes.data.results || bRes.data);
            if (bRes.data.length > 0) {
                setFormData(prev => ({ ...prev, building: bRes.data[0].id }));
            }
        } catch (error) { console.error(error); 
            setError('Failed to fetch floor and building data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('facilities/floors/', formData);
            setIsFormOpen(false);
            setFormData({ ...formData, floor_number: '', name: '', map_url: '' });
            fetchData();
        } catch (error) { console.error(error); 
            setError('Failed to create floor.');
        }
    };

    const getBuildingName = (id) => buildings.find(b => b.id === id)?.name || 'Unknown Building';

    if (loading) return <div className="text-crrfas-teal animate-pulse py-8 text-center">Loading Floors...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-crrfas-light">Building Floors</h2>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-crrfas-surface border border-crrfas-teal text-crrfas-cyan px-4 py-2 rounded-lg text-sm hover:bg-crrfas-teal/20 transition-colors"
                >
                    {isFormOpen ? 'Close Form' : '+ Add Floor'}
                </button>
            </div>

            {error && <div className="text-crrfas-danger text-sm">{error}</div>}

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4 mb-8 border-crrfas-teal/50 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-medium text-crrfas-teal">Add New Floor</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Building</label>
                            <select
                                className="input-field mt-1"
                                value={formData.building}
                                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                required
                            >
                                <option value="">Select Building</option>
                                {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Floor Number</label>
                            <input
                                type="number"
                                className="input-field mt-1"
                                placeholder="e.g. 1"
                                value={formData.floor_number}
                                onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Floor Name</label>
                            <input
                                type="text"
                                className="input-field mt-1"
                                placeholder="e.g. Ground Floor"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Map URL (Optional)</label>
                            <input
                                type="url"
                                className="input-field mt-1"
                                placeholder="https://..."
                                value={formData.map_url}
                                onChange={(e) => setFormData({ ...formData, map_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary py-2 px-6 text-sm bg-gradient-to-r from-crrfas-teal to-crrfas-cyan shadow-lg shadow-crrfas-teal/20">Save Floor</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {floors.length === 0 && !isFormOpen && (
                    <div className="col-span-full text-center py-12 text-crrfas-muted glass-panel border-dashed border-2 border-crrfas-surface">
                        No floors defined yet. Add floors to buildings to manage room locations.
                    </div>
                )}
                {floors.map(floor => (
                    <div key={floor.id} className="glass-panel p-5 border-l-4 border-l-crrfas-primary hover:border-crrfas-cyan/50 hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs bg-crrfas-surface px-2 py-1 rounded text-crrfas-cyan font-bold uppercase tracking-wider">Level {floor.floor_number}</span>
                            {floor.map_url && <span className="text-xs text-crrfas-muted">Y🗺️ Map Linked</span>}
                        </div>
                        <h3 className="text-lg font-semibold text-white truncate">{floor.name}</h3>
                        <p className="mt-2 text-sm text-crrfas-muted flex items-center gap-2">
                            🏢 {getBuildingName(floor.building)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
