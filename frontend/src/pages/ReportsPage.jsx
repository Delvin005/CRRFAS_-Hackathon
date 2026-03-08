import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const REPORT_CARDS = [
  { to: '/reports/room-utilization',    icon: '🏫', title: 'Room Utilization',        desc: 'Booking hours vs available hours per classroom, lab & hall.',              color: '#3b82f6', glow: 'rgba(59,130,246,0.15)',  endpoint: ENDPOINTS.reports.roomUtilization },
  { to: '/reports/faculty-workload',    icon: '👨‍🏫', title: 'Faculty Workload',         desc: 'Weekly timetable hours assigned per faculty member.',                     color: '#8b5cf6', glow: 'rgba(139,92,246,0.15)', endpoint: ENDPOINTS.reports.facultyWorkload },
  { to: '/reports/department-timetable',icon: '📋', title: 'Dept. Timetable',          desc: 'Published sessions breakdown by department and day.',                     color: '#6366f1', glow: 'rgba(99,102,241,0.15)', endpoint: ENDPOINTS.reports.departmentTimetable },
  { to: '/reports/resource-utilization',icon: '📦', title: 'Resource Utilization',     desc: 'Booking frequency and hours used across all resource types.',              color: '#06b6d4', glow: 'rgba(6,182,212,0.15)',  endpoint: ENDPOINTS.reports.resourceUtilization },
  { to: '/reports/exam-schedule',       icon: '📝', title: 'Exam Schedule',            desc: 'Published exam sessions with halls, courses, and student counts.',         color: '#f59e0b', glow: 'rgba(245,158,11,0.15)', endpoint: ENDPOINTS.reports.examSchedule },
  { to: '/reports/event-bookings',      icon: '🎉', title: 'Event Bookings',           desc: 'All events, workshops, and meetings booked in the period.',               color: '#ec4899', glow: 'rgba(236,72,153,0.15)', endpoint: ENDPOINTS.reports.eventBookings },
  { to: '/reports/lab-equipment',       icon: '🔬', title: 'Lab Equipment',            desc: 'Computers, microscopes, and lab instruments — booking & last-use data.',  color: '#10b981', glow: 'rgba(16,185,129,0.15)', endpoint: ENDPOINTS.reports.labEquipment },
  { to: '/reports/sports-utilization',  icon: '⚽', title: 'Sports Utilization',       desc: 'Checkout frequency and hours for sports equipment and facilities.',        color: '#f97316', glow: 'rgba(249,115,22,0.15)', endpoint: ENDPOINTS.reports.sportsUtilization },
];

export default function ReportsPage() {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    REPORT_CARDS.forEach(async (card) => {
      try {
        const res = await axiosInstance.get(card.endpoint);
        const d = res.data?.data || res.data || [];
        setCounts(prev => ({ ...prev, [card.to]: Array.isArray(d) ? d.length : '—' }));
      } catch {
        setCounts(prev => ({ ...prev, [card.to]: '—' }));
      }
    });
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl px-6 py-5 border" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
        <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Select a report to view detailed data, apply date filters, and export to CSV.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {REPORT_CARDS.map(card => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-2xl border overflow-hidden transition-all hover:scale-[1.02]"
            style={{ backgroundColor: '#1e293b', borderColor: '#334155', boxShadow: `0 0 0 0 ${card.glow}` }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 20px ${card.glow}`}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            {/* Header accent strip */}
            <div className="h-1 w-full" style={{ backgroundColor: card.color }} />

            <div className="p-5">
              <div className="text-3xl mb-3">{card.icon}</div>
              <h3 className="font-bold text-white text-base leading-tight">{card.title}</h3>

              {counts[card.to] !== undefined && (
                <p className="text-xs mt-0.5 font-mono" style={{ color: card.color }}>
                  {counts[card.to]} records
                </p>
              )}

              <p className="text-xs leading-relaxed mt-2" style={{ color: '#64748b' }}>{card.desc}</p>

              <p className="mt-4 text-xs font-semibold" style={{ color: card.color }}>
                View Report →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
