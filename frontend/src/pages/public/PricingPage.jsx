import { useState } from 'react';
import { CheckCircle, ShoppingCart, ArrowRight, Lock, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const BADGE_STYLES = {
    'Popular': 'bg-crrfas-cyan/20 text-crrfas-cyan border-crrfas-cyan/30',
    'Annual Only': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function PricingPage() {
    const {
        selectedModules,
        toggleModule,
        totalPrice,
        selectBundle,
        allModules,
        billingCycle,
        switchBillingCycle,
    } = useCart();

    const monthlyModules = allModules.filter(m => m.billingCycle === 'both');
    const yearlyOnlyModules = allModules.filter(m => m.billingCycle === 'yearly');

    const getPrice = (mod) =>
        billingCycle === 'yearly' ? mod.yearlyPrice : (mod.monthlyPrice ?? null);

    const savings = (mod) => {
        if (!mod.monthlyPrice || !mod.yearlyPrice) return 0;
        return Math.round(((mod.monthlyPrice - mod.yearlyPrice) / mod.monthlyPrice) * 100);
    };

    const isLocked = (mod) => mod.billingCycle === 'yearly' && billingCycle === 'monthly';

    return (
        <div className="bg-crrfas-bg min-h-screen pt-16 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* ── Page Header ── */}
                <div className="text-center max-w-3xl mx-auto mb-10 animate-fade-in">
                    <p className="text-xs font-black tracking-[0.3em] uppercase text-crrfas-cyan mb-3">Modular Pricing</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                        Transparent, Modular Pricing
                    </h1>
                    <p className="text-base text-gray-400">
                        Build your campus OS module by module. Pay for the features you are selecting. Monthly and annual packs are available. switch to annual for exclusive enterprise modules.
                    </p>
                </div>

                {/* ── Billing Toggle ── */}
                <div className="flex justify-center mb-10">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 gap-1">
                        <button
                            onClick={() => switchBillingCycle('monthly')}
                            className={`px-8 py-3 rounded-xl text-sm font-extrabold uppercase tracking-widest transition-all ${billingCycle === 'monthly'
                                ? 'bg-crrfas-cyan text-black shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => switchBillingCycle('yearly')}
                            className={`px-8 py-3 rounded-xl text-sm font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === 'yearly'
                                ? 'bg-crrfas-cyan text-black shadow-lg'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Star className="w-4 h-4" />
                            Annual
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${billingCycle === 'yearly' ? 'bg-black/10 border-black/10 text-black' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                }`}>
                                Annual Pack
                            </span>
                        </button>
                    </div>
                </div>

                {/* ── Bundle Card ── */}
                <div className="mb-10">
                    <div className="relative rounded-3xl overflow-hidden glass-panel border border-crrfas-cyan/30 p-10 bg-gradient-to-br from-crrfas-bg via-crrfas-surface/20 to-crrfas-cyan/10">
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-crrfas-primary to-crrfas-cyan text-black font-black px-8 py-2 rounded-bl-3xl text-sm shadow-lg uppercase tracking-widest">
                            Best Value
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <p className="text-xs font-black text-crrfas-cyan uppercase tracking-widest mb-3">Complete Campus Kit</p>
                                <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Everything, Bundled</h2>
                                <p className="text-base text-gray-400 mb-8 leading-relaxed">
                                    All modules included — including Analytics, Timetabling, and Research Suite.
                                    Includes 24/7 support and unlimited users.
                                </p>
                                <div className="flex items-baseline gap-3 mb-2">
                                    <span className="text-5xl font-black text-white">
                                        {billingCycle === 'yearly' ? '$999' : `$${monthlyModules.reduce((acc, mod) => acc + (mod.monthlyPrice || 0), 0)}`}
                                    </span>
                                    <span className="text-crrfas-cyan font-bold text-lg">
                                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                                    </span>
                                </div>
                                {billingCycle === 'monthly' && (
                                    <p className="text-sm text-gray-500 mb-2">
                                        Annual bundles offer all enterprise modules.
                                    </p>
                                )}
                                {billingCycle === 'yearly' && (
                                    <p className="text-sm text-green-400 mb-2">
                                        Includes all enterprise modules ✓
                                    </p>
                                )}
                                <button
                                    onClick={selectBundle}
                                    className="btn-primary inline-flex items-center gap-2 mt-6"
                                >
                                    <Zap className="w-4 h-4" /> Claim Bundle
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {allModules.map((m) => (
                                    <div key={m.id} className="flex items-center gap-3 bg-crrfas-bg/40 backdrop-blur-sm p-4 rounded-2xl border border-crrfas-surface/50">
                                        <div className="bg-crrfas-cyan/20 p-1 rounded-full shrink-0">
                                            <CheckCircle className="w-4 h-4 text-crrfas-cyan" />
                                        </div>
                                        <span className="text-white font-semibold text-sm">{m.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Section: Monthly & Yearly Modules ── */}
                <div className="mb-16">
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">
                            {billingCycle === 'monthly' ? 'Monthly Modules' : 'All Modules — Annual'}
                        </h2>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {monthlyModules.map(mod => (
                            <ModuleCard
                                key={mod.id}
                                mod={mod}
                                price={getPrice(mod)}
                                billingCycle={billingCycle}
                                savings={savings(mod)}
                                selected={selectedModules.includes(mod.id)}
                                locked={isLocked(mod)}
                                onToggle={() => toggleModule(mod.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* ── Section: Yearly-Only Modules ── */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-3">
                        <h2 className="text-2xl font-black text-white uppercase tracking-widest">
                            Annual-Only Modules
                        </h2>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <p className="text-sm text-gray-500 mb-8">
                        These enterprise-grade modules are available exclusively on annual plans.
                        {billingCycle === 'monthly' && (
                            <> <button onClick={() => switchBillingCycle('yearly')} className="text-crrfas-cyan hover:underline ml-1">Switch to annual</button> to unlock them.</>
                        )}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {yearlyOnlyModules.map(mod => (
                            <ModuleCard
                                key={mod.id}
                                mod={mod}
                                price={billingCycle === 'yearly' ? mod.yearlyPrice : null}
                                billingCycle={billingCycle}
                                savings={0}
                                selected={selectedModules.includes(mod.id)}
                                locked={billingCycle === 'monthly'}
                                onToggle={() => toggleModule(mod.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Sticky Cart Bar ── */}
            {selectedModules.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-crrfas-bg/90 backdrop-blur-xl border-t border-white/5 z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                    <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-crrfas-cyan/10 rounded-2xl flex items-center justify-center relative">
                                <ShoppingCart className="w-6 h-6 text-crrfas-cyan" />
                                <span className="absolute -top-2 -right-2 bg-crrfas-cyan text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-crrfas-bg">
                                    {selectedModules.length}
                                </span>
                            </div>
                            <div>
                                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">
                                    Total — {billingCycle === 'yearly' ? 'Billed Annually' : 'Billed Monthly'}
                                </div>
                                <div className="text-2xl font-black text-white">
                                    ${totalPrice.toLocaleString()}
                                    <span className="text-sm font-bold text-gray-400 ml-1">
                                        /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Link
                            to="/signup"
                            className="btn-primary px-10 py-4 flex items-center gap-3 text-sm"
                        >
                            Proceed to Checkout <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Module Card Component ── */
function ModuleCard({ mod, price, billingCycle, savings, selected, locked, onToggle }) {
    return (
        <div className={`glass-panel p-7 border flex flex-col transition-all duration-300 relative overflow-hidden ${locked
            ? 'border-white/5 opacity-60'
            : selected
                ? 'border-crrfas-cyan bg-crrfas-cyan/5 shadow-[0_0_30px_rgba(13,245,227,0.1)]'
                : 'border-white/5 hover:border-crrfas-cyan/40'
            }`}>
            {/* Badge */}
            {mod.badge && (
                <span className={`absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${BADGE_STYLES[mod.badge] || ''}`}>
                    {mod.badge}
                </span>
            )}
            {selected && !locked && (
                <CheckCircle className="absolute top-4 right-4 w-5 h-5 text-crrfas-cyan" />
            )}

            <div className="flex-1 space-y-3 mb-6">
                <h3 className="text-lg font-black text-white pr-20">{mod.name}</h3>
                <ul className="text-sm text-gray-400 space-y-1 mt-2">
                    {mod.features?.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-crrfas-cyan rounded-full shrink-0" />
                            {feat}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Price */}
            <div className="mb-6">
                {locked ? (
                    <div className="flex items-center gap-2 text-amber-400">
                        <Lock className="w-4 h-4" />
                        <span className="text-sm font-bold">Annual plan required</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-white">${price}</span>
                            <span className="text-crrfas-cyan text-sm font-bold">
                                /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                            </span>
                        </div>
                        {billingCycle === 'yearly' && savings > 0 && (
                            <p className="text-xs text-crrfas-cyan/70 mt-1 font-semibold">
                                Annual Pack
                            </p>
                        )}
                    </>
                )}
            </div>

            <button
                onClick={onToggle}
                disabled={locked || mod.required}
                className={`w-full py-3.5 rounded-xl border font-extrabold uppercase text-xs tracking-widest transition-all ${locked
                    ? 'border-white/5 text-gray-600 cursor-not-allowed bg-white/[0.02]'
                    : selected
                        ? 'bg-crrfas-cyan text-black border-crrfas-cyan hover:brightness-110'
                        : mod.required
                            ? 'border-white/5 text-gray-600 cursor-not-allowed bg-white/[0.02]'
                            : 'border-white/10 text-gray-300 hover:border-crrfas-cyan hover:text-crrfas-cyan bg-white/[0.02]'
                    }`}
            >
                {locked ? 'Unlock with Annual' : mod.required ? 'Included' : selected ? '✓ Added' : 'Add Module'}
            </button>
        </div>
    );
}
