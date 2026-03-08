import { Shield, Lock, FileText, Globe } from 'lucide-react';

export default function PrivacyPage() {
    const sections = [
        {
            title: "Data Collection",
            content: "We collect information necessary to provide core ZencampuZ services, including institution details, user identities, and resource booking history. We do not sell your academic data to third parties."
        },
        {
            title: "Tenant Isolation",
            content: "Every institution's data is logically isolated in its own schema. User data from one college is never accessible to another, ensuring strict multi-tenant privacy."
        },
        {
            title: "Cookies & Tracking",
            content: "We use essential session cookies to keep you logged in. Any analytical tracking is anonymized and used only to improve the platform's performance."
        },
        {
            title: "Your Rights",
            content: "Depending on your region (GDPR, CCPA), you have the right to request a copy of your personal data or ask for its deletion from our SaaS portal."
        }
    ];

    return (
        <div className="bg-crrfas-bg min-h-screen pt-32 pb-40">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-16">
                    <div className="flex items-center gap-3 text-crrfas-cyan mb-4">
                        <Shield className="w-8 h-8" />
                        <span className="uppercase tracking-[0.2em] font-bold text-sm">Legal & Compliance</span>
                    </div>
                    <h1 className="text-5xl font-black text-white mb-6">Privacy Policy</h1>
                    <p className="text-xl text-crrfas-muted">Last updated: March 7, 2026</p>
                </div>

                <div className="space-y-10">
                    {sections.map((s, i) => (
                        <div key={i} className="glass-panel p-10 border-l-4 border-l-crrfas-cyan hover:border-r hover:border-crrfas-cyan/10 group">
                            <h2 className="text-2xl font-black text-white mb-4 text-glow group-hover:translate-x-1 transition-transform">{s.title}</h2>
                            <p className="text-crrfas-muted leading-relaxed text-sm md:text-base opacity-80">{s.content}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-16 p-8 rounded-2xl bg-crrfas-surface/30 border border-crrfas-surface">
                    <p className="text-crrfas-light">
                        For specific privacy inquiries related to your institution, please contact your college's ZencampuZ administrator or reach out to us at <span className="text-crrfas-cyan">privacy@crrfas.cloud</span>.
                    </p>
                </div>
            </div>
        </div>
    );
}
