import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/resources', label: 'Resources', icon: '🏫' },
  { to: '/bookings', label: 'Bookings', icon: '📅' },
  { to: '/exams', label: 'Exams', icon: '📝' },
  { to: '/calendar', label: 'Calendar', icon: '🗓' },
  { to: '/campus', label: 'Campus', icon: '🏛️' },
  { to: '/reports', label: 'Reports', icon: '📈' },
  { to: '/users', label: 'Users', icon: '👥' },
]

const academicsNav = [
  { to: '/academics/departments', label: 'Departments' },
  { to: '/academics/programs', label: 'Programs' },
  { to: '/academics/semesters', label: 'Semesters' },
  { to: '/academics/courses', label: 'Courses' },
  { to: '/academics/course-sections', label: 'Course Sections' },
  { to: '/academics/faculty', label: 'Faculty' },
  { to: '/academics/faculty/availability', label: 'Availability' },
  { to: '/academics/faculty/preferences', label: 'Preferences' },
  { to: '/academics/batches', label: 'Batches & Sections' },
  { to: '/academics/courses/import', label: '↑ Import CSV' },
]

const timetableNav = [
  { to: '/timetable/plans', label: 'Manage Plans' },
  { to: '/timetable/view', label: 'Weekly View' },
]

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-neutral-400 hover:bg-primary-600/20 hover:text-neutral-50'
        }`
      }
    >
      {icon && <span>{icon}</span>}
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user } = useAuth()
  const [academicsOpen, setAcademicsOpen] = useState(false)
  const [timetableOpen, setTimetableOpen] = useState(false)

  return (
    <aside className="w-64 bg-primary-800 border-r border-primary-600/20 flex flex-col min-h-0">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-primary-600/20 flex-shrink-0">
        <h1 className="text-xl font-bold text-accent-cyan tracking-wide">CRRFAS</h1>
        <p className="text-xs text-neutral-400 mt-0.5">Campus Resource System</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Main nav */}
        {mainNav.map(item => <NavItem key={item.to} {...item} />)}

        {/* Academics collapsible group */}
        <div className="pt-2">
          <button
            onClick={() => setAcademicsOpen(o => !o)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:bg-primary-600/20 hover:text-neutral-50 transition-colors"
          >
            <span className="flex items-center gap-3"><span>🎓</span> Academics</span>
            <span className="text-xs">{academicsOpen ? '▾' : '▸'}</span>
          </button>

          {academicsOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-primary-600/20 space-y-0.5">
              {academicsNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `block px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-primary-600/20'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Timetable collapsible group */}
        <div className="pt-2">
          <button
            onClick={() => setTimetableOpen(o => !o)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:bg-primary-600/20 hover:text-neutral-50 transition-colors"
          >
            <span className="flex items-center gap-3"><span>🗓️</span> Timetable</span>
            <span className="text-xs">{timetableOpen ? '▾' : '▸'}</span>
          </button>

          {timetableOpen && (
            <div className="mt-1 ml-4 pl-3 border-l border-primary-600/20 space-y-0.5">
              {timetableNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `block px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-neutral-400 hover:text-neutral-50 hover:bg-primary-600/20'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* User info */}
      {user && (
        <div className="px-4 py-3 border-t border-primary-600/20 flex-shrink-0">
          <p className="text-sm font-medium truncate">{user.first_name || user.username}</p>
          <p className="text-xs text-neutral-400 capitalize">{user.role?.replace(/_/g, ' ')}</p>
        </div>
      )}
    </aside>
  )
}
