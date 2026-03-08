import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { ReportPage, ReportFilterBar, SummaryCard, BarChart, ReportTable, ReportLoading } from './ReportComponents';

const DARK_PANEL = { backgroundColor: '#1e293b', borderColor: '#334155' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

export default function SportsUtilizationReport() {
  const [filters, setFilters] = useState({ start_date: monthAgoStr(), end_date: todayStr() });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ENDPOINTS.reports.sportsUtilization, { params: f });
      setData(res.data?.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const totalCheckouts = data.reduce((s, d) => s + (d.checkout_count || 0), 0);
  const totalHrs = data.reduce((s, d) => s + (d.total_hours_issued || 0), 0).toFixed(1);
  const neverCheckedOut = data.filter(d => d.last_checkout === 'Never').length;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const csvUrl = `${apiBase}/reports/sports-utilization/?format=csv&start_date=${filters.start_date}&end_date=${filters.end_date}`;

  return (
    <ReportPage title="Sports Items Utilization" subtitle="Checkout frequency and usage duration for sports equipment and facilities.">
      <ReportFilterBar filters={filters} onChange={setFilters} onRefresh={() => load()} exportUrl={csvUrl} />

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Sports Items" value={data.length} color="amber" />
        <SummaryCard label="Total Checkouts" value={totalCheckouts} color="blue" />
        <SummaryCard label="Total Hours Issued" value={totalHrs} color="green" />
      </div>

      {neverCheckedOut > 0 && (
        <div className="rounded-xl border px-4 py-3 text-sm"
          style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24' }}>
          ⚠️ <strong>{neverCheckedOut}</strong> item{neverCheckedOut > 1 ? 's have' : ' has'} never been checked out in this period.
        </div>
      )}

      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        <h3 className="font-semibold text-white mb-4">Checkouts by Item (Top 15)</h3>
        {loading ? <ReportLoading /> : <BarChart rows={data} labelKey="item" valueKey="checkout_count" color="#f59e0b" />}
      </div>

      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        {loading ? <ReportLoading /> : (
          <ReportTable
            columns={[
              { key: 'item', label: 'Sports Item' },
              { key: 'status', label: 'Status', render: r => (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={r.status === 'available'
                    ? { backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399' }
                    : { backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                  {r.status}
                </span>
              )},
              { key: 'checkout_count', label: 'Checkouts' },
              { key: 'total_hours_issued', label: 'Hours Issued' },
              { key: 'last_checkout', label: 'Last Checkout', render: r => (
                <span style={{ color: r.last_checkout === 'Never' ? '#f87171' : '#94a3b8', fontWeight: r.last_checkout === 'Never' ? 600 : 400 }}>
                  {r.last_checkout}
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
