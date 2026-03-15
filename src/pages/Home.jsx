import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, BarChart3, GitCompareArrows, PieChart, Clock, Filter, Star, Loader2, ArrowRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import SearchAutocomplete from '../components/SearchAutocomplete'
import { getWatchlist } from '../services/watchlistService'
import { fetchCompanyData } from '../services/companyDataService'

function MiniCard({ ticker, onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetchCompanyData(ticker)
      .then(d => { if (!cancelled) setData(d) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ticker])

  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-center h-24">
        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      </div>
    )
  }
  if (!data) return null

  const isUp = (data.changePct || 0) >= 0
  return (
    <div
      onClick={() => onNavigate(ticker)}
      className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 cursor-pointer hover:border-blue-500/40 transition-all"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm text-blue-400">{data.ticker}</span>
        <div className={`flex items-center gap-0.5 text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? '+' : ''}{data.changePct?.toFixed(2)}%
        </div>
      </div>
      <p className="text-lg font-bold text-[var(--text-primary)]">${data.price?.toFixed(2)}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] truncate">{data.name}</p>
    </div>
  )
}

export default function Home({ onSearch, popularTickers = [] }) {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const isEs = lang === 'es'
  const [watchlist] = useState(() => getWatchlist())
  const hasWatchlist = watchlist.length > 0

  const handleNavigate = (ticker) => navigate(`/stock/${ticker}`)

  return (
    <div className="min-h-full flex flex-col px-4 py-8">
      {/* Header + Search — always visible */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
          STOCK<span className="text-blue-500">IQ</span>
        </h1>
        {!hasWatchlist && (
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
            {t('heroSubtitle')}
          </p>
        )}
      </div>

      <SearchAutocomplete
        onSelect={onSearch}
        placeholder={t('searchPlaceholderLong')}
        large
        className="w-full max-w-xl mx-auto mb-6"
      />

      {/* If no watchlist: show popular tickers + feature cards */}
      {!hasWatchlist && (
        <>
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {popularTickers.map(ticker => (
              <button
                key={ticker}
                onClick={() => onSearch(ticker)}
                className="group flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg hover:border-blue-500/40 transition-all"
              >
                <span className="font-semibold text-[var(--text-primary)] text-sm">{ticker}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl w-full mx-auto">
            {[
              { icon: BarChart3, title: t('featMetrics'), desc: t('featMetricsDesc'), iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
              { icon: TrendingUp, title: t('featChart'), desc: t('featChartDesc'), iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
              { icon: Filter, title: t('featDCF'), desc: t('featDCFDesc'), iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400' },
              { icon: BarChart3, title: t('featAI'), desc: t('featAIDesc'), iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
            ].map((feat, i) => (
              <div key={i} className="p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                <div className={`w-10 h-10 rounded-lg ${feat.iconBg} flex items-center justify-center mb-3`}>
                  <feat.icon className={`w-5 h-5 ${feat.iconColor}`} />
                </div>
                <h3 className="text-[var(--text-primary)] font-semibold text-sm mb-1">{feat.title}</h3>
                <p className="text-[var(--text-tertiary)] text-xs leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* If has watchlist: show dashboard */}
      {hasWatchlist && (
        <div className="max-w-5xl w-full mx-auto">
          {/* Watchlist summary */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              {isEs ? 'Tu Watchlist' : 'Your Watchlist'}
            </h2>
            <button
              onClick={() => navigate('/watchlist')}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isEs ? 'Ver todo' : 'View all'} <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
            {watchlist.slice(0, 10).map(ticker => (
              <MiniCard key={ticker} ticker={ticker} onNavigate={handleNavigate} />
            ))}
          </div>

          {/* Quick actions */}
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
            {isEs ? 'Herramientas' : 'Tools'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { path: '/comparator', icon: GitCompareArrows, label: isEs ? 'Comparador' : 'Comparator', desc: isEs ? 'Compara empresas lado a lado' : 'Compare companies side by side', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
              { path: '/portfolio', icon: PieChart, label: isEs ? 'Cartera' : 'Portfolio', desc: isEs ? 'Simula tu cartera ideal' : 'Simulate your ideal portfolio', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400' },
              { path: '/whatif', icon: Clock, label: 'What-If', desc: isEs ? '¿Qué habría pasado si...?' : 'What would have happened if...', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
              { path: '/screener', icon: Filter, label: 'Screener', desc: isEs ? 'Filtra por métricas' : 'Filter by metrics', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
            ].map(tool => (
              <button
                key={tool.path}
                onClick={() => navigate(tool.path)}
                className="flex items-start gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-left hover:border-blue-500/40 transition-all"
              >
                <div className={`w-9 h-9 rounded-lg ${tool.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{tool.label}</h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{tool.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Popular tickers */}
          <div className="flex flex-wrap gap-2">
            {popularTickers.map(ticker => (
              <button
                key={ticker}
                onClick={() => onSearch(ticker)}
                className="px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] rounded hover:text-[var(--text-primary)] hover:border-blue-500/50 transition-colors"
              >
                {ticker}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
