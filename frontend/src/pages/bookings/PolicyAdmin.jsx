import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { ShieldAlert, Plus, Save, Trash2, Edit } from 'lucide-react';

export default function PolicyAdmin() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPolicy, setCurrentPolicy] = useState(null);

    const BOOKING_TYPES = ['academic_workshop', 'seminar', 'guest_lecture', 'student_event', 'inter_college_event', 'admin_meeting', 'external_conference', 'sports_booking', 'research_access_request'];
    const ROLES = ['student', 'faculty', 'facility_manager', 'tenant_admin', 'super_admin', 'external_user'];

    const fetchPolicies = async () => {
        try {
            const res = await api.get('bookings/policies/');
            setPolicies(res.data.results || res.data);
        } catch (error) {
            console.error('Failed to load policies', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPolicies();  
        }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (currentPolicy.id) {
                await api.put(`bookings/policies/${currentPolicy.id}/`, currentPolicy);
            } else {
                await api.post('bookings/policies/', currentPolicy);
            }
            setIsEditing(false);
            setCurrentPolicy(null);
            fetchPolicies();
        } catch (error) { console.error(error); 
            alert('Failed to save policy rule.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this policy rule?')) return;
        try {
            await api.delete(`bookings/policies/${id}/`);
            setPolicies(prev => prev.filter(p => p.id !== id));
        } catch (error) { console.error(error); 
            alert('Failed to delete rule.');
        }
    };

    const openNew = () => {
        setCurrentPolicy({
            rule_type: 'role_based',
            description: '',
            applies_to_roles: [],
            applies_to_booking_types: [],
            after_hours_only: false,
            requires_approval: true,
            approver_role: 'facility_manager',
            is_active: true
        });
        setIsEditing(true);
    };

    const toggleArrayItem = (arrayName, item) => {
        const arr = currentPolicy[arrayName];
        if (arr.includes(item)) {
            setCurrentPolicy({ ...currentPolicy, [arrayName]: arr.filter(i => i !== item) });
        } else {
            setCurrentPolicy({ ...currentPolicy, [arrayName]: [...arr, item] });
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-crrfas-light tracking-tight">Booking Policy Rules</h1>
                    <p className="text-crrfas-muted mt-1">Configure automation rules dictating which requests require approval.</p>
                </div>
                {!isEditing && (
                    <button onClick={openNew} className="btn-primary flex items-center gap-2 whitespace-nowrap">
                        <Plus className="w-5 h-5" /> New Rule
                    </button>
                )}
            </div>

            {loading ? (
                <div className="p-12 text-center text-crrfas-cyan animate-pulse">Loading policy engine...</div>
            ) : isEditing ? (
                <div className="glass-panel p-6 border-crrfas-cyan border shadow-lg shadow-crrfas-cyan/10 max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold mb-6 text-crrfas-light flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-crrfas-cyan" />
                        {currentPolicy.id ? 'Edit Policy Rule' : 'Create New Rule'}
                    </h2>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-crrfas-muted">Rule Mechanism</label>
                                <select
                                    className="input-field w-full"
                                    value={currentPolicy.rule_type}
                                    onChange={e => setCurrentPolicy({ ...currentPolicy, rule_type: e.target.value })}
                                >
                                    <option value="role_based">Trigger based on Requester's Role</option>
                                    <option value="time_based">Trigger based on Time (After-hours)</option>
                                    <option value="booking_type_based">Trigger based on Booking Type</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-crrfas-muted">Routed to (Approver Role)</label>
                                <select
                                    className="input-field w-full"
                                    value={currentPolicy.approver_role}
                                    onChange={e => setCurrentPolicy({ ...currentPolicy, approver_role: e.target.value })}
                                >
                                    <option value="facility_manager">Facility Manager</option>
                                    <option value="tenant_admin">Tenant Admin</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-crrfas-muted">Description (Internal Name)</label>
                            <input
                                required
                                type="text"
                                className="input-field w-full"
                                placeholder="e.g. Students always require manager approval"
                                value={currentPolicy.description}
                                onChange={e => setCurrentPolicy({ ...currentPolicy, description: e.target.value })}
                            />
                        </div>

                        {currentPolicy.rule_type === 'role_based' && (
                            <div className="space-y-2 p-4 bg-crrfas-surface/30 rounded-lg border border-crrfas-surface">
                                <label className="text-sm font-semibold text-crrfas-light">Target Roles (Triggers Rule)</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {ROLES.map(role => (
                                        <label key={role} className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${currentPolicy.applies_to_roles.includes(role) ? 'bg-crrfas-cyan/20 border-crrfas-cyan text-crrfas-cyan' : 'bg-crrfas-bg border-crrfas-surface text-crrfas-muted hover:border-crrfas-cyan/50'}`}>
                                            <input type="checkbox" className="hidden" checked={currentPolicy.applies_to_roles.includes(role)} onChange={() => toggleArrayItem('applies_to_roles', role)} />
                                            {role.replace('_', ' ')}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentPolicy.rule_type === 'booking_type_based' && (
                            <div className="space-y-2 p-4 bg-crrfas-surface/30 rounded-lg border border-crrfas-surface">
                                <label className="text-sm font-semibold text-crrfas-light">Target Booking Types (Triggers Rule)</label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {BOOKING_TYPES.map(type => (
                                        <label key={type} className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${currentPolicy.applies_to_booking_types.includes(type) ? 'bg-crrfas-cyan/20 border-crrfas-cyan text-crrfas-cyan' : 'bg-crrfas-bg border-crrfas-surface text-crrfas-muted hover:border-crrfas-cyan/50'}`}>
                                            <input type="checkbox" className="hidden" checked={currentPolicy.applies_to_booking_types.includes(type)} onChange={() => toggleArrayItem('applies_to_booking_types', type)} />
                                            {type.replace('_', ' ')}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {currentPolicy.rule_type === 'time_based' && (
                            <div className="space-y-2 p-4 bg-crrfas-surface/30 rounded-lg border border-crrfas-surface">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-5 h-5 accent-crrfas-cyan rounded" checked={currentPolicy.after_hours_only} onChange={e => setCurrentPolicy({ ...currentPolicy, after_hours_only: e.target.checked })} />
                                    <span className="font-semibold text-crrfas-light">Trigger if booking falls "After-hours" (Outside 8AM - 6PM)</span>
                                </label>
                            </div>
                        )}

                        <div className="flex items-center gap-3 p-4 bg-crrfas-surface/30 rounded-lg border border-crrfas-surface text-sm">
                            <input type="checkbox" className="w-5 h-5 accent-green-500 rounded" checked={currentPolicy.requires_approval} onChange={e => setCurrentPolicy({ ...currentPolicy, requires_approval: e.target.checked })} />
                            <span>Action: <strong>Force manual approval</strong> (If unchecked, the matched booking will be auto-approved).</span>
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-crrfas-surface/50">
                            <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary flex-1">Cancel</button>
                            <button type="submit" className="flex-1 bg-crrfas-cyan text-crrfas-bg font-bold py-3 rounded-lg hover:bg-crrfas-cyan/90 transition-colors flex items-center justify-center gap-2">
                                <Save className="w-5 h-5" /> Save Rule
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {policies.length === 0 && (
                        <div className="col-span-3 glass-panel text-center py-16 text-crrfas-muted">
                            <p>No active booking policies configured for this tenant. Everyone gets auto-approved currently!</p>
                        </div>
                    )}

                    {policies.map(policy => (
                        <div key={policy.id} className="glass-panel p-5 relative group flex flex-col h-full">
                            <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                <button onClick={() => { setCurrentPolicy(policy); setIsEditing(true); }} className="p-1.5 text-crrfas-cyan hover:bg-crrfas-cyan/20 rounded">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(policy.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                {policy.requires_approval ? (
                                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Requires Approval</span>
                                ) : (
                                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">Auto-Approves</span>
                                )}
                                <span className="bg-crrfas-surface text-crrfas-muted text-xs px-2 py-0.5 rounded font-mono">
                                    {policy.rule_type}
                                </span>
                            </div>

                            <h3 className="font-bold text-crrfas-light text-lg mb-4">{policy.description}</h3>

                            <div className="space-y-2 mt-auto text-sm">
                                <div className="flex py-2 border-t border-crrfas-surface/50">
                                    <span className="text-crrfas-muted w-24">Route to:</span>
                                    <span className="text-crrfas-light font-semibold capitalize">{policy.approver_role.replace('_', ' ')}</span>
                                </div>

                                {policy.rule_type === 'role_based' && policy.applies_to_roles.length > 0 && (
                                    <div className="flex py-2 border-t border-crrfas-surface/50 flex-col">
                                        <span className="text-crrfas-muted block mb-1">Target Roles:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {policy.applies_to_roles.map(r => <span key={r} className="text-xs bg-crrfas-bg px-2 py-0.5 rounded border border-crrfas-surface">{r}</span>)}
                                        </div>
                                    </div>
                                )}

                                {policy.rule_type === 'booking_type_based' && policy.applies_to_booking_types.length > 0 && (
                                    <div className="flex py-2 border-t border-crrfas-surface/50 flex-col">
                                        <span className="text-crrfas-muted block mb-1">Target Bookings:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {policy.applies_to_booking_types.map(t => <span key={t} className="text-xs bg-crrfas-bg px-2 py-0.5 rounded border border-crrfas-surface capitalize">{t.replace('_', ' ')}</span>)}
                                        </div>
                                    </div>
                                )}

                                {policy.rule_type === 'time_based' && policy.after_hours_only && (
                                    <div className="flex py-2 border-t border-crrfas-surface/50">
                                        <span className="text-yellow-400 font-semibold text-xs bg-yellow-400/10 px-2 py-1 rounded">Triggers on After-hours</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
