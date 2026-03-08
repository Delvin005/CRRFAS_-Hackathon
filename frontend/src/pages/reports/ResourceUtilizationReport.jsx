import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { ReportPage, ReportFilterBar, SummaryCard, BarChart, ReportTable, ReportLoading } from './ReportComponents';

const DARK_PANEL = { backgroundColor: '#1e293b', borderColor: '#334155' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

export default function ResourceUtilizationReport() {
  const [filters, setFilters] = useState({ start_date: monthAgoStr(), end_date: todayStr() });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ENDPOINTS.reports.resourceUtilization, { params: f });
      setData(res.data?.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalHrs = data.reduce((s, d) => s + d.total_hours, 0).toFixed(1);
  const totalBookings = data.reduce((s, d) => s + d.booking_count, 0);
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const csvUrl = `${apiBase}/reports/resource-utilization/?format=csv&start_date=${filters.start_date}&end_date=${filters.end_date}`;

  return (
    <ReportPage title="Resource Utilization" subtitle="Booking frequency and hours for all resource types.">
      <ReportFilterBar filters={filters} onChange={setFilters} onRefresh={() => load()} exportUrl={csvUrl} />
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Resources Tracked" value={data.length} color="cyan" />
        <SummaryCard label="Total Bookings" value={totalBookings} color="blue" />
        <SummaryCard label="Total Hours Used" value={totalHrs} color="green" />
      </div>
      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        <h3 className="font-semibold text-white mb-4">Booking Count by Resource (Top 15)</h3>
        {loading ? <ReportLoading /> : <BarChart rows={data} labelKey="resource" valueKey="booking_count" color="#06b6d4" />}
      </div>
      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        {loading ? <ReportLoading /> : (
          <ReportTable
            columns={[
              { key: 'resource', label: 'Resource' },
              { key: 'type', label: 'Type' },
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
            ]}
            rows={data}
          />
        )}
      </div>
    </ReportPage>
  );
}
