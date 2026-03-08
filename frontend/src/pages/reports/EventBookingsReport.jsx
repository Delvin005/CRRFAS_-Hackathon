import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { ReportPage, ReportFilterBar, SummaryCard, BarChart, ReportTable, ReportLoading } from './ReportComponents';

const DARK_PANEL = { backgroundColor: '#1e293b', borderColor: '#334155' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

const PURPOSE_STYLE = {
  event:    { bg: 'rgba(236,72,153,0.15)', text: '#f472b6' },
  workshop: { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' },
  meeting:  { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' },
};

export default function EventBookingsReport() {
  const [filters, setFilters] = useState({ start_date: monthAgoStr(), end_date: todayStr() });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ENDPOINTS.reports.eventBookings, { params: f });
      setData(res.data?.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const totalAttendees = data.reduce((s, d) => s + (d.attendees || 0), 0);
  const byPurpose = ['event', 'workshop', 'meeting'].map(p => ({
    purpose: p, count: data.filter(d => d.purpose === p).length
  }));
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const csvUrl = `${apiBase}/reports/event-bookings/?format=csv&start_date=${filters.start_date}&end_date=${filters.end_date}`;

  return (
    <ReportPage title="Event Bookings" subtitle="Events, workshops, and meetings booked in the selected period.">
      <ReportFilterBar filters={filters} onChange={setFilters} onRefresh={() => load()} exportUrl={csvUrl} />
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total Bookings" value={data.length} color="pink" />
        <SummaryCard label="Total Attendees" value={totalAttendees} color="blue" />
        <SummaryCard label="Venues Used" value={[...new Set(data.map(d => d.resource))].length} color="amber" />
      </div>
      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        <h3 className="font-semibold text-white mb-4">Bookings by Purpose</h3>
        {loading ? <ReportLoading /> : <BarChart rows={byPurpose} labelKey="purpose" valueKey="count" color="#ec4899" />}
      </div>
      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        {loading ? <ReportLoading /> : (
          <ReportTable
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'purpose', label: 'Type', render: r => {
                const s = PURPOSE_STYLE[r.purpose] || PURPOSE_STYLE.meeting;
                return <span className="px-2 py-0.5 rounded-full text-xs capitalize font-medium"
                  style={{ backgroundColor: s.bg, color: s.text }}>{r.purpose}</span>;
              }},
              { key: 'resource', label: 'Venue' },
              { key: 'requested_by', label: 'By' },
              { key: 'start', label: 'Start' },
              { key: 'end', label: 'End' },
              { key: 'status', label: 'Status', render: r => (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={r.status === 'approved'
                    ? { backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399' }
                    : { backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
                  {r.status}
                </span>
              )},
              { key: 'attendees', label: 'Attendees' },
            ]}
            rows={data}
          />
        )}
      </div>
    </ReportPage>
  );
}
