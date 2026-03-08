import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { ReportPage, ReportFilterBar, SummaryCard, ReportTable, ReportLoading } from './ReportComponents';

const DARK_PANEL = { backgroundColor: '#1e293b', borderColor: '#334155' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };
const DAY_LABELS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };

export default function DepartmentTimetableReport() {
  const [filters, setFilters] = useState({ start_date: monthAgoStr(), end_date: todayStr() });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ENDPOINTS.reports.departmentTimetable, { params: f });
      setData(res.data?.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const totalSessions = data.reduce((s, d) => s + (d.total_sessions || 0), 0);
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const csvUrl = `${apiBase}/reports/department-timetable/?format=csv`;

  return (
    <ReportPage title="Department Timetable" subtitle="Session counts per published plan grouped by department.">
      <ReportFilterBar filters={filters} onChange={setFilters} onRefresh={() => load()} exportUrl={csvUrl} />
      <div className="grid grid-cols-2 gap-4">
        <SummaryCard label="Plans Found" value={data.length} color="blue" />
        <SummaryCard label="Total Sessions" value={totalSessions} color="indigo" />
      </div>
      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        {loading ? <ReportLoading /> : (
          <ReportTable
            columns={[
              { key: 'plan', label: 'Plan' },
              { key: 'department', label: 'Department' },
              { key: 'semester', label: 'Semester' },
              { key: 'total_sessions', label: 'Total Sessions' },
              { key: 'sessions_by_day', label: 'By Day', render: r => (
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(DAY_LABELS).map(([k, label]) => (
                    <span key={k} className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: '#0f172a', color: '#94a3b8' }}>
                      {label}: {r.sessions_by_day?.[k] ?? 0}
                    </span>
                  ))}
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
