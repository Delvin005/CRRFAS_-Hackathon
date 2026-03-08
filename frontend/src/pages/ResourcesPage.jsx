import { useEffect, useState } from 'react'
import apiClient from '../api/apiClient'

const TYPE_LABELS = {
  classroom: 'Classroom', lab: 'Lab', seminar_hall: 'Seminar Hall',
  auditorium: 'Auditorium', meeting_room: 'Meeting Room',
  sports_facility: 'Sports', equipment: 'Equipment',
}

export default function ResourcesPage() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.get('/resources/')
      .then((res) => setResources(res.data.results || res.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Resources</h2>
      {loading ? (
        <p className="text-neutral-400">Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-400 border-b border-primary-600/20">
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Type</th>
                <th className="text-left py-3 px-4">Capacity</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="border-b border-primary-600/10 hover:bg-primary-800/50">
                  <td className="py-3 px-4 font-medium">{r.name}</td>
                  <td className="py-3 px-4 text-neutral-400">{TYPE_LABELS[r.resource_type] || r.resource_type}</td>
                  <td className="py-3 px-4">{r.capacity}</td>
                  <td className="py-3 px-4">
                    <span className={r.status === 'available' ? 'badge-approved' : 'badge-pending'}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {resources.length === 0 && (
            <p className="text-center text-neutral-400 py-8">No resources found.</p>
          )}
        </div>
      )}
    </div>
  )
}
