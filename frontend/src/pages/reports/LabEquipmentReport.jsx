import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { ReportPage, ReportFilterBar, SummaryCard, BarChart, ReportTable, ReportLoading } from './ReportComponents';

const DARK_PANEL = { backgroundColor: '#1e293b', borderColor: '#334155' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

export default function LabEquipmentReport() {
  const [filters, setFilters] = useState({ start_date: monthAgoStr(), end_date: todayStr() });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ENDPOINTS.reports.labEquipment, { params: f });
      setData(res.data?.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const totalHrs = data.reduce((s, d) => s + d.total_hours, 0).toFixed(1);
  const neverUsed = data.filter(d => d.last_used === 'Never').length;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const csvUrl = `${apiBase}/reports/lab-equipment/?format=csv&start_date=${filters.start_date}&end_date=${filters.end_date}`;

  return (
    <ReportPage title="Lab Equipment Utilization" subtitle="Booking frequency and usage hours for computers, microscopes, and lab instruments.">
      <ReportFilterBar filters={filters} onChange={setFilters} onRefresh={() => load()} exportUrl={csvUrl} />
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Equipment Items" value={data.length} color="green" />
        <SummaryCard label="Total Hours Used" value={totalHrs} color="blue" />
        <SummaryCard label="Never Used" value={neverUsed} color="amber" />
      </div>
      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        <h3 className="font-semibold text-white mb-4">Usage by Equipment (Top 15)</h3>
        {loading ? <ReportLoading /> : <BarChart rows={data} labelKey="item" valueKey="booking_count" color="#10b981" />}
      </div>
      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        {loading ? <ReportLoading /> : (
          <ReportTable
            columns={[
              { key: 'item', label: 'Equipment' },
              { key: 'status', label: 'Status', render: r => (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={r.status === 'available'
                    ? { backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399' }
                    : { backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                  {r.status}
                </span>
              )},
              { key: 'booking_count', label: 'Bookings' },
              { key: 'total_hours', label: 'Hours Used' },
              { key: 'last_used', label: 'Last Used', render: r => (
                <span style={{ color: r.last_used === 'Never' ? '#f87171' : '#94a3b8', fontWeight: r.last_used === 'Never' ? 600 : 400 }}>
                  {r.last_used}
                </span>
              )},
            ]}
            rows={data}
          />
        )}
      </div>
    </ReportPage>
  );
}
