import { Shield, LayoutDashboard, Clock, BarChart, Settings, Users, BookOpen, Database } from 'lucide-react';

export default function FeaturesPage() {
    const featureList = [
        {
            icon: <Database className="w-8 h-8 text-crrfas-cyan" />,
            title: "Resource Management",
            desc: "Comprehensive tracking for IT assets, high-precision lab instruments, and sub-unit booking capabilities. Complete with maintenance scheduling."
        },
        {
            icon: <Clock className="w-8 h-8 text-crrfas-cyan" />,
            title: "Timetable Management",
            desc: "Automated engine to prevent faculty double-booking. Drag-and-drop scheduling interface with constraint resolution."
        },
        {
            icon: <BookOpen className="w-8 h-8 text-crrfas-cyan" />,
            title: "Exam Management",
            desc: "Seating arrangement generation based on room capacity, invigilator assignments, and conflict-free exam timetabling."
        },
        {
            icon: <Shield className="w-8 h-8 text-crrfas-cyan" />,
            title: "Facility Booking & Approval Workflow",
            desc: "Multi-stage custom approval workflows. Policy-based auto-routing with built-in conflict prevention and timeline tracking."
        },
        {
            icon: <BarChart className="w-8 h-8 text-crrfas-cyan" />,
            title: "Advanced Analytics",
            desc: "Tenant-specific dashboards showing facility utilization, peak request times, and maintenance backlog overviews."
        },
        {
            icon: <Users className="w-8 h-8 text-crrfas-cyan" />,
            title: "External Access & Integrations",
            desc: "Secure API endpoints and guest booking options for external conferences and alumni networks."
        },
        {
            icon: <Settings className="w-8 h-8 text-crrfas-cyan" />,
            title: "Tenant Branding",
            desc: "Every college gets its own unique portal. Dynamic logos, color palettes, and sub-domain detection built into the core."
        },
        {
            icon: <LayoutDashboard className="w-8 h-8 text-crrfas-cyan" />,
            title: "Smart Notifications",
            desc: "Real-time updates for approvals, rejections, and upcoming schedule changes via email and in-app alerts."
        }
    ];

    return (
        <div className="bg-crrfas-bg min-h-screen pt-16 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Page header */}
                <div className="text-center max-w-3xl mx-auto mb-10 animate-fade-in">
                    <p className="text-xs font-black tracking-[0.3em] uppercase text-crrfas-cyan mb-3">What We Offer</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Complete Campus Automation</h1>
                    <p className="text-base text-crrfas-muted">
                        Discover the powerful modules that make ZencampuZ the central nervous system of modern educational institutions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {featureList.map((f, i) => (
                        <div key={i} className="glass-panel p-5 border border-crrfas-surface/50 hover:border-crrfas-cyan/40 hover:-translate-y-1 group flex flex-col gap-4">
                            <div className="w-11 h-11 bg-crrfas-bg border border-crrfas-surface rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner" style={{ color: '#0DF5E3' }}>
                                {f.icon}
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white mb-1.5">{f.title}</h3>
                                <p className="text-sm text-crrfas-muted leading-relaxed">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
