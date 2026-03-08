import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card w-full max-w-md relative overflow-hidden backdrop-blur-xl bg-primary-800/80 border border-primary-700/50 shadow-2xl rounded-2xl p-8">
      {/* Subtle top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[150px] bg-accent-cyan/10 blur-[80px] pointer-events-none rounded-full" />
      
      <div className="mb-8 text-center relative z-10">
        <h1 className="text-3xl font-extrabold text-accent-cyan tracking-tight mb-2">CRRFAS</h1>
        <p className="text-neutral-400 text-sm">Campus Resource Allocation System</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10" autoComplete="off">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="username">Username</label>
          <input
            id="username"
            name="crrfas_username_off"
            type="text"
            className="input bg-primary-900/50 border-primary-600 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all"
            placeholder="e.g. user@campus.edu"
            autoComplete="off"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="password">Password</label>
          <input
            id="password"
            name="crrfas_password_off"
            type="password"
            className="input bg-primary-900/50 border-primary-600 focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan transition-all"
            placeholder="••••••••"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        
        {error && (
          <div className="bg-accent-red/10 border border-accent-red/20 rounded p-3">
            <p className="text-accent-red text-sm text-center font-medium">{error}</p>
          </div>
        )}
        
        <button
          id="login-submit"
          type="submit"
          className="btn-primary w-full py-2.5 text-base font-semibold shadow-lg shadow-accent-cyan/20 hover:shadow-accent-cyan/40 transition-all duration-300 transform hover:-translate-y-0.5"
          disabled={loading}
        >
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
