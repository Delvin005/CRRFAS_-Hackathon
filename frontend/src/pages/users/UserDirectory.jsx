import { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import { AuthContext } from '../../contexts/AuthContext';

export default function UserDirectory() {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        role_id: '',
        campus_scope: ''
    });

    useEffect(() => {
        fetchData();
     
        }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uRes, rRes] = await Promise.all([
                api.get('accounts/users/'),
                api.get('accounts/roles/')
            ]);
            setUsers(uRes.data);
            setRoles(rRes.data);
            if (rRes.data.length > 0) {
                setFormData(prev => ({ ...prev, role_id: rRes.data[0].id }));
            }
        } catch (error) { console.error(error); 
            setError('Failed to fetch user directory.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('accounts/users/assign_role/', formData);
            setIsFormOpen(false);
            setFormData({
                email: '', first_name: '', last_name: '',
                role_id: roles[0]?.id || '', campus_scope: ''
            });
            fetchData();
        } catch (error) {
            setError(error.response?.data?.detail || 'Failed to assign role. Must be Tenant Admin.');
        }
    };

    const isTenantAdmin = user?.memberships?.some(m => ['super_admin', 'tenant_admin'].includes(m.role));

    if (loading) return <div className="text-crrfas-blue animate-pulse py-8">Loading Directory...</div>;

    return (
        <div className="space-y-6">
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-crrfas-light">User Directory</h1>
                    <p className="text-crrfas-muted mt-1">Manage Tenant Access & Roles.</p>
                </div>
                {isTenantAdmin && (
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="btn-primary"
                    >
                        {isFormOpen ? 'Cancel' : '+ Invite User & Assign Role'}
                    </button>
                )}
            </header>

            {error && <div className="text-crrfas-danger bg-crrfas-danger/10 p-4 rounded-lg border border-crrfas-danger/20">{error}</div>}

            {isFormOpen && isTenantAdmin && (
                <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-4 mb-8">
                    <h3 className="text-lg font-medium text-crrfas-cyan">Assign User Role</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Email Address</label>
                            <input
                                type="email"
                                className="input-field mt-1"
                                placeholder="john@example.edu"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">First Name</label>
                            <input
                                type="text"
                                className="input-field mt-1"
                                placeholder="John"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Last Name</label>
                            <input
                                type="text"
                                className="input-field mt-1"
                                placeholder="Doe"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">RBAC Role</label>
                            <select
                                className="input-field mt-1"
                                value={formData.role_id}
                                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                                required
                            >
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name.replace('_', ' ').toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-crrfas-muted ml-1">Campus Scope (Optional Code)</label>
                            <input
                                type="text"
                                className="input-field mt-1"
                                placeholder="e.g. MAIN"
                                value={formData.campus_scope}
                                onChange={(e) => setFormData({ ...formData, campus_scope: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-crrfas-surface">
                        <button type="submit" className="btn-primary px-8">Grant Access</button>
                    </div>
                </form>
            )}

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto p-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-crrfas-surface text-crrfas-muted text-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">User Details</th>
                                <th className="p-4 font-medium">RBAC Roles (Tenant)</th>
                                <th className="p-4 font-medium">Campus Scope</th>
                                <th className="p-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-crrfas-surface">
                            {users.map((mappedUser) => (
                                <tr key={mappedUser.id} className="hover:bg-crrfas-surface/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-crrfas-light">{mappedUser.first_name} {mappedUser.last_name}</div>
                                        <div className="text-xs text-crrfas-muted">{mappedUser.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {mappedUser.memberships?.length ? (
                                                mappedUser.memberships.map((m, idx) => (
                                                    <span key={idx} className="bg-crrfas-blue/20 text-crrfas-blue border border-crrfas-blue/30 px-2 py-1 rounded text-xs capitalize">
                                                        {m.role.replace('_', ' ')}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-crrfas-muted text-xs italic">No active roles</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-crrfas-muted capitalize">
                                        _{mappedUser.campus_scope || 'Global'}_
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${mappedUser.is_active ? 'bg-crrfas-success/20 text-crrfas-success border-crrfas-success/30' : 'bg-crrfas-danger/20 text-crrfas-danger border-crrfas-danger/30'} border`}>
                                            {mappedUser.is_active ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-crrfas-muted">No users found in this directory.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
