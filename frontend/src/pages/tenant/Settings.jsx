import { useState, useEffect } from 'react';
import { useTenant } from '../../hooks/useTenant';
import api from '../../utils/api';
import { Save, Image as ImageIcon, Briefcase, Paintbrush } from 'lucide-react';

export default function Settings() {
    const { tenant, loading } = useTenant();
    
    const [name, setName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#0DF5E3');
    const [theme, setTheme] = useState('dark');
    const [logo, setLogo] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (tenant) {
            setName(tenant.name || '');
            setPrimaryColor(tenant.primary_color || '#0DF5E3');
            setTheme(tenant.theme || 'dark');
            setLogoPreview(tenant.logo || null);
        }
    }, [tenant]);

    if (loading) return null;

    if (!tenant?.isSpecific) {
        return (
            <div className="p-8 text-center text-crrfas-muted">
                <p>Global settings are managed elsewhere.</p>
            </div>
        );
    }

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('name', name);
        formData.append('primary_color', primaryColor);
        formData.append('theme', theme);
        if (logo) {
            formData.append('logo', logo);
        }

        try {
            await api.patch('tenants/update/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Brand settings updated successfully! Refreshing...' });
            
            // Reload window to apply new colors everywhere
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Failed to update tenant settings', error);
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update settings.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-crrfas-light tracking-tight">Portal Settings</h1>
                <p className="text-crrfas-muted text-sm mt-1">Manage your institution's name and branding.</p>
            </div>

            <form onSubmit={handleSave} className="bg-crrfas-surface/40 backdrop-blur-xl border border-crrfas-surface/50 rounded-2xl shadow-lg p-6 space-y-6">
                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-semibold border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                {/* Institution Name */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <Briefcase className="w-4 h-4 text-crrfas-cyan" style={{color: tenant.primary_color}} />
                        Institution Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-field w-full"
                        required
                    />
                </div>

                {/* Primary Color */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <Paintbrush className="w-4 h-4 text-crrfas-cyan" style={{color: tenant.primary_color}} />
                        Primary Brand Color
                    </label>
                    <div className="flex gap-4 items-center">
                        <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="w-12 h-12 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="input-field w-32 font-mono uppercase"
                            pattern="^#[0-9a-fA-F]{6}$"
                            required
                        />
                    </div>
                </div>

                {/* Theme Mode */}
                <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-crrfas-light">
                        Theme Mode
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-crrfas-muted cursor-pointer">
                            <input 
                                type="radio" 
                                name="themeMode" 
                                value="dark" 
                                checked={theme === 'dark'} 
                                onChange={() => setTheme('dark')}
                                className="w-4 h-4 text-crrfas-primary focus:ring-crrfas-primary"
                            />
                            Dark Mode
                        </label>
                        <label className="flex items-center gap-2 text-crrfas-muted cursor-pointer">
                            <input 
                                type="radio" 
                                name="themeMode" 
                                value="light" 
                                checked={theme === 'light'} 
                                onChange={() => setTheme('light')}
                                className="w-4 h-4 text-crrfas-primary focus:ring-crrfas-primary"
                            />
                            Light Mode
                        </label>
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                        <ImageIcon className="w-4 h-4 text-crrfas-cyan" style={{color: tenant.primary_color}} />
                        College Logo
                    </label>
                    
                    <div className="flex items-center gap-6">
                        {logoPreview ? (
                            <img src={logoPreview} alt="Logo Preview" className="h-16 w-auto object-contain bg-white/5 disabled rounded-lg p-2 border border-white/10" />
                        ) : (
                            <div className="h-16 w-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 text-xs text-center p-2">
                                No Logo
                            </div>
                        )}
                        
                        <input
                            type="file"
                            accept="image/png, image/jpeg, image/svg+xml"
                            onChange={handleLogoChange}
                            className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-crrfas-cyan/10 file:text-crrfas-cyan hover:file:bg-crrfas-cyan/20 cursor-pointer"
                        />
                    </div>
                    <p className="text-xs text-gray-500">Supported formats: PNG, JPG, SVG. Transparent background recommended.</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 px-8"
                        style={{ backgroundColor: tenant.primary_color || '#0DF5E3', color: '#0a0f1a' }}
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
