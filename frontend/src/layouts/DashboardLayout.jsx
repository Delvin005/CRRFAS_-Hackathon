import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useTenant } from '../hooks/useTenant';

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { tenant } = useTenant();

    // Convert hex to rgb for rgba() usage
    const hex = tenant?.primary_color || '#0DF5E3';
    const r = parseInt(hex.slice(1, 3), 16) || 13;
    const g = parseInt(hex.slice(3, 5), 16) || 245;
    const b = parseInt(hex.slice(5, 7), 16) || 227;

    const customBg = tenant?.isSpecific ? {
        backgroundImage: `
            radial-gradient(circle at 0% 0%, rgba(${r}, ${g}, ${b}, 0.25) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(${r}, ${g}, ${b}, 0.25) 0%, transparent 50%),
            linear-gradient(to bottom right, transparent, rgba(${r}, ${g}, ${b}, 0.1))
        `
    } : {};

    return (
        <div className="flex h-screen overflow-hidden text-crrfas-light bg-crrfas-bg transition-colors duration-500" style={customBg}>
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            <div className="flex-1 flex flex-col relative overflow-hidden bg-crrfas-surface/10">
                <Topbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
