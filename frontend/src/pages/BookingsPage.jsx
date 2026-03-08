import { useEffect, useState } from 'react'
import apiClient from '../api/apiClient'
import { useAuth } from '../auth/AuthContext'

const APPROVER_ROLES = ['tenant_admin', 'facility_manager', 'hod', 'dean', 'super_admin']

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  function fetchBookings() {
    apiClient.get('/bookings/')
      .then((res) => setBookings(res.data.results || res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchBookings() }, [])

  async function handleAction(id, action) {
    await apiClient.post(`/bookings/${id}/approve_reject/`, { action })
    fetchBookings()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Bookings</h2>
      {loading ? (
        <p className="text-neutral-400">Loading...</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold">{b.title}</p>
                <p className="text-xs text-neutral-400">{b.resource_name} · {new Date(b.start_time).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge-${b.status}`}>{b.status}</span>
                {b.status === 'pending' && APPROVER_ROLES.includes(user?.role) && (
                  <>
                    <button className="btn-primary text-xs py-1 px-3" onClick={() => handleAction(b.id, 'approve')}>Approve</button>
                    <button className="btn-secondary text-xs py-1 px-3" onClick={() => handleAction(b.id, 'reject')}>Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
          {bookings.length === 0 && <p className="text-neutral-400">No bookings.</p>}
        </div>
      )}
    </div>
  )
}
