import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function RoomTypeList() {
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchData();
     
        }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('facilities/room-types/');
            setRoomTypes(res.data.results || res.data);
        } catch (error) { console.error(error); 
            setError('Failed to fetch room types.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('facilities/room-types/', formData);
            setIsFormOpen(false);
            setFormData({ name: '', description: '' });
            fetchData();
        } catch (error) { console.error(error); 
            setError('Failed to create room type.');
        }
    };

    if (loading) return <div className="text-crrfas-teal animate-pulse py-8 text-center">Loading Room Types...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-crrfas-light">Space Categories</h2>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-crrfas-surface border border-crrfas-teal text-crrfas-cyan px-4 py-2 rounded-lg text-sm hover:bg-crrfas-teal/20 transition-colors"
                >
                    {isFormOpen ? 'Close Form' : '+ Add Type'}
                </button>
            </div>

            {error && <div className="text-crrfas-danger text-sm">{error}</div>}

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4 mb-8 border-crrfas-teal/50 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-medium text-crrfas-teal">Add Room Type</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Type Name</label>
                            <input
                                type="text"
                                className="input-field mt-1"
                                placeholder="e.g. Biology Lab"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Description</label>
                            <input
                                type="text"
                                className="input-field mt-1"
                                placeholder="What is this space used for?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary py-2 px-6 text-sm bg-gradient-to-r from-crrfas-teal to-crrfas-cyan">Save Type</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomTypes.length === 0 && !isFormOpen && (
                    <div className="col-span-full text-center py-12 text-crrfas-muted glass-panel border-dashed border-2 border-crrfas-surface">
                        No room types defined.
                    </div>
                )}
                {roomTypes.map(type => (
                    <div key={type.id} className="glass-panel p-5 border-l-4 border-l-crrfas-purple hover:border-crrfas-cyan/50 transition-all duration-300">
                        <h3 className="text-lg font-semibold text-white">{type.name}</h3>
                        <p className="mt-2 text-sm text-crrfas-muted line-clamp-2">
                            {type.description || 'No description provided.'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
