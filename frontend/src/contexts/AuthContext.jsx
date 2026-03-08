/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        bootstrapServerSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

    const bootstrapServerSession = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const res = await api.get('accounts/users/me/');
                setUser(res.data);
                return res.data;
            } catch (error) {
                console.error("Session expired", error);
                logout();
            }
        }
        setLoading(false);
        return null;
    };

    const login = async (email, password) => {
        const res = await api.post('accounts/auth/login/', { email, password });
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        return await bootstrapServerSession();
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
