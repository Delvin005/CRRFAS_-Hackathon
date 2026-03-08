import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useTenant } from '../hooks/useTenant';
import { Menu } from 'lucide-react';

export default function Topbar({ onMenuClick }) {
    const { user, logout } = useContext(AuthContext);
    const { tenant } = useTenant();

    return (
        <header className="h-16 glass-panel border-b-0 border-x-0 rounded-none px-4 sm:px-6 flex items-center justify-between z-10 sticky top-0">
            <div className="flex items-center gap-3 sm:gap-4">
                <button
                    onClick={onMenuClick}
                    className="md:hidden p-1 -ml-1 text-crrfas-muted hover:text-white transition-colors rounded-lg hover:bg-crrfas-surface"
                    aria-label="Open sidebar"
                >
                    <Menu className="w-6 h-6" />
                </button>
                {tenant?.logo && (
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-crrfas-bg border border-crrfas-surface shadow-inner hidden sm:flex shrink-0">
                        {tenant.logo.startsWith('http') || tenant.logo.startsWith('/') || tenant.logo.startsWith('data:') ? (
                            <img src={tenant.logo} alt="Logo" className="h-6 w-6 object-contain" />
                        ) : (
                            <span className="text-xl" role="img" aria-label="Logo">{tenant.logo}</span>
                        )}
                    </div>
                )}
                <h2 className="font-semibold text-lg" style={{ color: tenant?.primary_color || '#0DF5E3'}}>{tenant?.name || 'ZencampuZ Portal'}</h2>
            </div>

            <div className="flex items-center gap-4 border-l border-crrfas-bg pl-4">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-crrfas-light">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-crrfas-muted">{user?.email}</p>
                </div>
                <button onClick={logout} className="text-sm text-crrfas-danger hover:text-crrfas-danger/80 transition-colors">
                    Logout
                </button>
            </div>
        </header>
    );
}
