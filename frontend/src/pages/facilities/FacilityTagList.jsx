import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function FacilityTagList() {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', icon: '' });

    useEffect(() => {
        fetchData();
     
        }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('facilities/facility-tags/');
            setTags(res.data.results || res.data);
        } catch (error) { console.error(error); 
            setError('Failed to fetch facility tags.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('facilities/facility-tags/', formData);
            setIsFormOpen(false);
            setFormData({ name: '', icon: '' });
            fetchData();
        } catch (error) { console.error(error); 
            setError('Failed to create tag.');
        }
    };

    if (loading) return <div className="text-crrfas-teal animate-pulse py-8 text-center">Loading Tags...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-crrfas-light">Amenities & Resources</h2>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-crrfas-surface border border-crrfas-teal text-crrfas-cyan px-4 py-2 rounded-lg text-sm hover:bg-crrfas-teal/20 transition-colors"
                >
                    {isFormOpen ? 'Close Form' : '+ Add Tag'}
                </button>
            </div>

            {error && <div className="text-crrfas-danger text-sm">{error}</div>}

            {isFormOpen && (
                <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4 mb-8 border-crrfas-teal/50 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-lg font-medium text-crrfas-teal">Add Facility Tag</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Tag Name</label>
                            <input
                                type="text"
                                className="input-field mt-1"
                                placeholder="e.g. 4K Projector"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Icon ID (Optional)</label>
                            <input
                                type="text"
                                className="input-field mt-1"
                                placeholder="e.g. video"
                                value={formData.icon}
                                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="btn-primary py-2 px-6 text-sm bg-gradient-to-r from-crrfas-teal to-crrfas-cyan">Save Tag</button>
                    </div>
                </form>
            )}

            <div className="flex flex-wrap gap-4">
                {tags.length === 0 && !isFormOpen && (
                    <div className="w-full text-center py-12 text-crrfas-muted glass-panel border-dashed border-2 border-crrfas-surface">
                        No tags defined.
                    </div>
                )}
                {tags.map(tag => (
                    <div key={tag.id} className="bg-crrfas-surface/40 border border-crrfas-surface hover:border-crrfas-cyan/50 px-4 py-3 rounded-xl flex items-center gap-3 transition-colors group">
                        <div className="bg-crrfas-primary/20 p-2 rounded-lg text-crrfas-cyan group-hover:scale-110 transition-transform">
                            ✨
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">{tag.name}</h3>
                            <p className="text-[10px] text-crrfas-muted uppercase tracking-tighter">{tag.icon || 'no-icon'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
