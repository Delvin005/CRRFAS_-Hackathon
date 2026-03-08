import { useState } from 'react';
import CampusList from './CampusList';
import BuildingList from './BuildingList';
import FloorList from './FloorList';
import RoomList from './RoomList';
import RoomTypeList from './RoomTypeList';
import FacilityTagList from './FacilityTagList';
import RoomBulkUpload from './RoomBulkUpload';

export default function FacilitiesDashboard() {
    const [activeTab, setActiveTab] = useState('campuses');

    const tabs = [
        { id: 'campuses', label: 'Campuses' },
        { id: 'buildings', label: 'Buildings' },
        { id: 'floors', label: 'Floors' },
        { id: 'rooms', label: 'Rooms' },
        { id: 'room-types', label: 'Room Types' },
        { id: 'facility-tags', label: 'Facility Tags' },
        { id: 'bulk-upload', label: 'Bulk Upload' }
    ];

    return (
        <div className="space-y-6">
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-crrfas-light">Facilities Management</h1>
                    <p className="text-crrfas-muted mt-1">Manage Campuses, Buildings, and Bookable Rooms.</p>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex space-x-2 border-b border-crrfas-surface pb-px overflow-x-auto whitespace-nowrap custom-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${activeTab === tab.id
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
                {activeTab === 'campuses' && <CampusList />}
                {activeTab === 'buildings' && <BuildingList />}
                {activeTab === 'floors' && <FloorList />}
                {activeTab === 'rooms' && <RoomList />}
                {activeTab === 'room-types' && <RoomTypeList />}
                {activeTab === 'facility-tags' && <FacilityTagList />}
                {activeTab === 'bulk-upload' && <RoomBulkUpload />}
            </div>
        </div>
    );
}
