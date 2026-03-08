import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-primary-800 border-b border-primary-600/20 flex items-center justify-between px-6">
      <div className="text-sm text-neutral-400">
        Welcome back, <span className="text-neutral-50 font-medium">{user?.first_name || user?.username}</span>
      </div>
      <button
        onClick={handleLogout}
        className="text-sm text-neutral-400 hover:text-accent-red transition-colors"
      >
        Logout
      </button>
    </header>
  )
}
