import { useEffect, useState } from 'react'
import apiClient from '../api/apiClient'
import { useAuth } from '../auth/AuthContext'

function StatCard({ label, value, color }) {
  return (
    <div className="card flex flex-col gap-1">
      <span className="text-neutral-400 text-sm">{label}</span>
      <span className={`text-3xl font-bold ${color}`}>{value ?? '—'}</span>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ bookings: null, resources: null, pending: null })

  useEffect(() => {
    Promise.all([
      apiClient.get('/bookings/').catch(() => ({ data: { count: 0 } })),
      apiClient.get('/resources/').catch(() => ({ data: { count: 0 } })),
      apiClient.get('/bookings/?status=pending').catch(() => ({ data: { count: 0 } })),
    ]).then(([b, r, p]) => {
      setStats({ bookings: b.data.count, resources: r.data.count, pending: p.data.count })
    })
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">
        Dashboard
        {user?.tenant_name && <span className="text-neutral-400 text-base font-normal ml-2">— {user.tenant_name}</span>}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Bookings" value={stats.bookings} color="text-accent-cyan" />
        <StatCard label="Resources" value={stats.resources} color="text-accent-teal" />
        <StatCard label="Pending Approvals" value={stats.pending} color="text-accent-amber" />
      </div>
      <div className="card">
        <p className="text-neutral-400 text-sm">Select a module from the sidebar to get started.</p>
      </div>
    </div>
  )
}
