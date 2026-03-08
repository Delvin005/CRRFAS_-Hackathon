import { Briefcase, Code, Terminal, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CareersPage() {
    const roles = [
        { title: "Senior Backend Engineer", dept: "Engineering", type: "Remote / Hybrid", icon: <Terminal className="w-5 h-5" /> },
        { title: "Product Designer", dept: "UI/UX", type: "Full-time", icon: <Heart className="w-5 h-5" /> },
        { title: "Tenant Success Manager", dept: "Operations", type: "Full-time", icon: <Briefcase className="w-5 h-5" /> },
        { title: "Fullstack Developer", dept: "Engineering", type: "Contract", icon: <Code className="w-5 h-5" /> },
    ];

    return (
        <div className="bg-crrfas-bg min-h-screen pt-32 pb-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
                    <div className="animate-fade-in">
                        <h1 className="text-6xl font-black text-white mb-8 tracking-tighter">
                            Build the Future of <span className="text-crrfas-cyan underline decoration-white/20">Campus OS</span>.
                        </h1>
                        <p className="text-xl text-crrfas-muted mb-10 leading-relaxed">
                            We're a mission-driven team of engineers and academics focused on removing friction from the educational experience. Join us in scaling ZencampuZ to 500+ institutions globally.
                        </p>
                        <div className="flex gap-4">
                            <div className="bg-crrfas-surface/50 px-6 py-4 rounded-2xl border border-crrfas-surface text-center flex-1">
                                <p className="text-2xl font-black text-white">24</p>
                                <p className="text-xs text-crrfas-muted uppercase tracking-widest">Team Members</p>
                            </div>
                            <div className="bg-crrfas-surface/50 px-6 py-4 rounded-2xl border border-crrfas-surface text-center flex-1">
                                <p className="text-2xl font-black text-white">12+</p>
                                <p className="text-xs text-crrfas-muted uppercase tracking-widest">Countries</p>
                            </div>
                        </div>
                    </div>
                    <div className="glass-panel p-10 border border-crrfas-cyan/30 bg-gradient-to-br from-crrfas-bg via-crrfas-surface/10 to-crrfas-cyan/5">
                        <h3 className="text-xl font-black text-white mb-8 text-glow uppercase tracking-widest">Open Roles</h3>
                        <div className="space-y-4">
                            {roles.map((r, i) => (
                                <div key={i} className="flex items-center justify-between p-5 rounded-2xl border border-crrfas-surface bg-crrfas-bg/30 hover:border-crrfas-cyan/50 transition-all group cursor-pointer shadow-inner">
                                    <div className="flex items-center gap-5">
                                        <div className="p-3 bg-crrfas-bg border border-crrfas-surface rounded-xl text-crrfas-cyan group-hover:bg-crrfas-cyan group-hover:text-crrfas-bg transition-colors shadow-sm">
                                            {r.icon}
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white group-hover:text-crrfas-cyan transition-colors">{r.title}</p>
                                            <p className="text-[10px] text-crrfas-muted uppercase tracking-widest opacity-60">{r.dept} • {r.type}</p>
                                        </div>
                                    </div>
                                    <span className="text-crrfas-cyan group-hover:translate-x-2 transition-transform font-black">→</span>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-xs text-crrfas-muted mt-10 italic opacity-60">
                            Don't see a role? Send your CV to <span className="text-crrfas-cyan font-bold not-italic">talent@crrfas.cloud</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
