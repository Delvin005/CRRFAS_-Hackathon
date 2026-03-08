import { Newspaper, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BlogPage() {
    const posts = [
        {
            tag: "Insight",
            title: "Solving the Faculty Double-Booking Crisis",
            date: "Mar 05, 2026",
            author: "Dr. Sarah Chen",
            excerpt: "How automated scheduling engines are saving admin teams 40+ hours per semester."
        },
        {
            tag: "Product",
            title: "Introducing Multi-Campus Resource Sync",
            date: "Feb 28, 2026",
            author: "Dev Team",
            excerpt: "Manage assets and rooms across multiple geographic locations from a single dashboard."
        },
        {
            tag: "Case Study",
            title: "Tech University's 300% Efficiency Gain",
            date: "Feb 15, 2026",
            author: "Success Team",
            excerpt: "Detailed deep-dive into how ZencampuZ transformed a legacy paper-based allocation system."
        }
    ];

    return (
        <div className="bg-crrfas-bg min-h-screen pt-32 pb-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-16">
                    <div>
                        <h1 className="text-5xl font-black text-white mb-4">The Campus Edge</h1>
                        <p className="text-xl text-crrfas-muted">Insights into modern academic operations and scaling institutional infrastructure.</p>
                    </div>
                    <div className="hidden lg:flex gap-2">
                        {['All', 'Product', 'Insights', 'Academic', 'Tech'].map(t => (
                            <button key={t} className="px-4 py-2 rounded-full border border-crrfas-surface text-xs text-crrfas-muted hover:border-crrfas-cyan hover:text-white transition-all">
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                    {posts.map((post, i) => (
                        <div key={i} className="glass-panel overflow-hidden group hover:border-crrfas-cyan/30">
                            <div className="h-48 bg-crrfas-bg relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-crrfas-cyan/20 to-transparent group-hover:scale-110 transition-transform duration-500 opacity-60" />
                                <div className="absolute top-4 left-4 bg-gradient-to-r from-crrfas-primary to-crrfas-cyan text-crrfas-bg text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">
                                    {post.tag}
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="flex items-center gap-4 text-[10px] text-crrfas-muted mb-4 uppercase tracking-[0.2em] font-bold opacity-60">
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                                    <span>By {post.author}</span>
                                </div>
                                <h3 className="text-xl font-black text-white mb-4 group-hover:text-crrfas-cyan transition-colors line-clamp-2 text-glow">
                                    {post.title}
                                </h3>
                                <p className="text-sm text-crrfas-muted leading-relaxed mb-10 line-clamp-3 opacity-80">
                                    {post.excerpt}
                                </p>
                                <button className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-widest group-hover:gap-4 transition-all">
                                    Read Article <ArrowRight className="w-4 h-4 text-crrfas-cyan" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Newsletter */}
                <div className="glass-panel p-12 text-center bg-gradient-to-r from-crrfas-bg to-crrfas-cyan/10">
                    <h2 className="text-3xl font-black text-white mb-4">Stay Synchronized</h2>
                    <p className="text-crrfas-muted mb-8 max-w-lg mx-auto">Get monthly deep-dives into facility optimization and campus tech trends straight to your inbox.</p>
                    <div className="flex max-w-md mx-auto gap-4">
                        <input className="input-field flex-grow" placeholder="Enter academic email" />
                        <button className="btn-primary whitespace-nowrap px-8">Subscribe</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
