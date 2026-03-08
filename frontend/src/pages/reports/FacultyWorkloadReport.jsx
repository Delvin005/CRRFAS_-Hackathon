import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { ReportPage, ReportFilterBar, SummaryCard, BarChart, ReportTable, ReportLoading } from './ReportComponents';

const DARK_PANEL = { backgroundColor: '#1e293b', borderColor: '#334155' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

export default function FacultyWorkloadReport() {
  const [filters, setFilters] = useState({ start_date: monthAgoStr(), end_date: todayStr() });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ENDPOINTS.reports.facultyWorkload, { params: f });
      setData(res.data?.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const totalSessions = data.reduce((s, d) => s + d.sessions_count, 0);
  const avgHrs = data.length ? (data.reduce((s, d) => s + d.weekly_hours, 0) / data.length).toFixed(1) : 0;
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const csvUrl = `${apiBase}/reports/faculty-workload/?format=csv`;

  return (
    <ReportPage title="Faculty Workload" subtitle="Weekly teaching hours assigned per faculty in published timetable plans.">
      <ReportFilterBar filters={filters} onChange={setFilters} onRefresh={() => load()} exportUrl={csvUrl} />

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total Faculty" value={data.length} color="purple" />
        <SummaryCard label="Total Sessions" value={totalSessions} color="blue" />
        <SummaryCard label="Avg Weekly Hours" value={avgHrs} color="amber" />
      </div>

      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        <h3 className="font-semibold text-white mb-4">Workload Distribution (Top 15)</h3>
        {loading ? <ReportLoading /> : <BarChart rows={data} labelKey="faculty" valueKey="weekly_hours" unit=" hrs" color="#8b5cf6" />}
      </div>

      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        {loading ? <ReportLoading /> : (
          <ReportTable
            columns={[
              { key: 'faculty', label: 'Faculty' },
              { key: 'department', label: 'Department' },
              { key: 'designation', label: 'Designation' },
              { key: 'sessions_count', label: 'Sessions' },
              { key: 'weekly_hours', label: 'Weekly Hrs' },
            ]}
            rows={data}
          />
        )}
      </div>
    </ReportPage>
  );
}
