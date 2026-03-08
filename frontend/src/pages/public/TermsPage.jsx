import { Gavel, CheckCircle, AlertCircle } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="bg-crrfas-bg min-h-screen pt-32 pb-40">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-16">
                    <div className="flex items-center gap-3 text-crrfas-cyan mb-4">
                        <Gavel className="w-8 h-8" />
                        <span className="uppercase tracking-[0.2em] font-bold text-sm">Terms & Conditions</span>
                    </div>
                    <h1 className="text-5xl font-black text-white mb-6">Terms of Service</h1>
                    <p className="text-xl text-crrfas-muted">By using ZencampuZ, you agree to these fundamental operational rules.</p>
                </div>

                <div className="glass-panel p-12 space-y-12 prose prose-invert max-w-none border border-crrfas-surface/50">
                    <section className="group">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3 text-glow transition-transform group-hover:translate-x-1">
                            <CheckCircle className="w-6 h-6 text-crrfas-cyan" /> 1. Operational Use
                        </h2>
                        <p className="text-crrfas-muted leading-relaxed opacity-80 pl-9">
                            ZencampuZ is provided as a SaaS tool for academic resource allocation. You must not use the system for any illegal activities or to disrupt campus operations of other tenants.
                        </p>
                    </section>

                    <section className="group">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3 text-glow transition-transform group-hover:translate-x-1">
                            <CheckCircle className="w-6 h-6 text-crrfas-cyan" /> 2. Fair Usage
                        </h2>
                        <p className="text-crrfas-muted leading-relaxed opacity-80 pl-9">
                            Our API and resource engine have fair usage limits based on your subscription. Automated scraping or intensive stress-testing without prior consent is prohibited.
                        </p>
                    </section>

                    <section className="group">
                        <h2 className="text-2xl font-black text-white flex items-center gap-3 text-glow transition-transform group-hover:translate-x-1">
                            <AlertCircle className="w-6 h-6 text-crrfas-primary" /> 3. Liability
                        </h2>
                        <p className="text-crrfas-muted leading-relaxed opacity-80 pl-9">
                            While we maintain 99.9% uptime, ZencampuZ is not liable for academic delays caused by force majeure or scheduled maintenance windows. Backup of data remains the joint responsibility of the tenant.
                        </p>
                    </section>

                    <section className="bg-crrfas-bg/50 p-6 rounded-2xl border border-crrfas-surface/30 shadow-inner">
                        <p className="text-xs italic text-crrfas-muted m-0 opacity-60">
                            Failure to comply with these terms may result in temporary suspension of institutional access.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
