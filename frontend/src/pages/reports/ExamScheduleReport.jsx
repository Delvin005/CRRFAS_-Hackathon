import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';
import { ReportPage, ReportFilterBar, SummaryCard, ReportTable, ReportLoading } from './ReportComponents';

const DARK_PANEL = { backgroundColor: '#1e293b', borderColor: '#334155' };
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };

export default function ExamScheduleReport() {
  const [filters, setFilters] = useState({ start_date: monthAgoStr(), end_date: todayStr() });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (f = filters) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(ENDPOINTS.reports.examSchedule, { params: f });
      setData(res.data?.data || []);
    } catch { setData([]); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  const totalStudents = data.reduce((s, d) => s + (d.total_students || 0), 0);
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const csvUrl = `${apiBase}/reports/exam-schedule/?format=csv&start_date=${filters.start_date}&end_date=${filters.end_date}`;

  return (
    <ReportPage title="Exam Schedule Report" subtitle="Published exam sessions, hall allocations, and student counts.">
      <ReportFilterBar filters={filters} onChange={setFilters} onRefresh={() => load()} exportUrl={csvUrl} />
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Sessions" value={data.length} color="amber" />
        <SummaryCard label="Total Students Seated" value={totalStudents} color="blue" />
        <SummaryCard label="Period" value={`${filters.start_date} → ${filters.end_date}`} color="purple" />
      </div>
      <div className="rounded-2xl border p-5" style={DARK_PANEL}>
        {loading ? <ReportLoading /> : (
          <ReportTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'time', label: 'Time' },
              { key: 'type', label: 'Session', render: r => (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>{r.type}</span>
              )},
              { key: 'plan', label: 'Plan' },
              { key: 'courses', label: 'Courses', render: r => (
                <div className="flex flex-wrap gap-1">
                  {(r.courses || []).map((c, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-xs"
                      style={{ backgroundColor: '#0f172a', color: '#94a3b8' }}>{c}</span>
                  ))}
                </div>
              )},
              { key: 'halls', label: 'Halls', render: r => (
                <div className="flex flex-wrap gap-1">
                  {(r.halls || []).map((h, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-xs"
                      style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}>{h}</span>
                  ))}
                </div>
              )},
              { key: 'total_students', label: 'Students' },
            ]}
            rows={data}
          />
        )}
      </div>
    </ReportPage>
  );
}
