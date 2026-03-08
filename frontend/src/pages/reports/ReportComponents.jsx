/**
 * Shared report UI components — dark navy theme matching app design system.
 */
import React from 'react';

// ─── Filter Bar ───────────────────────────────────────────────────────────────
export function ReportFilterBar({ filters, onChange, onRefresh, exportUrl, extras }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl p-4 mb-5 border"
      style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Start Date</label>
        <input
          type="date"
          value={filters.start_date}
          onChange={e => onChange({ ...filters, start_date: e.target.value })}
          className="px-3 py-2 text-sm rounded-lg border text-slate-200"
          style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">End Date</label>
        <input
          type="date"
          value={filters.end_date}
          onChange={e => onChange({ ...filters, end_date: e.target.value })}
          className="px-3 py-2 text-sm rounded-lg border text-slate-200"
          style={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
        />
      </div>
      {extras}
      <button
        onClick={onRefresh}
        className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-all"
        style={{ backgroundColor: '#3b82f6' }}
      >
        ↺ Apply
      </button>
      {exportUrl && (
        <a
          href={exportUrl}
          target="_blank"
          rel="noreferrer"
          className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-all"
          style={{ backgroundColor: '#10b981' }}
        >
          ↓ CSV Export
        </a>
      )}
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
const CARD_COLORS = {
  blue:   { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  green:  { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.2)' },
  amber:  { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
  purple: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa', border: 'rgba(139,92,246,0.2)' },
  cyan:   { bg: 'rgba(6,182,212,0.12)',  text: '#22d3ee', border: 'rgba(6,182,212,0.2)' },
  pink:   { bg: 'rgba(236,72,153,0.12)', text: '#f472b6', border: 'rgba(236,72,153,0.2)' },
  indigo: { bg: 'rgba(99,102,241,0.12)', text: '#818cf8', border: 'rgba(99,102,241,0.2)' },
};

export function SummaryCard({ label, value, color = 'blue' }) {
  const c = CARD_COLORS[color] || CARD_COLORS.blue;
  return (
    <div className="rounded-2xl px-5 py-4 border" style={{ backgroundColor: c.bg, borderColor: c.border }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: c.text, opacity: 0.85 }}>{label}</p>
      <p className="text-2xl font-bold mt-1 text-white">{value}</p>
    </div>
  );
}

// ─── Bar Chart (CSS-width, no library) ────────────────────────────────────────
export function BarChart({ rows, labelKey, valueKey, color = '#3b82f6', unit = '' }) {
  const max = Math.max(...rows.map(r => r[valueKey] || 0), 1);
  return (
    <div className="space-y-3">
      {rows.slice(0, 15).map((row, i) => {
        const pct = Math.max((row[valueKey] / max) * 100, row[valueKey] > 0 ? 2 : 0);
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="w-44 truncate text-xs leading-tight text-right shrink-0" style={{ color: '#94a3b8' }}>
              {row[labelKey]}
            </span>
            {/* track — darker than panel so it's always visible */}
            <div className="flex-1 rounded-full h-4 overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color, minWidth: pct > 0 ? 4 : 0 }}
              />
            </div>
            <span className="w-16 text-xs font-mono shrink-0 text-right" style={{ color: '#cbd5e1' }}>
              {row[valueKey]}{unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────
export function ReportTable({ columns, rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-16 text-sm rounded-2xl border border-dashed"
        style={{ color: '#64748b', backgroundColor: '#0f172a', borderColor: '#334155' }}>
        No data found for the selected filters.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: '#334155' }}>
      <table className="w-full text-sm text-left">
        <thead>
          <tr style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: '#94a3b8' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#0f172a' : '#111827', borderBottom: '1px solid #1e293b' }}>
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3" style={{ color: '#cbd5e1' }}>
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────
export function ReportLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-sm animate-pulse" style={{ color: '#475569' }}>
      Generating report…
    </div>
  );
}

// ─── Page Shell ───────────────────────────────────────────────────────────────
export function ReportPage({ title, subtitle, children }) {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5" style={{ color: '#e2e8f0' }}>
      <div className="rounded-2xl px-6 py-4 border" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
