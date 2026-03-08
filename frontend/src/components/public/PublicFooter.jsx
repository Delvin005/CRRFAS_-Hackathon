import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import Logo from './Logo';
import { useTenant } from '../../hooks/useTenant';

export default function PublicFooter() {
    const { tenant } = useTenant();

    const accent = tenant?.isSpecific ? tenant.primary_color : '#0DF5E3';

    return (
        <footer className="bg-crrfas-bg border-t border-crrfas-surface">
            {/* Top bar */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-10">

                    {/* Brand col — spans 2 */}
                    <div className="md:col-span-2 flex flex-col gap-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-crrfas-surface bg-crrfas-surface/30">
                                {tenant?.logo || <Logo className="w-5 h-5 flex-shrink-0" glow={false} />}
                            </div>
                            <span className="text-lg font-black text-white tracking-tight">
                                {tenant?.isSpecific ? tenant.name.split(' ')[0] : 'ZencampuZ'}{' '}
                                {tenant?.isSpecific && <span style={{ color: accent }}>Portal</span>}
                            </span>
                        </div>

                        <p className="text-sm text-crrfas-muted leading-relaxed max-w-xs">
                            {tenant?.isSpecific
                                ? `Official facility and resource portal for ${tenant.name}. Powered by ZencampuZ Global SaaS.`
                                : 'Next-generation Campus Resource, Room and Facility Allocation System built for modern academic institutions.'
                            }
                        </p>

                        {/* Social icons */}
                        <div className="flex gap-3">
                            {[
                                { icon: <Twitter className="w-4 h-4" />, href: '#' },
                                { icon: <Github className="w-4 h-4" />, href: '#' },
                                { icon: <Linkedin className="w-4 h-4" />, href: '#' },
                                { icon: <Mail className="w-4 h-4" />, href: 'mailto:hello@zencampuz.com' },
                            ].map((s, i) => (
                                <a
                                    key={i}
                                    href={s.href}
                                    className="w-8 h-8 rounded-lg border border-crrfas-surface bg-crrfas-surface/20 flex items-center justify-center text-crrfas-muted hover:text-white hover:border-crrfas-cyan/40 hover:bg-crrfas-surface/50 transition-all"
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Spacer col */}
                    <div className="hidden md:block" />

                    {/* Product links */}
                    <div>
                        <h4 className="text-white font-bold mb-5 text-xs uppercase tracking-[0.2em]">Product</h4>
                        <ul className="space-y-3 text-sm text-crrfas-muted">
                            <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Legal links */}
                    <div>
                        <h4 className="text-white font-bold mb-5 text-xs uppercase tracking-[0.2em]">Legal</h4>
                        <ul className="space-y-3 text-sm text-crrfas-muted">
                            <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-crrfas-surface/50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-crrfas-muted/60">
                    <p>© 2026 {tenant?.isSpecific ? tenant.name : 'ZencampuZ'}. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Crafted with <span style={{ color: accent }} className="text-sm">♥</span> for Academic Excellence
                    </p>
                </div>
            </div>
        </footer>
    );
}
