import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function ResourceCategoryList() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', description: '' });
    const [error, setError] = useState('');

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await api.get('resources/categories/');
            setCategories(res.data.results ?? res.data);
        } catch { setError('Failed to load categories.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch();  
        }, []);

    const resetForm = () => { setForm({ name: '', description: '' }); setEditItem(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editItem) await api.patch(`resources/categories/${editItem.id}/`, form);
            else await api.post('resources/categories/', form);
            setShowForm(false); resetForm(); fetch();
        } catch (error) { console.error(error);  setError('Save failed.'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        await api.delete(`resources/categories/${id}/`); fetch();
    };

    if (loading) return <div className="text-center text-crrfas-cyan animate-pulse py-12">Loading categories...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Resource Categories</h2>
                <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary py-2 px-4 text-sm">+ New Category</button>
            </div>

            {error && <div className="text-crrfas-danger text-sm glass-panel p-3">⚠️ {error}</div>}

            {showForm && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="glass-panel p-6 w-full max-w-md space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">{editItem ? 'Edit Category' : 'New Category'}</h3>
                            <button onClick={() => { setShowForm(false); resetForm(); }} className="text-crrfas-muted hover:text-white text-2xl">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs text-crrfas-muted">Category Name *</label>
                                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="input-field w-full mt-1" placeholder="e.g. Computer Lab, Laboratory, Sports" />
                            </div>
                            <div>
                                <label className="text-xs text-crrfas-muted">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={3} className="input-field w-full mt-1" placeholder="Describe this category..." />
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categories.map(cat => (
                    <div key={cat.id} className="glass-panel p-5 space-y-2 hover:border-crrfas-teal/40 transition-colors">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-white">{cat.name}</h3>
                            <div className="flex gap-3">
                                <button onClick={() => { setEditItem(cat); setForm({ name: cat.name, description: cat.description || '' }); setShowForm(true); }}
                                    className="text-xs text-crrfas-teal hover:text-white">✏️</button>
                                <button onClick={() => handleDelete(cat.id)} className="text-xs text-crrfas-danger hover:text-red-300">🗑️</button>
                            </div>
                        </div>
                        <p className="text-xs text-crrfas-muted">{cat.description || 'No description.'}</p>
                    </div>
                ))}
                {categories.length === 0 && <p className="col-span-full text-center text-crrfas-muted py-12">No categories yet.</p>}
            </div>
        </div>
    );
}
