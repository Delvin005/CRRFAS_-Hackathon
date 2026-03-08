import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

// ── Module Catalogue ─────────────────────────────────────────────────────────
// billingCycle: 'both' = monthly & yearly  |  'yearly' = annual contract only
export const ALL_MODULES = [
    {
        id: 'core',
        name: 'Core Platform',
        monthlyPrice: 199,
        yearlyPrice: 159,
        desc: 'Tenant isolation, basic reporting, user roles, and admin tools.',
        features: ['Complete Tenant Isolation', 'Basic Reporting', 'User Role Management', 'Admin Dashboard'],
        billingCycle: 'both',
        badge: null,
    },
    {
        id: 'facility',
        name: 'Facility Booking',
        monthlyPrice: 149,
        yearlyPrice: 119,
        desc: 'Complex approval workflows, room booking, and conflict resolution engine.',
        features: ['Complex Approval Workflows', 'Room Booking Engine', 'Conflict Resolution', 'Policy Engine'],
        billingCycle: 'both',
        badge: 'Popular',
    },
    {
        id: 'resource',
        name: 'Resource Management',
        monthlyPrice: 99,
        yearlyPrice: 79,
        desc: 'Assets, lab instruments, and inventory tracking across departments.',
        features: ['Asset Tracking', 'Lab Instruments', 'Inventory Management', 'Maintenance Logs'],
        billingCycle: 'both',
        badge: null,
    },
    {
        id: 'exam',
        name: 'Exam Operations',
        monthlyPrice: 129,
        yearlyPrice: 103,
        desc: 'Seating plans, invigilator assignment, and academic tracking.',
        features: ['Seating Plan Generator', 'Invigilator Assignments', 'Exam Timetabling', 'Academic Tracking'],
        billingCycle: 'both',
        badge: null,
    },
    {
        id: 'timetable',
        name: 'Timetabling Engine',
        monthlyPrice: null,
        yearlyPrice: 199,
        desc: 'AI-assisted auto-scheduling with faculty constraints and conflict resolution.',
        features: ['AI Auto-Scheduling', 'Faculty Constraint Engine', 'Conflict Resolution', 'Drag-and-Drop UI'],
        billingCycle: 'yearly',
        badge: 'Annual Only',
    },
    {
        id: 'analytics',
        name: 'Advanced Analytics',
        monthlyPrice: null,
        yearlyPrice: 159,
        desc: 'Custom BI dashboards, utilisation heatmaps, and predictive trend models.',
        features: ['Custom BI Dashboards', 'Utilization Heatmaps', 'Predictive Trend Models', 'Export Reports'],
        billingCycle: 'yearly',
        badge: 'Annual Only',
    },
    {
        id: 'research',
        name: 'Research Suite',
        monthlyPrice: null,
        yearlyPrice: 249,
        desc: 'Grant management, project tracking, publication indexing, and collaboration tools.',
        features: ['Grant Management', 'Project Tracking', 'Publication Indexing', 'Collaboration Tools'],
        billingCycle: 'yearly',
        badge: 'Annual Only',
    },
];

// Bundle price (all modules, yearly)
const BUNDLE_YEARLY = 999;
const BUNDLE_MONTHLY = 1249;

export const CartProvider = ({ children }) => {
    const [selectedModules, setSelectedModules] = useState([]);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const [totalPrice, setTotalPrice] = useState(0);

    // Expose as modulesData for backwards compatibility with Signup.jsx
    const modulesData = ALL_MODULES.map(m => ({
        id: m.id,
        name: m.name,
        price: billingCycle === 'yearly' ? m.yearlyPrice : (m.monthlyPrice ?? m.yearlyPrice),
        desc: m.desc,
    }));

    const toggleModule = (moduleId) => {
        const mod = ALL_MODULES.find(m => m.id === moduleId);
        if (!mod || mod.required) return;

        // Yearly-only modules can't be added if billing is monthly
        if (mod.billingCycle === 'yearly' && billingCycle === 'monthly') return;

        setSelectedModules(prev => {
            const next = prev.includes(moduleId)
                ? prev.filter(id => id !== moduleId)
                : [...prev, moduleId];
            return next;
        });
    };

    // When switching to monthly, drop yearly-only modules
    const switchBillingCycle = (cycle) => {
        setBillingCycle(cycle);
        if (cycle === 'monthly') {
            setSelectedModules(prev =>
                prev.filter(id => {
                    const mod = ALL_MODULES.find(m => m.id === id);
                    return mod?.billingCycle !== 'yearly';
                })
            );
        }
    };

    const selectBundle = () => {
        if (billingCycle === 'monthly') {
            setSelectedModules(ALL_MODULES.filter(m => m.billingCycle !== 'yearly').map(m => m.id));
        } else {
            setSelectedModules(ALL_MODULES.map(m => m.id));
        }
    };

    useEffect(() => {
        const isBundle = ALL_MODULES.every(m => selectedModules.includes(m.id));
        
        if (isBundle && billingCycle === 'yearly') {
            setTotalPrice(BUNDLE_YEARLY);
        } else {
            const total = selectedModules.reduce((acc, id) => {
                const mod = ALL_MODULES.find(m => m.id === id);
                if (!mod) return acc;
                const price = billingCycle === 'yearly' ? mod.yearlyPrice : (mod.monthlyPrice ?? mod.yearlyPrice);
                return acc + price;
            }, 0);
            setTotalPrice(billingCycle === 'yearly' ? total * 12 : total);
        }
    }, [selectedModules, billingCycle]);

    return (
        <CartContext.Provider value={{
            selectedModules,
            toggleModule,
            totalPrice,
            selectBundle,
            modulesData,
            billingCycle,
            switchBillingCycle,
            allModules: ALL_MODULES,
        }}>
            {children}
        </CartContext.Provider>
    );
};
