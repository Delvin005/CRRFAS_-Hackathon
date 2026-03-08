import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import {
    Building2, CalendarDays, BookOpen, FlaskConical,
    Package, BarChart3, ShieldCheck, LayoutDashboard, Users
} from 'lucide-react';
import { useTenant } from '../hooks/useTenant';

/* ── Module registry ──────────────────────────────────────────────────
   Each entry maps a module key (same IDs used in the cart and the
   provision endpoint) to its dashboard card definition.
──────────────────────────────────────────────────────────────────────── */
const MODULE_CARDS = {
    core: {
        label: 'Core Platform',
        description: 'User management, roles, and tenant configuration.',
        icon: LayoutDashboard,
        color: 'text-crrfas-cyan',
        bg: 'from-crrfas-cyan/10 to-transparent',
        link: '/dashboard',
    },
    facilities: {
        label: 'Facilities',
        description: 'Manage buildings, floors, rooms, and campus maps.',
        icon: Building2,
        color: 'text-purple-400',
        bg: 'from-purple-500/10 to-transparent',
        link: '/facilities',
    },
    bookings: {
        label: 'Bookings',
        description: 'Request, approve, and calendar-view reservations.',
        icon: CalendarDays,
        color: 'text-amber-400',
        bg: 'from-amber-500/10 to-transparent',
        link: '/bookings',
    },
    academics: {
        label: 'Academics',
        description: 'Courses, departments, timetables, and schedules.',
        icon: BookOpen,
        color: 'text-emerald-400',
        bg: 'from-emerald-500/10 to-transparent',
        link: '/academics',
    },
    resources: {
        label: 'Resources',
        description: 'Lab instruments, asset tracking, and maintenance logs.',
        icon: Package,
        color: 'text-orange-400',
        bg: 'from-orange-500/10 to-transparent',
        link: '/resources',
    },
    research: {
        label: 'Research',
        description: 'Projects, grants, publications, and researcher profiles.',
        icon: FlaskConical,
        color: 'text-pink-400',
        bg: 'from-pink-500/10 to-transparent',
        link: '/research',
    },
    analytics: {
        label: 'Analytics',
        description: 'Utilization reports, occupancy heatmaps, and KPIs.',
        icon: BarChart3,
        color: 'text-blue-400',
        bg: 'from-blue-500/10 to-transparent',
        link: '/analytics',
    },
};

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const { tenant } = useTenant();

    /* Determine which modules this tenant has enabled.
       Preferred source: localStorage (set during provisioning).
       Fallback: show all modules (for dev/super-admin contexts). */
    const enabledModules = useMemo(() => {
        const stored = localStorage.getItem('enabled_modules');
        if (stored) {
            try { return JSON.parse(stored); } catch { /* ignore */ }
        }
        return Object.keys(MODULE_CARDS); // fallback: all modules
    }, []);

    const userRole = localStorage.getItem('user_role') || '';
    const isTenantAdmin = userRole === 'tenant_admin' || user?.memberships?.[0]?.role === 'tenant_admin';

    const visibleCards = enabledModules
        .filter(key => MODULE_CARDS[key])
        .map(key => ({ key, ...MODULE_CARDS[key] }));

    return (
        <div className="space-y-10">
            {/* ── Header ── */}
            <header>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-crrfas-light tracking-tight">
                            Welcome back, <span className="text-crrfas-light">{user?.first_name || 'Admin'}</span>
                        </h1>
                        <p className="text-crrfas-muted mt-1 text-sm">
                            {isTenantAdmin
                                ? 'You have full administrative access to your institution\'s modules.'
                                : 'Systems are operating normally.'}
                        </p>
                    </div>
                    {isTenantAdmin && (
                        <div 
                           className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest"
                           style={{ 
                               color: tenant?.primary_color || '#0DF5E3',
                               borderColor: `${tenant?.primary_color || '#0DF5E3'}40`,
                               backgroundColor: `${tenant?.primary_color || '#0DF5E3'}15` 
                           }}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Tenant Administrator
                        </div>
                    )}
                </div>
            </header>

            {/* ── Purchased Module Cards ── */}
            <section>
                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-6">
                    Your Active Modules ({visibleCards.length})
                </h2>
                {visibleCards.length === 0 ? (
                    <div className="glass-panel p-12 text-center space-y-4">
                        <p className="text-gray-500 text-sm">No modules enabled for this tenant.</p>
                        <p className="text-xs text-gray-600">Contact support or visit the pricing page to add modules.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {visibleCards.map(({ key, label, description, icon: Icon, color, bg, link }) => (
                            <Link
                                key={key}
                                to={link}
                                className="glass-panel p-7 group hover:border-white/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                            >
                                {/* Background gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                                <div className="relative space-y-4">
                                    <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-6 h-6 ${color}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg leading-tight">{label}</h3>
                                        <p className="text-gray-500 text-sm mt-1 leading-snug">{description}</p>
                                    </div>
                                    <div className={`text-xs font-bold ${color} uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                        Open module →
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Quick Stats (only for users with bookings/facilities) ── */}
            {(enabledModules.includes('facilities') || enabledModules.includes('bookings')) && (
                <section>
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-6">
                        Quick Stats
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {enabledModules.includes('facilities') && (
                            <Link to="/facilities" className="glass-panel p-6 text-center hover:border-purple-500/30 transition">
                                <div className="text-4xl font-black text-purple-400 mb-2">—</div>
                                <div className="text-gray-500 text-sm">Active Facilities</div>
                            </Link>
                        )}
                        {enabledModules.includes('bookings') && (
                            <Link to="/bookings" className="glass-panel p-6 text-center hover:border-amber-500/30 transition">
                                <div className="text-4xl font-black text-amber-400 mb-2">—</div>
                                <div className="text-gray-500 text-sm">Pending Bookings</div>
                            </Link>
                        )}
                        <div className="glass-panel p-6 text-center transition" style={{ borderColor: `${tenant?.primary_color || '#0DF5E3'}30`, backgroundColor: `${tenant?.primary_color || '#0DF5E3'}10`}}>
                            <div className="text-4xl font-black mb-2 text-crrfas-light">
                                {visibleCards.length}
                            </div>
                            <div className="text-crrfas-muted text-sm">Modules Active</div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── User management shortcut for admins ── */}
            {isTenantAdmin && (
                <section>
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-6">
                        Administration
                    </h2>
                    <Link to="/users"
                        className="glass-panel p-6 flex items-center justify-between group hover:border-white/20 transition">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <Users className="w-5 h-5 text-white/60" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">Manage Users & Roles</p>
                                <p className="text-gray-500 text-xs mt-0.5">Invite staff, assign roles across your institution.</p>
                            </div>
                        </div>
                        <span className="text-gray-600 group-hover:text-white transition text-sm">→</span>
                    </Link>
                </section>
            )}
        </div>
    );
}
