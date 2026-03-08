import { useState } from 'react';
import ResourceAssetList from './ResourceAssetList';
import ResourceCategoryList from './ResourceCategoryList';
import LabInstrumentList from './LabInstrumentList';
import SubResourceUnitList from './SubResourceUnitList';
import RoomResourceMapping from './RoomResourceMapping';
import MaintenanceScheduler from './MaintenanceScheduler';
import ResourceBulkUpload from './ResourceBulkUpload';

export default function ResourcesDashboard() {
    const [activeTab, setActiveTab] = useState('assets');

    const tabs = [
        { id: 'assets', label: '🖥️ Assets & Equipment' },
        { id: 'categories', label: '📂 Categories' },
        { id: 'lab', label: '🔬 Lab Instruments' },
        { id: 'units', label: '🪑 Sub-Units' },
        { id: 'mapping', label: '🗺️ Room Mapping' },
        { id: 'maintenance', label: '🔧 Maintenance' },
        { id: 'bulk-upload', label: '📤 Bulk Upload' },
    ];

    return (
        <div className="space-y-6">
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-crrfas-light">Resource Management</h1>
                    <p className="text-crrfas-muted mt-1">Manage campus assets, lab equipment, and maintenance schedules.</p>
                </div>
            </header>

            {/* Tabs — horizontally scrollable on small screens */}
            <div className="flex gap-1 border-b border-crrfas-surface pb-px overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${activeTab === tab.id
                                ? 'bg-crrfas-surface text-crrfas-cyan border-t border-x border-crrfas-primary/30'
                                : 'text-crrfas-muted hover:text-crrfas-light hover:bg-crrfas-surface/50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Panels */}
            <div className="pt-4">
                {activeTab === 'assets' && <ResourceAssetList />}
                {activeTab === 'categories' && <ResourceCategoryList />}
                {activeTab === 'lab' && <LabInstrumentList />}
                {activeTab === 'units' && <SubResourceUnitList />}
                {activeTab === 'mapping' && <RoomResourceMapping />}
                {activeTab === 'maintenance' && <MaintenanceScheduler />}
                {activeTab === 'bulk-upload' && <ResourceBulkUpload />}
            </div>
        </div>
    );
}
