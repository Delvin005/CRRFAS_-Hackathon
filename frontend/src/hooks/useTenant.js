import { useState, useEffect } from 'react';
import axios from 'axios';

export const useTenant = () => {
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch tenant branding based on current subdomain/domain
        const fetchTenant = async () => {
            try {
                const hostname = window.location.hostname;
                const parts = hostname.split('.');
                const subdomain = parts.length > 2 && parts[0] !== 'www' ? parts[0] : parts[0];

                // If loading from base localhost, assume global portal
                if (subdomain === 'localhost' || subdomain === '127') {
                    setTenant({
                        name: 'ZencampuZ Global',
                        subtitle: 'Resource & Facility Allocation',
                        primary_color: '#0DF5E3', // Cyan
                        logo: null,
                        isSpecific: false,
                        enabled_modules: ['core']
                    });
                    setLoading(false);
                    return;
                }

                // Fetch data for specific tenant subdomain
                try {
                    const response = await axios.get(`http://localhost:8000/api/tenants/current/?subdomain=${subdomain}`);
                    setTenant({
                        ...response.data,
                        isSpecific: true // Force flag to block global marketing pages
                    });
                } catch (apiError) {
                    console.error("Backend error fetching tenant. Falling back to specific defaults...", apiError);
                    // Fallback to specific if tenant fetch fails, but we are on a subdomain
                    setTenant({
                        name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1),
                        subtitle: 'Resource & Facility Allocation',
                        primary_color: '#0DF5E3', // Cyan
                        logo: null,
                        isSpecific: true, // Force flag to block global marketing pages
                        enabled_modules: ['core']
                    });
                }
            } catch (error) {
                console.error("Failed to load tenant branding.", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTenant();

    }, []);

    useEffect(() => {
        if (tenant) {
            const root = document.documentElement;
            const primaryHex = tenant.primary_color || '#0DF5E3';
            root.style.setProperty('--crrfas-primary', primaryHex);
            root.style.setProperty('--crrfas-cyan', primaryHex);

            const theme = tenant.theme || 'dark';
            if (theme === 'light') {
                root.style.setProperty('--crrfas-bg', '#F8FAFC');
                root.style.setProperty('--crrfas-surface', '#FFFFFF');
                root.style.setProperty('--crrfas-light', '#0F172A');
                root.style.setProperty('--crrfas-muted', '#64748B');
                root.style.setProperty('--crrfas-border', '#E2E8F0');
            } else {
                root.style.setProperty('--crrfas-bg', '#0B1026');
                root.style.setProperty('--crrfas-surface', '#1B2A4A');
                root.style.setProperty('--crrfas-light', '#F8FAFC');
                root.style.setProperty('--crrfas-muted', '#64748B');
                root.style.setProperty('--crrfas-border', '#CBD5E1');
            }
        }
    }, [tenant]);

    return { tenant, loading };
};
