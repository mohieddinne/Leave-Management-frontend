import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HiLockClosed, HiUser, HiChevronDown } from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDefaultAccounts, setShowDefaultAccounts] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
      navigate(from, { replace: true })
    } catch {
      toast.error('Identifiants invalides. Vérifiez votre nom d\'utilisateur et mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl mb-3">
            RH
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Congés</h1>
          <p className="text-sm text-gray-500 mt-1">Connectez-vous à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <HiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="admin / manager / employe"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Default credentials - Collapsible */}
        <div className="mt-6 bg-gray-50 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDefaultAccounts(!showDefaultAccounts)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span>Comptes par défaut</span>
            <HiChevronDown
              className={`w-4 h-4 transition-transform ${
                showDefaultAccounts ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showDefaultAccounts && (
            <div className="px-4 py-3 border-t border-gray-200 text-xs text-gray-500 space-y-1">
              <p><span className="font-medium text-blue-700">admin</span> / admin123 — Administrateur</p>
              <p><span className="font-medium text-green-700">manager</span> / manager123 — Manager</p>
              <p><span className="font-medium text-orange-700">employe</span> / employe123 — Employé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
