import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTenant } from '../hooks/useTenant';
import { ShieldCheck, CheckCircle2, LayoutDashboard, Building2, CalendarDays, BookOpen, Package } from 'lucide-react';

// Map module keys → human-readable labels for the summary panel
const MODULE_LABELS = {
    core: { label: 'Core Platform', icon: LayoutDashboard },
    facilities: { label: 'Facility Management', icon: Building2 },
    bookings: { label: 'Booking System', icon: CalendarDays },
    academics: { label: 'Academic Management', icon: BookOpen },
    resources: { label: 'Resource Management', icon: Package },
};

export default function Login() {
    const { user, login } = useContext(AuthContext);
    const { tenant } = useTenant();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Auto-redirect or auto-login via tokens
    useEffect(() => {
        // Handle cross-subdomain auto-login tokens from Signup
        const params = new URLSearchParams(window.location.search);
        const autoAccess = params.get('access');
        const autoRefresh = params.get('refresh');
        
        if (autoAccess && autoRefresh) {
            localStorage.setItem('access_token', autoAccess);
            localStorage.setItem('refresh_token', autoRefresh);
            // Clean up the URL securely so tokens don't sit in the address bar
            window.history.replaceState({}, document.title, window.location.pathname);
            // Force a full reload to the dashboard so AuthContext bootstraps with the new tokens
            window.location.href = '/dashboard';
            return;
        }

        if (user) {
            // Check if we need to redirect to their specific subdomain workspace
            if (user?.memberships?.length > 0) {
                const membership = user.memberships[0];
                const subdomain = membership.tenant_subdomain;
                 
                const currentSubdomain = window.location.hostname.split('.')[0];
                
                // If they belong to a specific tenant and they aren't on that tenant's URL currently
                if (subdomain && currentSubdomain !== subdomain && currentSubdomain !== 'www') {
                    const protocol = window.location.protocol;
                    const port = window.location.port ? `:${window.location.port}` : '';
                    const domain = window.location.hostname.includes('localhost') ? 'localhost' : window.location.hostname.replace(`${currentSubdomain}.`, '');
                    
                    window.location.href = `${protocol}//${subdomain}.${domain}${port}/dashboard`;
                    return;
                }
            }
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Read purchased modules from the tenant API response directly
    const enabledModules = tenant?.enabled_modules || [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const user = await login(email, password);
            
            // Check if we need to redirect to their specific subdomain workspace
            if (user?.memberships?.length > 0) {
                const membership = user.memberships[0];
                const subdomain = membership.tenant_subdomain;
                 
                const currentSubdomain = window.location.hostname.split('.')[0];
                
                // If they belong to a specific tenant and they aren't on that tenant's URL currently
                if (subdomain && currentSubdomain !== subdomain && currentSubdomain !== 'www') {
                    const protocol = window.location.protocol;
                    const port = window.location.port ? `:${window.location.port}` : '';
                    const domain = window.location.hostname.includes('localhost') ? 'localhost' : window.location.hostname.replace(`${currentSubdomain}.`, '');
                    
                    window.location.href = `${protocol}//${subdomain}.${domain}${port}/dashboard`;
                    return; // Prevent navigate from running
                }
            }
            navigate('/dashboard');
        } catch (err) {
            if (err.response) {
                setError(err.response.data?.detail || 'Invalid email or password.');
            } else if (err.request) {
                setError('Cannot connect to the server. Please try again.');
            } else {
                setError(err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Tenant name + role badge ── */}
            {tenant?.name && (
                <div className="text-center space-y-1 pb-4 border-b border-white/5">
                    <h2 className="text-lg font-black text-white tracking-tight" style={tenant?.isSpecific ? {color: tenant.primary_color} : {}}>{tenant.name}</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">{tenant?.isSpecific ? 'Institution Portal' : 'Global Admin'}</p>
                </div>
            )}

            {/* ── Purchased modules summary ── */}
            {enabledModules.length > 0 && (
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {tenant?.isSpecific ? 'Active Subscription' : 'Global Platform Features'}
                    </p>
                    <div className="space-y-2">
                        {enabledModules.map(key => {
                            const mod = MODULE_LABELS[key];
                            if (!mod) return null;
                            const Icon = mod.icon;
                            return (
                                <div key={key} className="flex items-center gap-2 text-xs text-gray-300">
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={tenant?.isSpecific ? { color: tenant.primary_color } : { color: '#0DF5E3' }} />
                                    <span>{mod.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Login form ── */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400 ml-0.5">Email Address</label>
                    <input
                        type="email" required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="admin@institution.edu"
                        autoComplete="off"
                        className="input-field w-full"
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-400 ml-0.5">Password</label>
                        <Link to="/forgot-password" className="text-xs text-crrfas-cyan hover:underline">Forgot?</Link>
                    </div>
                    <input
                        type="password" required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="input-field w-full"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all hover:brightness-110 active:scale-[.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: tenant?.primary_color || '#0DF5E3', color: '#0a0f1a' }}
                >
                    {isLoading
                        ? <span className="animate-pulse">Authenticating…</span>
                        : <><ShieldCheck className="w-4 h-4" /> Sign In</>
                    }
                </button>
            </form>

            {/* ── Footer note ── */}
            <p className="text-center text-[11px] text-gray-500 font-medium">
                New Registration?{' '}
                <Link to="/pricing" className="text-crrfas-cyan font-bold hover:underline">Visit plans →</Link>
            </p>
        </div>
    );
}
