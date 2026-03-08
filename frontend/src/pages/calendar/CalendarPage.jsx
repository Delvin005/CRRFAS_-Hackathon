import React, { useState, useEffect, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axiosInstance from '../../api/apiClient';
import { ENDPOINTS } from '../../api/endpoints';

// ─── Dark theme override for FullCalendar ─────────────────────────────────────
const fcDark = `
  .fc { color: #e2e8f0; font-family: inherit; }
  .fc-theme-standard td, .fc-theme-standard th { border-color: #334155; }
  .fc-theme-standard .fc-scrollgrid { border-color: #334155; }
  .fc-col-header-cell { background-color: #1e293b; padding: 8px 0; }
  .fc-col-header-cell-cushion { color: #e2e8f0 !important; text-decoration: none; font-weight: 600; }
  .fc-daygrid-day { background: #0f172a; }
  .fc-daygrid-day-number { color: #94a3b8 !important; text-decoration: none; font-weight: 500; padding: 4px; }
  .fc-timegrid-slot { background: #0f172a; }
  .fc-timegrid-axis { background: #1e293b; }
  .fc-timegrid-slot-label-cushion { color: #94a3b8; font-weight: 500; }
  .fc-day-today { background: rgba(59,130,246,0.08) !important; }
  .fc-button { background-color: #1e293b !important; border-color: #334155 !important; color: #e2e8f0 !important; text-transform: capitalize; font-weight: 500; transition: all 0.2s; }
  .fc-button:hover { background-color: #334155 !important; color: #fff !important; }
  .fc-button-active, .fc-button.fc-button-active { background-color: #3b82f6 !important; border-color: #2563eb !important; color: #ffffff !important; box-shadow: none !important; }
  .fc-toolbar-title { color: #ffffff !important; font-size: 1.25rem !important; font-weight: 700 !important; }
  .fc-now-indicator-line { border-color: #ef4444 !important; border-width: 2px 0 0 !important; }
  .fc-daygrid-day.fc-day-other { background: #080f1a !important; }
  .fc-v-event, .fc-h-event { border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important; }
`;

// ─── Event Legend ─────────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { key: 'timetable',   label: 'Class Session',   color: '#3b82f6' },
  { key: 'exam',        label: 'Exam',            color: '#8b5cf6' },
  { key: 'booking',     label: 'Event / Booking', color: '#f59e0b' },
  { key: 'maintenance', label: 'Maintenance',     color: '#ef4444' },
];

// ─── Tooltip Component ────────────────────────────────────────────────────────
function EventTooltip({ info, position }) {
  if (!info) return null;
  const { extendedProps, title } = info.event;
  return (
    <div
      className="fixed z-50 border rounded-xl shadow-2xl p-4 w-72 text-sm pointer-events-none"
      style={{
        top: position.y + 12,
        left: Math.min(position.x + 12, window.innerWidth - 300),
        backgroundColor: '#1e293b',
        borderColor: '#334155',
        color: '#e2e8f0',
      }}
    >
      <div className="font-bold mb-2 leading-tight text-white">{title}</div>
      <div className="space-y-1.5 text-slate-300">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-semibold capitalize" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            {extendedProps.type}
          </span>
          {extendedProps.sessionType && <span className="text-xs text-slate-400">{extendedProps.sessionType}</span>}
        </div>
        {extendedProps.rooms    && <div className="mt-2 text-xs">🏫 {extendedProps.rooms}</div>}
        {extendedProps.faculties && <div className="text-xs">👤 {extendedProps.faculties}</div>}
        {extendedProps.user     && <div className="text-xs">👤 Booked by: {extendedProps.user}</div>}
      </div>
    </div>
  );
}

// ─── Reusable dark select ─────────────────────────────────────────────────────
function DarkSelect({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ backgroundColor: '#0f172a', color: '#e2e8f0', borderColor: '#334155' }}
      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
    >
      {children}
    </select>
  );
}

// ─── Main Calendar Page ───────────────────────────────────────────────────────
export default function CalendarPage() {
  const calendarRef = useRef(null);

  const [filters, setFilters] = useState({ room_id: '', department_id: '', faculty_id: '', event_type: '' });
  const [departments, setDepartments] = useState([]);
  const [resources, setResources]     = useState([]);
  const [tooltip, setTooltip]         = useState(null);
  const [tooltipPos, setTooltipPos]   = useState({ x: 0, y: 0 });

  useEffect(() => {
    axiosInstance.get(ENDPOINTS.academics.departments).then(r => setDepartments(r.data?.results || r.data || [])).catch(() => {});
    axiosInstance.get(ENDPOINTS.resources).then(r => setResources(r.data?.results || r.data || [])).catch(() => {});
  }, []);

  const fetchEvents = useCallback(async (fetchInfo, successCallback, failureCallback) => {
    try {
      const params = new URLSearchParams({
        start: fetchInfo.startStr,
        end:   fetchInfo.endStr,
        ...(filters.room_id        && { room_id:       filters.room_id }),
        ...(filters.department_id  && { department_id: filters.department_id }),
        ...(filters.faculty_id     && { faculty_id:    filters.faculty_id }),
      });
      const res = await axiosInstance.get(`${ENDPOINTS.timetable.calendarFeed}?${params}`);
      let events = res.data || [];
      if (filters.event_type) {
        events = events.filter(e => e.extendedProps?.type === filters.event_type);
      }
      successCallback(events);
    } catch (err) {
      console.error('CalendarFeed error:', err);
      failureCallback(err);
    }
  }, [filters]);

  return (
    <div
      className="flex h-[calc(100vh-80px)] border rounded-2xl overflow-hidden shadow-sm"
      style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
      onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
    >
      <style>{fcDark}</style>

      {/* ─── Filter Sidebar ────────────────────── */}
      <aside
        className="w-64 flex flex-col flex-shrink-0 border-r"
        style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
      >
        <div className="px-5 py-5 border-b" style={{ borderColor: '#334155' }}>
          <h2 className="text-lg font-bold text-white">Filters</h2>
          <p className="text-xs text-slate-400 mt-0.5">Narrow the calendar view</p>
        </div>

        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Department</label>
            <DarkSelect value={filters.department_id} onChange={e => setFilters(f => ({ ...f, department_id: e.target.value }))}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </DarkSelect>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Room / Hall</label>
            <DarkSelect value={filters.room_id} onChange={e => setFilters(f => ({ ...f, room_id: e.target.value }))}>
              <option value="">All Rooms</option>
              {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </DarkSelect>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Event Type</label>
            <DarkSelect value={filters.event_type} onChange={e => setFilters(f => ({ ...f, event_type: e.target.value }))}>
              <option value="">All Types</option>
              {EVENT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </DarkSelect>
          </div>

          {/* Legend */}
          <div className="pt-4 border-t" style={{ borderColor: '#334155' }}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Legend</p>
            <div className="space-y-2.5">
              {EVENT_TYPES.map(t => (
                <div key={t.key} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: t.color }} />
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Calendar Area ─────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: '#0f172a' }}>
        {/* Topbar */}
        <div
          className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
        >
          <div>
            <h1 className="text-xl font-bold text-white">Availability Calendar</h1>
            <p className="text-sm text-slate-400 mt-0.5">Unified view of all campus events</p>
          </div>
          <button
            onClick={() => calendarRef.current?.getApi().refetchEvents()}
            className="flex items-center gap-2 px-4 py-2 font-medium text-sm rounded-lg transition-colors text-white hover:bg-blue-600"
            style={{ backgroundColor: '#3b82f6' }}
          >
            ↻ Refresh View
          </button>
        </div>

        {/* FullCalendar */}
        <div className="flex-1 p-6 min-h-0">
          <div
            className="rounded-xl h-full overflow-hidden border bg-white shadow-sm"
            style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              height="100%"
              events={fetchEvents}
              eventMouseEnter={info => setTooltip(info)}
              eventMouseLeave={() => setTooltip(null)}
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
              slotMinTime="07:00:00"
              slotMaxTime="21:00:00"
              weekends={true}
              nowIndicator={true}
              eventDisplay="block"
              eventClassNames="cursor-pointer font-medium"
            />
          </div>
        </div>
      </div>

      <EventTooltip info={tooltip} position={tooltipPos} />
    </div>
  );
}
