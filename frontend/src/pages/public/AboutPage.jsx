import { Rocket, Target, Users, BookOpen, Lightbulb, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const missionPillars = [
    {
        icon: <Target className="w-6 h-6" />,
        label: 'Vision',
        heading: 'A Global Standard',
        body: 'To become the definitive operating system for higher education — redefining how institutions manage space, time, and people.',
    },
    {
        icon: <Lightbulb className="w-6 h-6" />,
        label: 'Innovation',
        heading: 'Cloud-Native Architecture',
        body: 'We build tenant-aware, cloud-first systems that scale seamlessly from single colleges to sprawling university networks.',
    },
    {
        icon: <Users className="w-6 h-6" />,
        label: 'Community',
        heading: 'People at the Centre',
        body: 'Every feature exists to reduce friction for students, faculty, and administrators — so they can focus on education, not paperwork.',
    },
    {
        icon: <Globe className="w-6 h-6" />,
        label: 'Inclusion',
        heading: 'For Every Institution',
        body: "From arts colleges to research campuses, ZencampuZ adapts to every institution's unique culture, branding, and workflow.",
    },
    {
        icon: <BookOpen className="w-6 h-6" />,
        label: 'Transparency',
        heading: 'Open by Default',
        body: 'Full audit trails, analytics, and compliance tooling keep administrators informed and institutions accountable.',
    },
    {
        icon: <Rocket className="w-6 h-6" />,
        label: 'Impact',
        heading: 'Measurable Outcomes',
        body: 'Institutions on ZencampuZ report a 40 % reduction in scheduling conflicts and 60 % faster facility approval cycles.',
    },
];

const timeline = [
    {
        year: '2024',
        title: 'The Problem Identified',
        desc: 'Hackathon teams witnessed department heads fighting over lab schedules, students unable to find study rooms, and IT assets going missing with no record.',
    },
    {
        year: '2024',
        title: 'ZencampuZ Is Born',
        desc: 'A focused sprint produced the first multi-tenant prototype — handling resource bookings, timetable generation, and facility management in a single dashboard.',
    },
    {
        year: '2025',
        title: 'SaaS Platform Launch',
        desc: 'ZencampuZ went live as a fully hosted SaaS — onboarding colleges across engineering, arts, management, and research verticals.',
    },
    {
        year: '2026',
        title: 'Scaling the Ecosystem',
        desc: 'Today ZencampuZ handles millions of data records across Resource Management, Timetabling, Exam Operations, and Facility Bookings — each tenant fully isolated and beautifully branded.',
    },
];

export default function AboutPage() {
    return (
        <div className="bg-crrfas-bg min-h-screen">

            {/* ─── PAGE HERO ─── */}
            <section className="pt-16 pb-10 text-center relative overflow-hidden">
                {/* ambient glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-crrfas-cyan/8 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 max-w-3xl mx-auto px-4">
                    <p className="text-xs font-black tracking-[0.3em] uppercase text-crrfas-cyan mb-4">
                        About ZencampuZ
                    </p>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-tight mb-5">
                        The Story Behind<br />
                        <span className="text-crrfas-cyan text-glow">Campus Intelligence</span>
                    </h1>
                    <p className="text-lg text-crrfas-muted leading-relaxed">
                        Built in a hackathon. Grown into a platform. Today ZencampuZ powers the operational backbone of modern academic institutions.
                    </p>
                </div>
            </section>

            <section className="py-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Section label */}
                    <div className="text-center mb-10">
                        <p className="text-xs font-black tracking-[0.3em] uppercase text-crrfas-cyan mb-2">Our Origin</p>
                        <h2 className="text-3xl md:text-4xl font-black text-white">The Story Behind ZencampuZ</h2>
                    </div>

                    {/* Timeline */}
                    <div className="relative">
                        {/* Vertical line */}
                        <div className="hidden md:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-px bg-gradient-to-b from-crrfas-cyan/40 via-crrfas-surface to-transparent" />

                        <div className="space-y-10">
                            {timeline.map((item, i) => (
                                <div
                                    key={i}
                                    className={`relative flex flex-col md:flex-row items-start md:items-center gap-6 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                                >
                                    {/* Card — half width on desktop */}
                                    <div className={`w-full md:w-[calc(50%-2rem)] glass-panel p-6 hover:-translate-y-0.5 transition-transform ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                                        <span className="inline-block text-xs font-black tracking-[0.2em] uppercase text-crrfas-cyan mb-2">{item.year}</span>
                                        <h3 className="text-lg font-black text-white mb-2">{item.title}</h3>
                                        <p className="text-sm text-crrfas-muted leading-relaxed">{item.desc}</p>
                                    </div>

                                    {/* Centre dot */}
                                    <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-crrfas-cyan border-2 border-crrfas-bg shadow-[0_0_10px_rgba(13,245,227,0.5)]" />

                                    {/* Spacer opposite side */}
                                    <div className="hidden md:block w-[calc(50%-2rem)]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── MISSION ─── */}
            <section className="py-10 bg-gradient-to-b from-transparent to-crrfas-surface/10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Section header */}
                    <div className="text-center mb-12">
                        <p className="text-xs font-black tracking-[0.3em] uppercase text-crrfas-cyan mb-3">What Drives Us</p>
                        <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Our Mission</h2>
                        <p className="text-base text-crrfas-muted max-w-2xl mx-auto leading-relaxed">
                            We believe academic institutions shouldn't be held back by outdated operational software. Our mission is to provide the most intelligent, scalable, and beautifully designed campus OS in the world.
                        </p>
                    </div>

                    {/* Mission pillar tiles — 3 col desktop, 2 tablet, 1 mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {missionPillars.map((pillar, i) => (
                            <div
                                key={i}
                                className="glass-panel p-6 group hover:-translate-y-1 hover:border-crrfas-cyan/30 transition-all duration-300 flex flex-col gap-4"
                            >
                                {/* Top row: icon + label pill */}
                                <div className="flex items-center justify-between">
                                    <div className="w-10 h-10 rounded-xl bg-crrfas-bg border border-crrfas-surface flex items-center justify-center text-crrfas-cyan group-hover:scale-110 transition-transform shadow-inner">
                                        {pillar.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-crrfas-cyan/60 border border-crrfas-cyan/20 rounded-full px-2.5 py-0.5">
                                        {pillar.label}
                                    </span>
                                </div>
                                {/* Text */}
                                <div>
                                    <h3 className="text-base font-black text-white mb-1.5 leading-snug">{pillar.heading}</h3>
                                    <p className="text-sm text-crrfas-muted leading-relaxed">{pillar.body}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-10">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-black text-white mb-4">Ready to Transform Your Campus?</h2>
                    <p className="text-crrfas-muted mb-8 text-base">Join 50+ institutions already running on ZencampuZ. Get started in less than a day.</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/pricing" className="btn-primary px-10 py-4 text-base flex items-center justify-center gap-2 group">
                            View Pricing <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link to="/contact" className="px-10 py-4 rounded-xl font-bold text-crrfas-cyan border border-crrfas-cyan/20 bg-crrfas-cyan/5 hover:bg-crrfas-cyan/15 transition-all text-base flex items-center justify-center">
                            Contact Sales
                        </Link>
                    </div>
                </div>
            </section>

        </div>
    );
}
