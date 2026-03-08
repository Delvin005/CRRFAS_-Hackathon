import { Lock, ShieldCheck, Key, RefreshCw } from 'lucide-react';

export default function SecurityPage() {
    const pillars = [
        {
            icon: <Lock className="w-8 h-8 text-crrfas-cyan" />,
            title: "Data Encryption",
            desc: "All traffic is encrypted via TLS 1.3 in transit. Data at rest is secured using AES-256 standards within our cloud architecture."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-crrfas-cyan" />,
            title: "Tenant Isolation",
            desc: "Logical multi-tenancy ensures that no two institutions ever share raw database pointers. Your data exists in its own secure silo."
        },
        {
            icon: <Key className="w-8 h-8 text-crrfas-cyan" />,
            title: "Identity Protection",
            desc: "Support for MFA and SSO (SAML/OAuth) for faculty and staff accounts to prevent unauthorized access to sensitive academic operations."
        },
        {
            icon: <RefreshCw className="w-8 h-8 text-crrfas-cyan" />,
            title: "Regular Audits",
            desc: "We perform weekly automated vulnerability scans and quarterly manual penetration tests to stay ahead of evolving threats."
        }
    ];

    return (
        <div className="bg-crrfas-bg min-h-screen pt-32 pb-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in">
                    <h1 className="text-5xl font-black text-white mb-6">Security First</h1>
                    <p className="text-xl text-crrfas-muted">
                        We understand that campus operations are critical. Here's how we protect $1B+ worth of institutional infrastructure.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {pillars.map((p, i) => (
                        <div key={i} className="glass-panel p-10 flex gap-6 border border-crrfas-surface/50 hover:border-crrfas-cyan/30 group">
                            <div className="bg-crrfas-bg border border-crrfas-surface p-4 rounded-2xl h-fit group-hover:scale-110 group-hover:border-crrfas-cyan/50 transition-all shadow-inner">
                                {p.icon}
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white mb-3 text-glow">{p.title}</h3>
                                <p className="text-sm text-crrfas-muted leading-relaxed opacity-80">{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-sm text-crrfas-muted uppercase tracking-[0.3em]">Built with</p>
                    <div className="flex justify-center gap-12 mt-8 grayscale opacity-50 flex-wrap">
                        <span className="text-2xl font-bold text-white">ISO 27001</span>
                        <span className="text-2xl font-bold text-white">SOC 2 Type II</span>
                        <span className="text-2xl font-bold text-white">GDPR Compliant</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
