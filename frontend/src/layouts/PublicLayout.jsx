import { Outlet, Navigate } from 'react-router-dom';
import PublicNavbar from '../components/public/PublicNavbar';
import PublicFooter from '../components/public/PublicFooter';
import { useTenant } from '../hooks/useTenant';

export default function PublicLayout() {
    const { tenant, loading } = useTenant();

    // Completely disable the marketing site on tenant subdomains
    if (loading) {
        return (
            <div className="min-h-screen bg-crrfas-bg flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-crrfas-cyan border-t-transparent animate-spin" />
            </div>
        );
    }

    if (tenant?.isSpecific) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-crrfas-bg font-sans selection:bg-crrfas-cyan/30 text-crrfas-light">
            <PublicNavbar />
            <main className="flex-grow pt-20">
                <Outlet />
            </main>
            <PublicFooter />
        </div>
    );
}
