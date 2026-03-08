import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { ReportPage, ReportFilterBar, SummaryCard, BarChart, ReportTable, ReportLoading } from './ReportComponents';

const DARK_PANEL = { backgroundColor: '#1e293b', borderColor: '#334155' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

export default function RoomUtilizationReport() {
  const [filters, setFilters] = useState({ start_date: monthAgoStr(), end_date: todayStr() });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ENDPOINTS.reports.roomUtilization, { params: f });
      setData(res.data?.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const avgUtil = data.length ? (data.reduce((s, d) => s + d.utilization_pct, 0) / data.length).toFixed(1) : 0;
  const totalHrs = data.reduce((s, d) => s + d.booked_hours, 0).toFixed(1);
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const csvUrl = `${apiBase}/reports/room-utilization/?format=csv&start_date=${filters.start_date}&end_date=${filters.end_date}`;

  return (
    <ReportPage title="Room Utilization" subtitle="How much of each room's available time is being booked and used.">
      <ReportFilterBar filters={filters} onChange={setFilters} onRefresh={() => load()} exportUrl={csvUrl} />

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total Rooms" value={data.length} color="blue" />
        <SummaryCard label="Avg Utilization" value={`${avgUtil}%`} color="green" />
        <SummaryCard label="Total Booked Hours" value={totalHrs} color="amber" />
      </div>

      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        <h3 className="font-semibold text-white mb-4">Utilization by Room (Top 15)</h3>
        {loading ? <ReportLoading /> : <BarChart rows={data} labelKey="room" valueKey="utilization_pct" unit="%" color="#3b82f6" />}
      </div>

      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        <h3 className="font-semibold text-white mb-4">Room Details</h3>
        {loading ? <ReportLoading /> : (
          <ReportTable
            columns={[
              { key: 'room', label: 'Room' },
              { key: 'type', label: 'Type' },
              { key: 'capacity', label: 'Capacity' },
              { key: 'booking_count', label: 'Bookings' },
              { key: 'booked_hours', label: 'Booked Hrs' },
              { key: 'available_hours', label: 'Available Hrs' },
              { key: 'utilization_pct', label: 'Utilization %', render: r => (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-full h-2 w-20" style={{ backgroundColor: '#334155' }}>
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(r.utilization_pct, 100)}%` }} />
                  </div>
                  <span className="text-white">{r.utilization_pct}%</span>
                </div>
              )},
            ]}
            rows={data}
          />
        )}
      </div>
    </ReportPage>
  );
}
