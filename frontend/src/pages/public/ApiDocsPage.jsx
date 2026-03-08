import { Code, Box, Globe, Cpu, Layers, Terminal } from 'lucide-react';

export default function ApiDocsPage() {
    const endpoints = [
        { method: 'GET', path: '/v1/resources/availability', desc: 'Query real-time availability for rooms and staff across campuses.' },
        { method: 'POST', path: '/v1/bookings/request', desc: 'Programmatic booking creation for external integrated apps.' },
        { method: 'GET', path: '/v1/tenant/branding', desc: 'Fetch logos and colors for custom frontend wrappers.' },
    ];

    return (
        <div className="bg-crrfas-bg min-h-screen pt-32 pb-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Content */}
                    <div className="lg:col-span-8 space-y-16">
                        <section>
                            <div className="flex items-center gap-3 text-crrfas-cyan mb-4">
                                <Terminal className="w-8 h-8" />
                                <span className="uppercase tracking-[0.2em] font-bold text-sm">Integrations Hub</span>
                            </div>
                            <h1 className="text-6xl font-black text-white mb-8 tracking-tighter">ZencampuZ API</h1>
                            <p className="text-xl text-crrfas-muted leading-relaxed">
                                Our RESTful API allows institutional IT departments and alumni networks to build custom extensions on top of the ZencampuZ allocation engine.
                            </p>
                        </section>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="glass-panel p-6 border-l-2 border-l-crrfas-cyan">
                                <div className="bg-crrfas-surface/50 w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-crrfas-cyan"><Box className="w-5 h-5" /></div>
                                <h3 className="font-bold text-white mb-2">RESTful Architecture</h3>
                                <p className="text-xs text-crrfas-muted">Predictable, resource-oriented URLs and standard HTTP response codes.</p>
                            </div>
                            <div className="glass-panel p-6 border-l-2 border-l-crrfas-cyan">
                                <div className="bg-crrfas-surface/50 w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-crrfas-cyan"><Globe className="w-5 h-5" /></div>
                                <h3 className="font-bold text-white mb-2">Tenant Scoping</h3>
                                <p className="text-xs text-crrfas-muted">Automatic namespace isolation using API keys per institution.</p>
                            </div>
                        </div>

                        <section>
                            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-widest opacity-80">Quick Start Reference</h2>
                            <div className="space-y-4">
                                {endpoints.map((e, i) => (
                                    <div key={i} className="glass-panel p-5 flex items-center gap-6 font-mono border border-crrfas-surface/50 hover:border-crrfas-cyan/30 group">
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full shadow-sm ${e.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                            {e.method}
                                        </span>
                                        <span className="text-sm text-crrfas-light font-bold flex-grow group-hover:text-white transition-colors">{e.path}</span>
                                        <span className="hidden md:block text-[10px] text-crrfas-muted uppercase tracking-widest opacity-60">{e.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Stats */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="glass-panel p-8 bg-gradient-to-b from-crrfas-surface/20 to-transparent border border-crrfas-surface">
                            <h3 className="text-lg font-bold text-white mb-6">Developer SDKs</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-sm text-crrfas-muted hover:text-white cursor-pointer transition-colors">
                                    <span className="bg-crrfas-surface p-2 rounded">JS</span> crrfas-node-sdk v2.4
                                </li>
                                <li className="flex items-center gap-3 text-sm text-crrfas-muted hover:text-white cursor-pointer transition-colors">
                                    <span className="bg-crrfas-surface p-2 rounded">PY</span> crrfas-python v1.8
                                </li>
                                <li className="flex items-center gap-3 text-sm text-crrfas-muted hover:text-white cursor-pointer transition-colors">
                                    <span className="bg-crrfas-surface p-2 rounded">GO</span> crrfas-go-client
                                </li>
                            </ul>
                            <hr className="my-8 border-crrfas-surface" />
                            <button className="w-full btn-primary py-3">Generate API Key</button>
                        </div>

                        <div className="glass-panel p-6 border border-crrfas-surface overflow-hidden relative">
                            <Cpu className="absolute -bottom-4 -right-4 w-24 h-24 text-crrfas-cyan/5 -rotate-12" />
                            <h4 className="text-sm font-bold text-white mb-1">99.99% API Uptime</h4>
                            <p className="text-[10px] text-crrfas-muted uppercase tracking-widest">Real-time Service Health</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
