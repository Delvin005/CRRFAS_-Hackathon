import { Outlet } from 'react-router-dom';
import { useTenant } from '../hooks/useTenant';

export default function AuthLayout() {
    const { tenant, loading } = useTenant();

    if (loading) return null;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-crrfas-bg p-4">
            {/* Background glowing orbs */}
            <div
                className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full blur-[120px] opacity-20"
                style={{ backgroundColor: tenant?.primary_color || '#0DF5E3' }}
            ></div>
            <div
                className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full blur-[120px] opacity-20"
                style={{ backgroundColor: tenant?.primary_color || '#0DF5E3' }}
            ></div>

            <div className="z-10 w-full max-w-md p-8 glass-panel border border-crrfas-surface/50 shadow-2xl">
                <div className="text-center mb-10">
                    <div className="text-4xl mb-4">{tenant?.logo}</div>
                    <h1
                        className="text-3xl font-bold bg-clip-text text-transparent"
                        style={{ backgroundImage: `linear-gradient(to right, ${tenant?.primary_color || '#0DF5E3'}, #ffffff)` }}
                    >
                        {tenant?.name}
                    </h1>
                    <p className="text-crrfas-muted mt-2">{tenant?.subtitle}</p>
                </div>

                <Outlet />
            </div>
        </div>
    );
}
