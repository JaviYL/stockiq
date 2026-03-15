import { Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import UserMenu from './UserMenu'

function FlagES({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={`rounded-full border-2 ${active ? 'border-blue-500' : 'border-transparent'} transition-colors`}>
      <clipPath id="circleES"><circle cx="12" cy="12" r="11" /></clipPath>
      <g clipPath="url(#circleES)">
        <rect y="0" width="24" height="6" fill="#c60b1e" />
        <rect y="6" width="24" height="12" fill="#ffc400" />
        <rect y="18" width="24" height="6" fill="#c60b1e" />
      </g>
      <circle cx="12" cy="12" r="11" fill="none" stroke={active ? '#3b82f6' : 'var(--border)'} strokeWidth="1.5" />
    </svg>
  )
}

function FlagUS({ active }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className={`rounded-full border-2 ${active ? 'border-blue-500' : 'border-transparent'} transition-colors`}>
      <clipPath id="circleUS"><circle cx="12" cy="12" r="11" /></clipPath>
      <g clipPath="url(#circleUS)">
        <rect width="24" height="24" fill="#fff" />
        {[0, 2, 4, 6, 8, 10, 12].map(i => (
          <rect key={i} y={i * 1.85} width="24" height="1.85" fill="#b22234" />
        ))}
        <rect width="10" height="13" fill="#3c3b6e" />
        {[2, 4, 6, 8].map(x => [2, 5, 8, 11].map(y => (
          <circle key={`${x}-${y}`} cx={x} cy={y * 1.1 + 0.5} r="0.5" fill="#fff" />
        )))}
      </g>
      <circle cx="12" cy="12" r="11" fill="none" stroke={active ? '#3b82f6' : 'var(--border)'} strokeWidth="1.5" />
    </svg>
  )
}

export default function TopBar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const { lang, setLang } = useLanguage()

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-card)]">
      {/* Left: mobile hamburger + logo on mobile */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <Menu className="w-5 h-5" />
        </button>
        <span className="lg:hidden text-lg font-bold text-[var(--text-primary)] tracking-wider">
          STOCK<span className="text-blue-500">IQ</span>
        </span>
      </div>

      {/* Right: language + theme */}
      <div className="flex items-center gap-3">
        {/* Language switcher */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLang('es')}
            className="hover:scale-110 transition-transform"
            title="Español"
          >
            <FlagES active={lang === 'es'} />
          </button>
          <button
            onClick={() => setLang('en')}
            className="hover:scale-110 transition-transform"
            title="English"
          >
            <FlagUS active={lang === 'en'} />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border)]" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-sm"
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[var(--border)]" />

        {/* User account */}
        <UserMenu />
      </div>
    </div>
  )
}
