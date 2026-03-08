import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import Logo from './Logo';
import { useTenant } from '../../hooks/useTenant';

export default function PublicNavbar() {
    const { tenant } = useTenant();
    const [isOpen, setIsOpen] = useState(false);

    const LINKS = [
        { label: 'Home', href: '/' },
        { label: 'Features', href: '/features' },
        { label: 'About Us', href: '/about' },
        { label: 'Contact', href: '/contact' }
    ];

    return (
        <nav className="fixed w-full z-50 bg-crrfas-bg/80 backdrop-blur-md border-b border-crrfas-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="bg-crrfas-bg border border-crrfas-surface p-2 rounded-xl group-hover:border-crrfas-cyan/50 transition-colors shadow-inner">
                            <div className="w-6 h-6 flex items-center justify-center text-xl">
                                {tenant?.logo || <Logo className="w-6 h-6" />}
                            </div>
                        </div>
                        <Link to="/" className="text-xl font-black text-white tracking-tighter hover:text-glow transition-all">
                            {tenant?.isSpecific ? tenant.name.split(' ')[0] : 'ZencampuZ'} {tenant?.isSpecific ? <span className="text-crrfas-cyan" style={{ color: tenant.primary_color }}>Portal</span> : ''}
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {LINKS.map(link => (
                            <Link key={link.href} to={link.href} className="text-xs font-bold uppercase tracking-[0.15em] text-crrfas-muted hover:text-crrfas-cyan transition-all">
                                {link.label}
                            </Link>
                        ))}
                        <div className="flex items-center gap-4 border-l border-crrfas-surface pl-8">
                            <Link
                                to="/login"
                                className="text-xs font-bold uppercase tracking-[0.15em] text-white hover:text-crrfas-cyan transition-all"
                                style={tenant?.isSpecific ? { color: tenant.primary_color } : {}}
                            >
                                Log In
                            </Link>
                            <Link
                                to="/pricing"
                                className="btn-primary flex items-center gap-2 text-xs px-6 py-2.5 uppercase tracking-widest"
                                style={tenant?.isSpecific ? { backgroundColor: tenant.primary_color } : {}}
                            >
                                View Pricing <span className="text-base leading-none">→</span>
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-crrfas-muted hover:text-white">
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-crrfas-bg border-b border-crrfas-surface">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {LINKS.map(link => (
                            <Link
                                key={link.href}
                                to={link.href}
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-2 text-base font-medium text-crrfas-muted hover:text-white hover:bg-crrfas-surface/50 rounded-md"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-4 mt-2 border-t border-crrfas-surface flex flex-col gap-2">
                            <Link
                                to="/login"
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-2 text-base font-bold text-white hover:bg-crrfas-surface/50 rounded-md text-center border border-crrfas-surface"
                                style={tenant?.isSpecific ? { color: tenant.primary_color, borderColor: `${tenant.primary_color}40` } : {}}
                            >
                                Log In (Existing)
                            </Link>
                            <Link
                                to="/pricing"
                                onClick={() => setIsOpen(false)}
                                className="block px-3 py-2 text-base font-bold text-black bg-crrfas-cyan hover:brightness-110 rounded-md text-center"
                                style={tenant?.isSpecific ? { backgroundColor: tenant.primary_color } : {}}
                            >
                                View Pricing (New)
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
