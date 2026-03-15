import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, ChevronDown, Loader2, TrendingUp, TrendingDown, Star, Search, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { INDICES, INDEX_NAMES } from '../data/indices'
import { fetchCompanyData } from '../services/companyDataService'
import { isInWatchlist, toggleWatchlist } from '../services/watchlistService'
import { getRequestCount } from '../services/fmpApi'
import { isMockMode } from '../services/mockDataService'

function CompanyRow({ ticker, onNavigate, onLoad, autoLoad }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const [inWL, setInWL] = useState(() => isInWatchlist(ticker))

  const loadData = () => {
    if (data || loading) return
    setLoading(true)
    fetchCompanyData(ticker)
      .then(d => { setData(d); if (onLoad) onLoad(ticker, true) })
      .catch(() => { setFailed(true); if (onLoad) onLoad(ticker, false) })
      .finally(() => setLoading(false))
  }

  // Auto-load in mock mode
  useEffect(() => {
    if (autoLoad && !data && !loading && !failed) {
      loadData()
    }
  }, [autoLoad])

  const handleWatchlist = (e) => {
    e.stopPropagation()
    toggleWatchlist(ticker)
    setInWL(!inWL)
  }

  // Not yet loaded — show clickable row
  if (!data && !loading && !failed) {
    return (
      <tr
        onClick={loadData}
        className="border-b border-[var(--border)]/50 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
      >
        <td className="py-2.5 px-3">
          <span className="font-bold text-sm text-blue-400">{ticker}</span>
        </td>
        <td colSpan="6" className="py-2.5 px-3 text-xs text-[var(--text-tertiary)] italic">
          Clic para cargar datos
        </td>
      </tr>
    )
  }

  if (loading) {
    return (
      <tr className="border-b border-[var(--border)]/50">
        <td className="py-2.5 px-3">
          <span className="font-bold text-sm text-blue-400">{ticker}</span>
        </td>
        <td colSpan="6" className="py-2.5 px-3">
          <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
        </td>
      </tr>
    )
  }

  if (failed || !data) {
    return (
      <tr className="border-b border-[var(--border)]/50">
        <td className="py-2.5 px-3">
          <span className="font-bold text-sm text-[var(--text-tertiary)]">{ticker}</span>
        </td>
        <td colSpan="5" className="py-2.5 px-3 text-xs text-red-400/70">
          Error al cargar
        </td>
        <td className="py-2.5 px-3">
          <button onClick={loadData} className="text-xs text-blue-400 hover:text-blue-300">Reintentar</button>
        </td>
      </tr>
    )
  }

  const isUp = (data.changePct || 0) >= 0

  return (
    <tr
      onClick={() => onNavigate(ticker)}
      className="border-b border-[var(--border)]/50 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
    >
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <button onClick={handleWatchlist} className="flex-shrink-0">
            <Star className={`w-3.5 h-3.5 ${inWL ? 'text-amber-400 fill-amber-400' : 'text-[var(--text-tertiary)]'}`} />
          </button>
          <div>
            <span className="font-bold text-sm text-blue-400">{data.ticker}</span>
            <p className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[150px]">{data.name}</p>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)] text-right">${data.price?.toFixed(2)}</td>
      <td className={`py-2.5 px-3 text-sm text-right ${isUp ? 'text-green-400' : 'text-red-400'}`}>
        <div className="flex items-center justify-end gap-1">
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isUp ? '+' : ''}{data.changePct?.toFixed(2)}%
        </div>
      </td>
      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)] text-right">{data.metrics?.per?.toFixed(1)}x</td>
      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)] text-right">{data.metrics?.roe?.toFixed(1)}%</td>
      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)] text-right">{data.metrics?.dividendYield?.toFixed(2)}%</td>
      <td className={`py-2.5 px-3 text-sm text-right font-medium ${
          (data.qualityScore || 0) >= 8 ? 'text-green-400' :
          (data.qualityScore || 0) >= 5 ? 'text-yellow-400' :
          'text-red-400'
        }`}>
          {data.qualityScore || 0}/{data.scorecardTotal || 0}
      </td>
    </tr>
  )
}

export default function IndexExplorer() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const isEs = lang === 'es'

  const [selectedIndex, setSelectedIndex] = useState('S&P 500')
  const [visibleCount, setVisibleCount] = useState(30)
  const [filter, setFilter] = useState('')
  const [loadedCount, setLoadedCount] = useState(0)

  const index = INDICES[selectedIndex]
  const filteredTickers = filter
    ? index.tickers.filter(t => t.toLowerCase().includes(filter.toLowerCase()))
    : index.tickers
  const visibleTickers = filteredTickers.slice(0, visibleCount)

  const handleNavigate = (ticker) => navigate(`/stock/${ticker}`)

  useEffect(() => {
    setVisibleCount(30)
    setFilter('')
    setLoadedCount(0)
  }, [selectedIndex])

  const handleLoad = () => setLoadedCount(prev => prev + 1)

  const apiCount = getRequestCount()

  // Batch load: load first 5 automatically
  const handleBatchLoad = () => {
    // This is handled by the individual rows — clicking "load" on each
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <Globe className="w-7 h-7 text-blue-500" />
          {isEs ? 'Explorar Índices' : 'Explore Indices'}
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {isEs
            ? 'Navega por los principales índices bursátiles del mundo'
            : 'Browse the world\'s major stock indices'
          }
        </p>
      </div>

      {/* API usage warning — hidden in mock mode */}
      {!isMockMode() && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-400">
            {isEs
              ? `API: ${apiCount}/250 hoy. Cada empresa usa 4 llamadas. Haz clic en cada fila para cargar sus datos bajo demanda.`
              : `API: ${apiCount}/250 today. Each company uses 4 calls. Click each row to load data on demand.`
            }
          </p>
        </div>
      )}

      {/* Index selector tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {INDEX_NAMES.map(name => (
          <button
            key={name}
            onClick={() => setSelectedIndex(name)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              selectedIndex === name
                ? 'bg-blue-600 text-white'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/50'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Index info + filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">
            {index.description} — <span className="text-[var(--text-tertiary)]">{index.exchange}</span>
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">
            {filteredTickers.length} {isEs ? 'empresas' : 'companies'}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={filter}
            onChange={e => { setFilter(e.target.value); setVisibleCount(30) }}
            placeholder={isEs ? 'Filtrar ticker...' : 'Filter ticker...'}
            className="pl-9 pr-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-500/50 w-48"
          />
        </div>
      </div>

      {/* Company table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
              <th className="py-2.5 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase text-left">{isEs ? 'Empresa' : 'Company'}</th>
              <th className="py-2.5 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase text-right">{isEs ? 'Precio' : 'Price'}</th>
              <th className="py-2.5 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase text-right">{isEs ? 'Cambio (1d)' : 'Change (1d)'}</th>
              <th className="py-2.5 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase text-right">PER</th>
              <th className="py-2.5 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase text-right">ROE</th>
              <th className="py-2.5 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase text-right">Div.</th>
              <th className="py-2.5 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase text-left">{isEs ? 'Calidad' : 'Quality'}</th>
            </tr>
          </thead>
          <tbody>
            {visibleTickers.map(ticker => (
              <CompanyRow key={ticker} ticker={ticker} onNavigate={handleNavigate} onLoad={handleLoad} autoLoad={isMockMode()} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {visibleCount < filteredTickers.length && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setVisibleCount(prev => prev + 30)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/50 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            {isEs ? `Mostrar más (${filteredTickers.length - visibleCount} restantes)` : `Show more (${filteredTickers.length - visibleCount} remaining)`}
          </button>
        </div>
      )}
    </div>
  )
}
