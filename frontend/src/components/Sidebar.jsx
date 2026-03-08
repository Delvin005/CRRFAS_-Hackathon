import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from './public/Logo';
import { useTenant } from '../hooks/useTenant';

export default function Sidebar({ isOpen, setIsOpen }) {
    const { user } = useContext(AuthContext);
    const { tenant } = useTenant();
    const location = useLocation();

    // Safely extract the primary role of the user on their tenant
    const roleName = user?.memberships?.[0]?.role || 'student';
    const enabledModules = tenant?.enabled_modules || ['core'];

    // Convert hex to rgb for rgba() usage
    const hex = tenant?.primary_color || '#0DF5E3';
    const r = parseInt(hex.slice(1, 3), 16) || 13;
    const g = parseInt(hex.slice(3, 5), 16) || 245;
    const b = parseInt(hex.slice(5, 7), 16) || 227;

    const asideStyle = tenant?.isSpecific 
        ? { backgroundColor: `rgba(${r}, ${g}, ${b}, 0.03)` } 
        : {};

    const getMenu = () => {
        const baseMenu = [
            { name: 'Dashboard', path: '/' },
            { name: 'Campus Calendar', path: '/calendar' },
        ];

        let menuList = [];
        switch (roleName) {
            case 'super_admin':
            case 'tenant_admin':
                menuList = [...baseMenu,
                { name: 'Campuses & Facilities', path: '/facilities' },
                { name: 'Resource Management', path: '/resources' },
                { name: 'New Request', path: '/request' },
                { name: 'My Bookings', path: '/bookings' },
                { name: 'Approval Inbox', path: '/approvals' },
                { name: 'Policy Admin', path: '/policies' },
                { name: 'User Directory', path: '/users' },
                { name: 'Settings', path: '/settings' }
                ];
                break;
            case 'facility_manager':
                menuList = [...baseMenu,
                { name: 'Resource Management', path: '/resources' },
                { name: 'New Request', path: '/request' },
                { name: 'My Bookings', path: '/bookings' },
                { name: 'Approval Inbox', path: '/approvals' }
                ];
                break;
            case 'academic_admin':
            case 'faculty':
                menuList = [...baseMenu,
                { name: 'New Request', path: '/request' },
                { name: 'My Bookings', path: '/bookings' }
                ];
                break;
            default: // Student
                menuList = [...baseMenu,
                { name: 'New Request', path: '/request' },
                { name: 'My Bookings', path: '/bookings' }
                ];
        }

        return menuList.filter(item => {
            if (item.name === 'Campuses & Facilities') return enabledModules.includes('facilities');
            if (item.name === 'Resource Management') return enabledModules.includes('resources');
            if (['New Request', 'My Bookings', 'Approval Inbox'].includes(item.name)) return enabledModules.includes('bookings');
            return true;
        });
    };

    const menuItems = getMenu();

    return (
        <>
            {/* Mobile Overlay Background */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen?.(false)}
                />
            )}

            {/* Sidebar drawer */}
            <aside 
                 style={asideStyle}
                 className={`
                fixed inset-y-0 left-0 z-50 w-72 border-r border-crrfas-surface/50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                md:relative md:w-64 md:translate-x-0
                ${!tenant?.isSpecific ? 'bg-crrfas-bg' : 'backdrop-blur-3xl'}
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-crrfas-surface">
                    <div className="flex items-center gap-2">
                        {tenant?.logo ? (
                            <img src={tenant.logo} alt="Logo" className="w-auto h-6 object-contain rounded-sm" />
                        ) : (
                            <Logo className="w-6 h-6 shrink-0" color={tenant?.primary_color || '#0DF5E3'} />
                        )}
                        <span className="text-xl font-black text-crrfas-light tracking-tight truncate">
                            ZencampuZ <span className="font-semibold text-crrfas-light">Portal</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setIsOpen?.(false)}
                        className="md:hidden text-crrfas-muted hover:text-white"
                        aria-label="Close sidebar"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {menuItems.map(item => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`block px-4 py-3 rounded-lg transition-colors ${isActive ? 'text-crrfas-light bg-crrfas-surface border' : 'text-crrfas-muted hover:text-crrfas-light hover:bg-crrfas-surface/50'}`}
                                style={isActive ? { borderColor: `${tenant?.primary_color || '#0DF5E3'}50`, backgroundColor: `${tenant?.primary_color || '#0DF5E3'}20` } : {}}
                            >
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-crrfas-surface text-sm bg-crrfas-surface/30">
                    <p className="text-xs text-crrfas-muted uppercase tracking-wider mb-1">Session Active</p>
                    <p className="text-crrfas-cyan font-bold capitalize">{roleName.replace('_', ' ')}</p>
                </div>
            </aside>
        </>
    );
}
