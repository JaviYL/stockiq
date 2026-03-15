import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Calculator, X, Database, Star, GitCompareArrows, Filter, Clock, PieChart, CalendarDays, Globe, FlaskConical, UserCircle, LogOut } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getRequestCount } from '../services/fmpApi'
import { isMockMode, setMockMode, getMockModeLabel } from '../services/mockDataService'
import { getProfile, getProfileInitials } from '../services/profileService'
import SearchAutocomplete from './SearchAutocomplete'

export default function Sidebar({ open, onClose, onSearch }) {
  const { t, lang } = useLanguage()
  const isEs = lang === 'es'
  const [mockEnabled, setMockEnabled] = useState(isMockMode())
  const mockLabel = getMockModeLabel()
  const profile = getProfile()
  const initials = getProfileInitials(profile)

  const toggleMock = () => {
    const next = !mockEnabled
    setMockMode(next)
    setMockEnabled(next)
    // Reload to apply changes
    window.location.reload()
  }

  const handleSelect = (ticker) => {
    onSearch(ticker)
    onClose()
  }

  const navSections = [
    {
      title: null,
      items: [
        { to: '/', icon: Home, label: t('home') },
      ]
    },
    {
      title: isEs ? 'ANÁLISIS' : 'ANALYSIS',
      items: [
        { to: '/watchlist', icon: Star, label: 'Watchlist' },
        { to: '/comparator', icon: GitCompareArrows, label: isEs ? 'Comparador' : 'Comparator' },
        { to: '/screener', icon: Filter, label: 'Screener' },
        { to: '/indices', icon: Globe, label: isEs ? 'Indices' : 'Indices' },
      ]
    },
    {
      title: isEs ? 'HERRAMIENTAS' : 'TOOLS',
      items: [
        { to: '/portfolio', icon: PieChart, label: isEs ? 'Cartera' : 'Portfolio' },
        { to: '/whatif', icon: Clock, label: 'What-If' },
        { to: '/earnings', icon: CalendarDays, label: 'Earnings' },
        { to: '/calculator', icon: Calculator, label: t('calculator') },
      ]
    },
  ]

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)]
        flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <NavLink to="/" className="text-xl font-bold text-[var(--text-primary)] tracking-wider" onClick={onClose}>
            STOCK<span className="text-blue-500">IQ</span>
          </NavLink>
          <button onClick={onClose} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <SearchAutocomplete
            onSelect={handleSelect}
            placeholder={t('searchPlaceholder')}
          />
        </div>

        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {navSections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-4' : ''}>
              {section.title && (
                <p className="px-3 mb-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {section.title}
                </p>
              )}
              {section.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Mi Perfil + Log Out */}
        <div className="px-3 py-2 border-t border-[var(--border)]">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                isActive
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
              }`
            }
          >
            <div className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[9px] font-bold text-blue-400">
              {initials}
            </div>
            {isEs ? 'Mi Perfil' : 'My Profile'}
          </NavLink>
          <button
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
            onClick={() => {/* Future: actual logout */}}
          >
            <LogOut className="w-4 h-4" />
            {isEs ? 'Cerrar sesión' : 'Log out'}
          </button>
        </div>

        <div className="p-4 border-t border-[var(--border)]">
          {/* Mock mode toggle */}
          <button
            onClick={toggleMock}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2 mb-3 rounded-lg text-xs font-medium transition-colors border ${
              mockEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>{isEs ? 'Modo Demo' : 'Demo Mode'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${mockEnabled ? 'bg-amber-500' : 'bg-[var(--border)]'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${mockEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
          </button>
          {mockEnabled && (
            <p className="text-[10px] text-amber-400/70 text-center mb-2">
              {mockLabel === 'auto'
                ? (isEs ? '⚡ Activado auto: límite API alcanzado' : '⚡ Auto-activated: API limit reached')
                : (isEs ? '🎭 Datos simulados — sin llamadas API' : '🎭 Simulated data — no API calls')}
            </p>
          )}

          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Database className="w-3 h-3 text-[var(--text-muted)]" />
            <span className="text-[10px] text-[var(--text-muted)]">
              API: {getRequestCount()}/250 {isEs ? 'hoy' : 'today'}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
            STOCKIQ v3.0 · {mockEnabled ? (isEs ? 'Datos simulados' : 'Simulated data') : t('footerRealData')}<br />
            {t('footerDisclaimer')}
          </p>
        </div>
      </aside>
    </>
  )
}
