import { useState } from 'react'
import { User, LogOut, Cloud, LogIn } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../services/supabaseClient'

export default function UserMenu() {
  const { user, logout, enabled } = useAuth()
  const { lang } = useLanguage()
  const isEs = lang === 'es'
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Don't render if Supabase is not configured
  if (!enabled) return null

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
          <Cloud className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-[var(--text-primary)] truncate max-w-[120px]">
            {user.email}
          </span>
        </div>
        <button
          onClick={logout}
          className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          title={isEs ? 'Cerrar sesion' : 'Sign out'}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password)
      if (error) setError(error.message)
      else setShowModal(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg transition-colors"
      >
        <LogIn className="w-3.5 h-3.5" />
        {isEs ? 'Iniciar sesion' : 'Sign in'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              {isSignUp ? (isEs ? 'Crear cuenta' : 'Sign up') : (isEs ? 'Iniciar sesion' : 'Sign in')}
            </h2>

            <button
              onClick={() => signInWithGoogle()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-4 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-tertiary)]">{isEs ? 'o con email' : 'or with email'}</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
              />
              <input
                type="password"
                placeholder={isEs ? 'Contrasena' : 'Password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? '...' : (isSignUp ? (isEs ? 'Crear cuenta' : 'Sign up') : (isEs ? 'Entrar' : 'Sign in'))}
              </button>
            </form>

            <p className="text-xs text-center text-[var(--text-tertiary)] mt-4">
              {isSignUp ? (isEs ? 'Ya tienes cuenta?' : 'Already have an account?') : (isEs ? 'No tienes cuenta?' : "Don't have an account?")}
              {' '}
              <button onClick={() => { setIsSignUp(!isSignUp); setError(null) }} className="text-blue-400 hover:underline">
                {isSignUp ? (isEs ? 'Iniciar sesion' : 'Sign in') : (isEs ? 'Crear cuenta' : 'Sign up')}
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
