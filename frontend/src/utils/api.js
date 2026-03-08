import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/', // Change for production
});

// Request interceptor to attach JWT token and Domain Tenant Header
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Auto-inject tenant subdomain or domain for backend resolution
    const hostname = window.location.hostname;
    config.headers['X-Tenant-Domain'] = hostname;

    return config;
});

export default api;
