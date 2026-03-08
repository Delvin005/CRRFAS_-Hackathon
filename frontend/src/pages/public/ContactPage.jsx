import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
    const [status, setStatus] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus('Thanks for reaching out! Our team will get back to you shortly.');
    };

    return (
        <div className="bg-crrfas-bg flex flex-col pt-0 pb-4 overflow-hidden h-[calc(100vh-80px)]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col min-h-0 mt-6">
                <div className="text-center max-w-3xl mx-auto mb-4 animate-fade-in shrink-0">
                    <p className="text-xs font-black tracking-[0.3em] uppercase text-crrfas-cyan mb-1">Get In Touch</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-1">Let's Talk Campus OS</h1>
                    <p className="text-sm text-crrfas-muted">
                        Whether you need a custom demo, have pricing questions, or need support, our team is here to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0 pb-6">
                    {/* Contact Info */}
                    <div className="flex flex-col justify-center pr-2 mb-2">
                        <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest">Reach Us</h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 group">
                                <div className="w-11 h-11 bg-crrfas-bg border border-crrfas-surface rounded-xl flex items-center justify-center shrink-0 group-hover:border-crrfas-cyan/50 group-hover:scale-110 transition-all shadow-inner">
                                    <Mail className="w-5 h-5 text-crrfas-cyan" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white mb-1">Email Us</h3>
                                    <p className="text-crrfas-muted text-sm">sales@crrfas.edu</p>
                                    <p className="text-crrfas-muted text-sm">support@crrfas.edu</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 group">
                                <div className="w-11 h-11 bg-crrfas-bg border border-crrfas-surface rounded-xl flex items-center justify-center shrink-0 group-hover:border-crrfas-cyan/50 group-hover:scale-110 transition-all shadow-inner">
                                    <Phone className="w-5 h-5 text-crrfas-cyan" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white mb-1">Call Us</h3>
                                    <p className="text-crrfas-muted text-sm">+1 (800) 555-0100</p>
                                    <p className="text-crrfas-muted text-sm">Mon-Fri, 9am – 6pm EST</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 group">
                                <div className="w-11 h-11 bg-crrfas-bg border border-crrfas-surface rounded-xl flex items-center justify-center shrink-0 group-hover:border-crrfas-cyan/50 group-hover:scale-110 transition-all shadow-inner">
                                    <MapPin className="w-5 h-5 text-crrfas-cyan" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white mb-1">HQ Address</h3>
                                    <p className="text-crrfas-muted text-sm">123 Innovation Drive</p>
                                    <p className="text-crrfas-muted text-sm">Tech District, NY 10001</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form Container (Scrollable) */}
                    <div className="glass-panel p-6 border border-crrfas-surface/50 h-full overflow-y-auto custom-scrollbar rounded-xl">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {status && <div className="bg-crrfas-cyan/10 border border-crrfas-cyan/30 text-crrfas-cyan p-3 rounded-xl text-sm font-bold animate-pulse">{status}</div>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-crrfas-muted uppercase tracking-widest ml-1">First Name</label>
                                    <input required className="input-field w-full py-2" placeholder="Jane" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-crrfas-muted uppercase tracking-widest ml-1">Last Name</label>
                                    <input required className="input-field w-full py-2" placeholder="Doe" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-crrfas-muted uppercase tracking-widest ml-1">Work Email</label>
                                <input type="email" required className="input-field w-full py-2" placeholder="jane@university.edu" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-crrfas-muted uppercase tracking-widest ml-1">Institution Name</label>
                                <input required className="input-field w-full py-2" placeholder="State University" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-crrfas-muted uppercase tracking-widest ml-1">Message</label>
                                <textarea required rows="4" className="input-field w-full resize-none py-2" placeholder="How can we help you?"></textarea>
                            </div>
                            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-3 py-3 mt-1">
                                <Send className="w-5 h-5" /> Send Message
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
