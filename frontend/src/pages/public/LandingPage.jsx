import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Monitor, Calendar, Users, BarChart3, Clock, Rocket, CheckCircle, Shield, Zap } from 'lucide-react';
import ThreeBackground from '../../components/public/ThreeBackground';
import { useTenant } from '../../hooks/useTenant';

export default function LandingPage() {
    const { tenant, loading } = useTenant();

    // Do not show marketing page on subdomains, jump straight to the app
    if (loading) {
        return (
            <div className="min-h-screen bg-crrfas-bg flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-crrfas-cyan border-t-transparent animate-spin" />
            </div>
        );
    }
    
    if (tenant?.isSpecific) {
        return <Navigate to="/dashboard" replace />;
    }

    const modules = [
        {
            icon: <Monitor className="w-6 h-6" />,
            title: 'Resource Management',
            desc: 'Track assets, IT equipment, and lab instruments across all campuses in real-time.',
            stat: '10k+ Assets',
        },
        {
            icon: <Calendar className="w-6 h-6" />,
            title: 'Facility Booking',
            desc: 'Smart conflict-detection algorithms with multi-stage approval workflows.',
            stat: 'Zero Conflicts',
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: 'Timetable Scheduling',
            desc: 'Automate complex academic schedules for courses, faculty and rooms.',
            stat: '80% Faster',
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: 'Role-Based Portals',
            desc: 'Personalised views for students, faculty, and administrative staff.',
            stat: '3 Role Levels',
        },
        {
            icon: <BarChart3 className="w-6 h-6" />,
            title: 'Advanced Analytics',
            desc: 'Live utilisation dashboards and data-driven insights for resource distribution.',
            stat: 'Live Reports',
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: 'Multi-Tenant Security',
            desc: 'Complete data isolation per institution with enterprise-grade encryption.',
            stat: '100% Isolated',
        },
    ];

    const highlights = [
        'Seamless multi-tenant architecture',
        'Custom branding per institution',
        'API-first, integrates with ERP/LMS',
        'GDPR-compliant data governance',
    ];

    return (
        <div className="bg-crrfas-bg min-h-screen">

            {/* ─── HERO ─── */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <ThreeBackground />
                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-crrfas-cyan/30 bg-crrfas-cyan/10 text-crrfas-cyan text-xs font-black tracking-[0.25em] uppercase shadow-[0_0_20px_rgba(13,245,227,0.12)] backdrop-blur-sm animate-fade-in-down">
                        <Zap className="w-3.5 h-3.5" />
                        {tenant?.isSpecific ? `${tenant.name} Portal` : 'Intelligent Campus OS'}
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.92] animate-fade-in mb-6">
                        {tenant?.isSpecific ? (
                            <>Empowering <br /> {tenant.name.split(' ')[0]} <span className="text-crrfas-cyan text-glow" style={{ color: tenant.primary_color }}>Operations</span></>
                        ) : (
                            <>Unify Your Higher <br /> Education <span className="text-crrfas-cyan text-glow drop-shadow-[0_0_30px_rgba(13,245,227,0.3)]">Ecosystem</span></>
                        )}
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg md:text-xl text-crrfas-muted max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in delay-100">
                        {tenant?.isSpecific
                            ? `Welcome to the official facility and resource management portal for ${tenant.name}. Coordinate labs, rooms, and schedules in one place.`
                            : 'The all-in-one SaaS platform for managing campus resources, scheduling, and academic operations across multi-tenant environments.'
                        }
                    </p>

                    {/* Single CTA — no student/staff login */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in delay-200">
                        <button
                            onClick={() => window.location.href = '/pricing'}
                            className="btn-primary text-base px-10 py-4 flex items-center justify-center gap-2 group"
                        >
                            Partner Your Institution
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <Link
                            to="/features"
                            className="px-10 py-4 rounded-xl font-bold border border-crrfas-surface text-crrfas-muted hover:text-white hover:border-crrfas-cyan/40 hover:bg-crrfas-surface/30 transition-all text-base flex items-center justify-center backdrop-blur-md"
                        >
                            Explore Platform
                        </Link>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-crrfas-muted/50 animate-bounce">
                    <div className="w-px h-8 bg-gradient-to-b from-crrfas-cyan/40 to-transparent" />
                    <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
                </div>
            </section>

            {/* ─── ABOUT ZencampuZ ─── */}
            <section className="py-12 bg-gradient-to-b from-crrfas-bg to-crrfas-surface/10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left: text */}
                        <div>
                            <p className="text-xs font-black tracking-[0.3em] uppercase text-crrfas-cyan mb-3" style={tenant?.isSpecific ? { color: tenant.primary_color } : {}}>
                                About ZencampuZ
                            </p>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-5 leading-tight">
                                {tenant?.isSpecific
                                    ? `Streamlining ${tenant.name}`
                                    : 'Built for the Complexity\nof Modern Education'}
                            </h2>
                            <p className="text-base text-crrfas-muted leading-relaxed mb-8">
                                {tenant?.isSpecific
                                    ? `This dedicated instance of ZencampuZ provides ${tenant.name} with custom-tailored workflows for resource allocation, room bookings, and academic tracking — with 100% data isolation and premium performance.`
                                    : 'Campus Resource, Room and Facility Allocation System (ZencampuZ) bridges the gap between administrative chaos and seamless academic operations. Our multi-tenant SaaS architecture ensures every institution maintains its own branding, data, and workflows.'
                                }
                            </p>
                            <ul className="space-y-3">
                                {highlights.map((h, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-crrfas-muted">
                                        <CheckCircle className="w-4 h-4 text-crrfas-cyan flex-shrink-0" style={tenant?.isSpecific ? { color: tenant.primary_color } : {}} />
                                        {h}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Right: stat cards */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { value: '50+', label: 'Institutions Served' },
                                { value: '99.9%', label: 'Uptime SLA' },
                                { value: '200k+', label: 'Bookings Managed' },
                                { value: '< 2s', label: 'Avg Response Time' },
                            ].map((stat, i) => (
                                <div key={i} className="glass-panel p-6 text-center hover:-translate-y-1 transition-transform">
                                    <p className="text-3xl font-black text-crrfas-cyan mb-1" style={tenant?.isSpecific ? { color: tenant.primary_color } : {}}>{stat.value}</p>
                                    <p className="text-xs text-crrfas-muted uppercase tracking-wider">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── CORE CAPABILITIES ─── */}
            <section className="py-14">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section header */}
                    <div className="text-center mb-12">
                        <p className="text-xs font-black tracking-[0.3em] uppercase text-crrfas-cyan mb-3" style={tenant?.isSpecific ? { color: tenant.primary_color } : {}}>
                            What We Offer
                        </p>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Core Capabilities</h2>
                        <p className="text-crrfas-muted max-w-xl mx-auto text-base">
                            Modular, enterprise-grade features designed to scale with your institution's needs.
                        </p>
                    </div>

                    {/* Tiles grid — 3 col desktop, 2 col tablet, 1 col mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {modules.map((mod, i) => (
                            <div
                                key={i}
                                className="glass-panel p-6 group hover:-translate-y-1 hover:border-crrfas-cyan/30 transition-all duration-300 flex flex-col gap-4"
                            >
                                {/* Icon + stat row */}
                                <div className="flex items-start justify-between">
                                    <div
                                        className="w-11 h-11 rounded-xl bg-crrfas-bg border border-crrfas-surface flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner"
                                        style={{ color: tenant?.primary_color || '#0DF5E3' }}
                                    >
                                        {mod.icon}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-crrfas-cyan/70 mt-1" style={tenant?.isSpecific ? { color: `${tenant.primary_color}B3` } : {}}>
                                        {mod.stat}
                                    </span>
                                </div>
                                {/* Text */}
                                <div>
                                    <h3 className="text-base font-black text-white mb-1.5">{mod.title}</h3>
                                    <p className="text-sm text-crrfas-muted leading-relaxed">{mod.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA SECTION ─── */}
            <section className="py-12 relative overflow-hidden">
                {/* Subtle glow bg */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-crrfas-cyan/8 via-transparent to-transparent" style={tenant?.isSpecific ? { backgroundImage: `radial-gradient(ellipse at center, ${tenant.primary_color}14, transparent)` } : {}} />
                <div className="absolute inset-0 border-t border-b border-crrfas-surface/40" />

                <div className="max-w-3xl mx-auto px-4 relative z-10 text-center">
                    <p className="text-xs font-black tracking-[0.3em] uppercase text-crrfas-cyan mb-3" style={tenant?.isSpecific ? { color: tenant.primary_color } : {}}>
                        Get Started
                    </p>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                        {tenant?.isSpecific ? 'Access Your Dashboard' : 'Ready to Smartify Your Campus?'}
                    </h2>
                    <p className="text-crrfas-muted mb-10 text-base max-w-xl mx-auto">
                        Join leading academic institutions that have transformed their operations with ZencampuZ. Setup takes less than a day.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to={tenant?.isSpecific ? '/login' : '/pricing'}
                            className="btn-primary text-base px-10 py-4 flex items-center justify-center gap-2"
                            style={tenant?.isSpecific ? { backgroundColor: tenant.primary_color } : {}}
                        >
                            {tenant?.isSpecific ? 'Login Now' : 'View Pricing'}
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        {!tenant?.isSpecific && (
                            <Link to="/contact" className="px-10 py-4 rounded-xl font-bold text-crrfas-cyan border border-crrfas-cyan/20 bg-crrfas-cyan/5 hover:bg-crrfas-cyan/15 transition-all text-base flex items-center justify-center">
                                Contact Sales
                            </Link>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
