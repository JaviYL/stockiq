import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Trash2, TrendingUp, TrendingDown, Loader2, Plus } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getWatchlist, removeFromWatchlist } from '../services/watchlistService'
import { fetchCompanyData } from '../services/companyDataService'
import SearchAutocomplete from '../components/SearchAutocomplete'
import { addToWatchlist } from '../services/watchlistService'
import CompanyLogo from '../components/CompanyLogo'
import { logActivity, ACTIVITY } from '../services/profileService'

function formatPrice(value) {
  if (value == null || !isFinite(value)) return 'N/A'
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatMarketCap(value) {
  if (value == null || !isFinite(value)) return 'N/A'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
  return `$${value.toLocaleString()}`
}

function WatchlistCard({ ticker, onRemove, onNavigate }) {
  const { t, lang } = useLanguage()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchCompanyData(ticker)
      .then(d => { if (!cancelled) setData(d) })
      .catch(e => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ticker])

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex items-center justify-center min-h-[140px]">
        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-[var(--text-primary)]">{ticker}</span>
          <button onClick={() => onRemove(ticker)} className="text-[var(--text-tertiary)] hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-red-400">{error || 'Error'}</p>
      </div>
    )
  }

  const isUp = data.changePct >= 0
  const verdictColors = {
    'INFRAVALORADA': 'text-green-400',
    'PRECIO JUSTO': 'text-yellow-400',
    'SOBREVALORADA': 'text-red-400',
  }

  return (
    <div
      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 cursor-pointer hover:border-blue-500/40 transition-all group"
      onClick={() => onNavigate(ticker)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <CompanyLogo ticker={data.ticker} image={data.image} size={32} />
          <div>
            <h3 className="font-bold text-[var(--text-primary)] text-lg group-hover:text-blue-400 transition-colors">{data.ticker}</h3>
            <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[180px]">{data.name}</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(ticker) }}
          className="text-[var(--text-tertiary)] hover:text-red-400 transition-colors p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{formatPrice(data.price)}</p>
          <div className={`flex items-center gap-1 mt-0.5 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="text-xs font-semibold">
              {isUp ? '+' : ''}{data.changePct?.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs font-bold ${verdictColors[data.verdict] || 'text-[var(--text-secondary)]'}`}>
            {t(data.verdict)}
          </span>
          <p className="text-[10px] mt-0.5">
            <span className="text-[var(--text-tertiary)]">{lang === 'es' ? 'Calidad' : 'Quality'}: </span>
            <span className={`font-medium ${(data.qualityScore || 0) >= 8 ? 'text-green-400' : (data.qualityScore || 0) >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{data.qualityScore}/{data.scorecardTotal}</span>
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {formatMarketCap(data.marketCap)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Watchlist() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const [watchlist, setWatchlist] = useState(getWatchlist())
  const [showAdd, setShowAdd] = useState(false)

  const handleRemove = (ticker) => {
    const updated = removeFromWatchlist(ticker)
    logActivity(ACTIVITY.WATCHLIST_REMOVE, ticker)
    setWatchlist([...updated])
  }

  const handleAdd = (ticker) => {
    addToWatchlist(ticker)
    logActivity(ACTIVITY.WATCHLIST_ADD, ticker)
    setWatchlist([...getWatchlist()])
    setShowAdd(false)
  }

  const handleNavigate = (ticker) => {
    navigate(`/stock/${ticker}`)
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
            <Star className="w-7 h-7 text-amber-400" />
            {lang === 'es' ? 'Mi Watchlist' : 'My Watchlist'}
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {lang === 'es'
              ? `${watchlist.length} ${watchlist.length === 1 ? 'empresa' : 'empresas'} en seguimiento`
              : `${watchlist.length} ${watchlist.length === 1 ? 'company' : 'companies'} tracked`
            }
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {lang === 'es' ? 'Añadir' : 'Add'}
        </button>
      </div>

      {showAdd && (
        <div className="mb-6">
          <SearchAutocomplete
            onSelect={handleAdd}
            placeholder={lang === 'es' ? 'Buscar empresa para añadir...' : 'Search company to add...'}
            large
            className="max-w-xl"
          />
        </div>
      )}

      {watchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Star className="w-16 h-16 text-[var(--text-tertiary)] mb-4 opacity-30" />
          <p className="text-lg text-[var(--text-secondary)] mb-2">
            {lang === 'es' ? 'Tu watchlist está vacía' : 'Your watchlist is empty'}
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mb-6">
            {lang === 'es'
              ? 'Añade empresas para hacer seguimiento de tus favoritas'
              : 'Add companies to track your favorites'
            }
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {lang === 'es' ? 'Añadir primera empresa' : 'Add first company'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {watchlist.map(ticker => (
            <WatchlistCard
              key={ticker}
              ticker={ticker}
              onRemove={handleRemove}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}
