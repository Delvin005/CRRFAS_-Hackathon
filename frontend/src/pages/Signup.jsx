import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CreditCard, ShieldCheck, Tag, ArrowRight, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:8000/api';

export function Signup() {
    const { selectedModules, totalPrice, modulesData } = useCart();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationCode, setVerificationCode] = useState('');

    const [form, setForm] = useState({
        institutionName: '',
        subdomain: '',
        adminName: '',
        email: '',
        password: '',
        brandColor: '#0DF5E3',
    });

    const [isSubdomainChecking, setIsSubdomainChecking] = useState(false);
    const [subdomainError, setSubdomainError] = useState('');

    // Auto-generate subdomain from institution name
    useEffect(() => {
        // Only auto-generate if the user hasn't explicitly typed a custom subdomain
        if (!form.institutionName) return;
        
        const generatedSlug = form.institutionName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
            .replace(/(^-|-$)+/g, ''); // remove leading/trailing hyphens

        update('subdomain', generatedSlug);
    }, [form.institutionName]);

    // Validation check whenever subdomain changes
    useEffect(() => {
        if (!form.subdomain) {
            setSubdomainError('');
            return;
        }

        const checkAvailability = async () => {
            setIsSubdomainChecking(true);
            try {
                // If the check returns 200, it's already taken
                const res = await axios.get(`${API}/tenants/current/?subdomain=${form.subdomain}`);
                if (res.data && res.data.name) {
                    setSubdomainError('This subdomain is already taken. Please choose another.');
                }
            } catch (err) {
                // 404 means the subdomain is available
                if (err.response?.status === 404) {
                    setSubdomainError('');
                } else {
                    setSubdomainError('Error checking subdomain availability.');
                }
            } finally {
                setIsSubdomainChecking(false);
            }
        };

        const timerId = setTimeout(checkAvailability, 500);
        return () => clearTimeout(timerId);
    }, [form.subdomain]);

    // Load Razorpay
    useEffect(() => {
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.async = true;
        document.body.appendChild(s);
    }, []);

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleStep1 = async e => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await axios.post(`${API}/accounts/otp/send/`, { email: form.email });
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStep2 = async e => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await axios.post(`${API}/accounts/otp/verify/`, { email: form.email, otp: verificationCode });
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayment = () => {
        const options = {
            key: 'rzp_test_6fwqFFPoR210Wf',
            amount: totalPrice * 100,
            currency: 'INR',
            name: 'ZencampuZ',
            description: `Subscription — ${form.institutionName}`,
            async handler(response) {
                console.log('Payment success:', response);
                try {
                    // Provision the tenant + admin user on the backend
                    const res = await axios.post(`${API}/tenants/provision/`, {
                        institution_name: form.institutionName,
                        subdomain: form.subdomain,
                        contact_email: form.email,
                        admin_full_name: form.adminName,
                        password: form.password,
                        primary_color: form.brandColor,
                        modules: selectedModules,
                    });
                    // Store tokens so the login page can use them directly
                    localStorage.setItem('access_token', res.data.tokens.access);
                    localStorage.setItem('refresh_token', res.data.tokens.refresh);
                    localStorage.setItem('user_role', 'tenant_admin');
                    localStorage.setItem('enabled_modules', JSON.stringify(res.data.tenant.enabled_modules));
                    // Redirect to the tenant subdomain login with tokens to bridge the cross-origin localStorage gap
                    const subdomain = form.subdomain || 'app';
                    const protocol = window.location.protocol;
                    const port = window.location.port ? `:${window.location.port}` : '';
                    const domain = window.location.hostname.includes('localhost') ? 'localhost' : window.location.hostname;
                    window.location.href = `${protocol}//${subdomain}.${domain}${port}/login?access=${res.data.tokens.access}&refresh=${res.data.tokens.refresh}`;
                } catch (err) {
                    console.error('Provisioning failed:', err);
                    alert('Payment was received but account provisioning failed. Please contact support.');
                }
            },
            prefill: { name: form.adminName, email: form.email },
            theme: { color: form.brandColor || '#0DF5E3' },
        };
        new window.Razorpay(options).open();
    };

    /* ── STEP LABELS ── */
    const stepLabel = ['', 'Registration', 'Verify Email', 'Payment'][step];

    return (
        <div className="min-h-screen bg-[#0a0f1a] flex flex-col lg:flex-row">


            {/* ══════════════════════════════════════════
                LEFT PANEL — FORM
            ══════════════════════════════════════════ */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto px-8 py-14 lg:px-16 lg:py-20 space-y-12">

                    {/* Brand */}
                    <div>
                        <Link to="/" className="inline-flex items-center gap-2 mb-10 opacity-60 hover:opacity-100 transition">
                            <span className="text-crrfas-cyan font-black tracking-widest text-sm uppercase">← ZencampuZ</span>
                        </Link>
                        {/* Progress */}
                        <div className="flex items-center gap-3 mb-8">
                            {[1, 2, 3].map(n => (
                                <div key={n} className="flex items-center gap-3">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border transition-all ${step > n ? 'bg-crrfas-cyan border-crrfas-cyan text-black' :
                                        step === n ? 'border-crrfas-cyan text-crrfas-cyan' :
                                            'border-white/10 text-white/20'
                                        }`}>
                                        {step > n ? '✓' : n}
                                    </div>
                                    {n < 3 && <div className={`h-px w-12 ${step > n ? 'bg-crrfas-cyan' : 'bg-white/10'}`} />}
                                </div>
                            ))}
                            <span className="ml-3 text-xs text-white/40 uppercase tracking-widest font-semibold">{stepLabel}</span>
                        </div>

                        <h1 className="text-4xl font-extrabold text-white tracking-tight">
                            {step === 1 && 'Create your account'}
                            {step === 2 && 'Verify your email'}
                            {step === 3 && 'Complete payment'}
                        </h1>
                        <p className="text-gray-400 mt-2 text-base">
                            {step === 1 && 'Set up your institution and admin credentials.'}
                            {step === 2 && `We emailed a 6-digit code to ${form.email}`}
                            {step === 3 && 'Review your plan and pay securely via Razorpay.'}
                        </p>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* ── STEP 1: Registration Form ── */}

                    {step === 1 && (
                        <form onSubmit={handleStep1} className="space-y-8">
                            <Section title="Institution">
                                <Field label="Institution Name" required>
                                    <input
                                        type="text" required placeholder="e.g. MIT — India Campus"
                                        className="input-checkout"
                                        value={form.institutionName}
                                        onChange={e => update('institutionName', e.target.value)}
                                    />
                                </Field>
                                <Field label="Subdomain">
                                    <div className={`flex rounded-xl overflow-hidden border transition ${subdomainError ? 'border-red-500/50 focus-within:border-red-500' : 'border-white/10 focus-within:border-crrfas-cyan'}`}>
                                        <input
                                            type="text" required placeholder="mit-india"
                                            className="flex-1 bg-white/[0.03] text-white px-4 py-3.5 outline-none placeholder-white/20 text-sm"
                                            value={form.subdomain}
                                            onChange={e => update('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ''))}
                                        />
                                        <span className="px-4 py-3.5 bg-white/5 text-white/30 text-sm font-mono border-l border-white/10 select-none">.crrfas.edu</span>
                                    </div>
                                    {isSubdomainChecking && <p className="text-xs text-crrfas-cyan mt-1 animate-pulse">Checking availability...</p>}
                                    {subdomainError && <p className="text-xs text-red-400 mt-1">{subdomainError}</p>}
                                    {!subdomainError && !isSubdomainChecking && form.subdomain && (
                                        <p className="text-xs text-green-400 mt-1">✓ Subdomain available</p>
                                    )}
                                </Field>
                                <Field label="Brand Colour">
                                    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.03]">
                                        <div className="w-10 h-10 rounded-lg shadow-lg flex-shrink-0 border border-white/10" style={{ backgroundColor: form.brandColor }} />
                                        <div className="flex-1">
                                            <input type="color" value={form.brandColor}
                                                onChange={e => update('brandColor', e.target.value)}
                                                className="w-full h-1.5 rounded-full cursor-pointer appearance-none bg-white/10"
                                            />
                                        </div>
                                        <span className="text-xs font-mono text-white/30 uppercase">{form.brandColor}</span>
                                    </div>
                                </Field>
                            </Section>

                            <Section title="Administrator Account">
                                <Field label="Full Name" required>
                                    <input type="text" required placeholder="Dr. Jane Smith"
                                        className="input-checkout"
                                        value={form.adminName}
                                        onChange={e => update('adminName', e.target.value)}
                                    />
                                </Field>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <Field label="Email Address" required>
                                        <input type="email" required placeholder="admin@institution.edu"
                                            className="input-checkout"
                                            value={form.email}
                                            autoComplete="off"
                                            onChange={e => update('email', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Password" required>
                                        <input type="password" required placeholder="••••••••"
                                            className="input-checkout"
                                            value={form.password}
                                            autoComplete="new-password"
                                            onChange={e => update('password', e.target.value)}
                                        />
                                    </Field>
                                </div>
                            </Section>

                            <button type="submit" disabled={isLoading || isSubdomainChecking || !!subdomainError}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-crrfas-cyan text-black font-extrabold text-sm uppercase tracking-widest hover:brightness-110 active:scale-[.98] transition disabled:opacity-50 disabled:cursor-not-allowed">
                                {isLoading ? 'Please wait…' : 'Continue'}
                                {!isLoading && <ArrowRight className="w-4 h-4" />}
                            </button>

                            <p className="text-center text-xs text-gray-500">
                                Already have an account?{' '}
                                <Link to="/login" className="text-crrfas-cyan hover:underline">Sign in</Link>
                            </p>
                        </form>
                    )}

                    {/* ── STEP 2: Verify Email ── */}
                    {step === 2 && (
                        <form onSubmit={handleStep2} className="space-y-8">
                            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] text-center space-y-6">
                                <div className="w-16 h-16 rounded-full bg-crrfas-cyan/10 flex items-center justify-center mx-auto">
                                    <ShieldCheck className="w-8 h-8 text-crrfas-cyan" />
                                </div>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    Enter the 6-digit code we sent to <br />
                                    <span className="text-white font-semibold">{form.email}</span>
                                </p>
                                <input
                                    type="text" required maxLength={6} placeholder="0 0 0 0 0 0"
                                    className="w-full text-center text-4xl tracking-[0.5em] font-black bg-transparent border-b-2 border-white/10 focus:border-crrfas-cyan text-white py-4 outline-none transition"
                                    value={verificationCode}
                                    onChange={e => setVerificationCode(e.target.value)}
                                />
                            </div>

                            <button type="submit" disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-crrfas-cyan text-black font-extrabold text-sm uppercase tracking-widest hover:brightness-110 transition disabled:opacity-50">
                                {isLoading ? 'Verifying…' : 'Verify & Continue'}
                                {!isLoading && <ArrowRight className="w-4 h-4" />}
                            </button>
                            <div className="flex flex-col gap-3 items-center">
                                <button type="button"
                                    onClick={async () => {
                                        setError('');
                                        setIsLoading(true);
                                        try {
                                            await axios.post(`${API}/accounts/otp/send/`, { email: form.email });
                                            setError('');
                                        } catch (err) {
                                            setError(err.response?.data?.error || 'Failed to resend OTP.');
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    className="text-xs text-crrfas-cyan hover:underline transition disabled:opacity-40"
                                    disabled={isLoading}
                                >
                                    Didn't receive it? Resend code
                                </button>
                                <button type="button" onClick={() => { setStep(1); setError(''); }}
                                    className="text-xs text-gray-500 hover:text-white transition">
                                    ← Go back and edit details
                                </button>
                            </div>
                        </form>
                    )}


                    {/* ── STEP 3: Payment ── */}
                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <CreditCard className="w-5 h-5 text-crrfas-cyan flex-shrink-0" />
                                    Payments processed securely by <span className="text-white font-semibold ml-1">Razorpay</span>
                                </div>

                                <div className="space-y-3">
                                    {selectedModules.map(mid => {
                                        const mod = modulesData.find(m => m.id === mid);
                                        return (
                                            <div key={mid} className="flex justify-between items-center py-2 border-b border-white/5">
                                                <div>
                                                    <p className="text-white text-sm font-semibold">{mod?.name}</p>
                                                    <p className="text-xs text-gray-500">{mid === 'core' ? 'Core module' : 'Extension'}</p>
                                                </div>
                                                <span className="text-white font-mono text-sm">${mod?.price}<span className="text-gray-500 text-xs">/mo</span></span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-gray-400 text-sm">Total due today</span>
                                    <span className="text-2xl font-black text-crrfas-cyan">${totalPrice}<span className="text-sm font-normal text-gray-500">/mo</span></span>
                                </div>
                            </div>

                            <button onClick={handlePayment}
                                className="w-full flex items-center justify-center gap-3 py-5 rounded-xl bg-crrfas-cyan text-black font-extrabold text-base uppercase tracking-widest hover:brightness-110 active:scale-[.98] transition shadow-[0_8px_32px_rgba(13,245,227,0.25)]">
                                <CreditCard className="w-5 h-5" />
                                Pay ₹{totalPrice * 83} with Razorpay
                            </button>

                            <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                                <ShieldCheck className="w-4 h-4" /> 256-bit SSL encryption · Powered by Razorpay
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════
                RIGHT PANEL — ORDER SUMMARY
            ══════════════════════════════════════════ */}
            <div className="hidden lg:flex w-[420px] flex-shrink-0 bg-[#080d18] border-l border-white/5 flex-col">
                <div className="sticky top-0 h-screen flex flex-col p-12 overflow-y-auto">

                    <div className="mb-10">
                        <div className="flex items-center gap-2 text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">
                            <Tag className="w-4 h-4" /> Order Summary
                        </div>
                        <h2 className="text-xl font-extrabold text-white">Your Selected Plan</h2>
                    </div>

                    {/* Module list */}
                    <div className="flex-1 space-y-5">
                        {selectedModules.length === 0 && (
                            <p className="text-sm text-gray-600 italic">No modules selected. <Link to="/pricing" className="text-crrfas-cyan hover:underline">Go to Pricing</Link></p>
                        )}
                        {selectedModules.map(mid => {
                            const mod = modulesData.find(m => m.id === mid);
                            return (
                                <div key={mid} className="flex justify-between items-start gap-4 pb-5 border-b border-white/5 last:border-0">
                                    <div>
                                        <p className="text-white font-semibold text-sm">{mod?.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{mod?.desc}</p>
                                    </div>
                                    <span className="text-white font-mono text-sm flex-shrink-0">${mod?.price}<span className="text-gray-600 text-xs">/mo</span></span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Totals */}
                    <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Subtotal</span>
                            <span>${totalPrice}/mo</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Setup fee</span>
                            <span className="text-green-400 font-semibold">Waived</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-white font-bold text-lg">Total</span>
                            <div className="text-right">
                                <p className="text-3xl font-black text-crrfas-cyan">${totalPrice}</p>
                                <p className="text-xs text-gray-500">billed monthly</p>
                            </div>
                        </div>
                    </div>

                    {/* Trust */}
                    <div className="mt-8 p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-crrfas-cyan text-sm font-semibold">
                            <ShieldCheck className="w-4 h-4" /> Secure & Flexible
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            Cancel or upgrade anytime. No hidden fees. Powered by Razorpay's PCI-DSS compliant payment gateway.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Reusable field wrappers ── */
function Section({ title, children }) {
    return (
        <div className="space-y-5">
            <h3 className="text-xs font-black uppercase tracking-[0.25em] text-gray-500">{title}</h3>
            <div className="space-y-5">{children}</div>
        </div>
    );
}

function Field({ label, children, required }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400">
                {label}{required && <span className="text-crrfas-cyan ml-0.5">*</span>}
            </label>
            {children}
        </div>
    );
}

export default Signup;
