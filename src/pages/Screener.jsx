import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Search, TrendingUp, TrendingDown, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { getSnapshotInfo } from '../services/dataSnapshot'
import { fetchCompanyData } from '../services/companyDataService'

// Load all companies from snapshots (localStorage)
function loadCachedCompanies() {
  const companies = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('stockiq_snap_')) {
        const ticker = key.replace('stockiq_snap_', '')
        const raw = localStorage.getItem(key)
        if (raw) {
          const snap = JSON.parse(raw)
          if (snap.data && snap.data.profile) {
            companies.push({ ticker, snapshot: snap.data })
          }
        }
      }
    }
  } catch (_) { /* ignore */ }
  return companies
}

const FILTER_DEFS = [
  { key: 'per', label: { es: 'PER', en: 'PER' }, type: 'range', defaultMin: 0, defaultMax: 50 },
  { key: 'roe', label: { es: 'ROE (%)', en: 'ROE (%)' }, type: 'range', defaultMin: 0, defaultMax: 100 },
  { key: 'marginNeto', label: { es: 'Margen neto (%)', en: 'Net margin (%)' }, type: 'range', defaultMin: -20, defaultMax: 80 },
  { key: 'dividendYield', label: { es: 'Dividendo (%)', en: 'Dividend (%)' }, type: 'range', defaultMin: 0, defaultMax: 15 },
  { key: 'deudaNetaEbitda', label: { es: 'Deuda/EBITDA', en: 'Debt/EBITDA' }, type: 'range', defaultMin: -5, defaultMax: 10 },
  { key: 'fcfYield', label: { es: 'FCF Yield (%)', en: 'FCF Yield (%)' }, type: 'range', defaultMin: -5, defaultMax: 20 },
  { key: 'piotroski', label: { es: 'Piotroski', en: 'Piotroski' }, type: 'range', defaultMin: 0, defaultMax: 9 },
  { key: 'altmanZ', label: { es: 'Altman Z', en: 'Altman Z' }, type: 'range', defaultMin: -2, defaultMax: 15 },
]

function FilterRow({ def, value, onChange, lang }) {
  const label = def.label[lang] || def.label.en
  return (
    <div className="bg-[var(--bg-main)] border border-[var(--border)] rounded-lg p-3 hover:border-blue-500/30 transition-colors">
      <label className="block text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          placeholder="Min"
          value={value.min}
          onChange={e => onChange({ ...value, min: e.target.value })}
          className="flex-1 min-w-0 px-2.5 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-500/50"
        />
        <span className="text-[var(--text-tertiary)] text-xs font-medium">—</span>
        <input
          type="number"
          step="any"
          placeholder="Max"
          value={value.max}
          onChange={e => onChange({ ...value, max: e.target.value })}
          className="flex-1 min-w-0 px-2.5 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-md text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-500/50"
        />
      </div>
    </div>
  )
}

export default function Screener() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const isEs = lang === 'es'

  const [filters, setFilters] = useState(() =>
    Object.fromEntries(FILTER_DEFS.map(d => [d.key, { min: '', max: '' }]))
  )
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const handleFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setFilters(Object.fromEntries(FILTER_DEFS.map(d => [d.key, { min: '', max: '' }])))
    setResults([])
    setHasSearched(false)
  }

  const handleSearch = async () => {
    setLoading(true)
    setHasSearched(true)
    try {
      const cached = loadCachedCompanies()
      const processed = []

      for (const { ticker } of cached) {
        try {
          const data = await fetchCompanyData(ticker)
          if (data && data.metrics) {
            // Apply filters
            let passes = true
            for (const def of FILTER_DEFS) {
              const f = filters[def.key]
              const val = data.metrics[def.key]
              if (f.min !== '' && val < parseFloat(f.min)) { passes = false; break }
              if (f.max !== '' && val > parseFloat(f.max)) { passes = false; break }
            }
            if (passes) processed.push(data)
          }
        } catch (_) { /* skip failed companies */ }
      }

      setResults(processed)
    } catch (err) {
      console.error('Screener error:', err)
    } finally {
      setLoading(false)
    }
  }

  const sortedResults = useMemo(() => {
    if (!sortKey) return results
    return [...results].sort((a, b) => {
      let va = sortKey === 'ticker' ? a.ticker : (a.metrics?.[sortKey] ?? 0)
      let vb = sortKey === 'ticker' ? b.ticker : (b.metrics?.[sortKey] ?? 0)
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? va - vb : vb - va
    })
  }, [results, sortKey, sortDir])

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return null
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const snapshotInfo = getSnapshotInfo()

  const columns = [
    { key: 'ticker', label: 'Ticker' },
    { key: 'per', label: 'PER' },
    { key: 'roe', label: 'ROE' },
    { key: 'marginNeto', label: isEs ? 'M. Neto' : 'Net M.' },
    { key: 'fcfYield', label: 'FCF Y.' },
    { key: 'deudaNetaEbitda', label: isEs ? 'D/EBITDA' : 'D/EBITDA' },
    { key: 'dividendYield', label: isEs ? 'Div.' : 'Div.' },
    { key: 'piotroski', label: 'Piot.' },
    { key: 'altmanZ', label: 'Altman' },
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <Filter className="w-7 h-7 text-blue-500" />
          {isEs ? 'Screener' : 'Stock Screener'}
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {isEs
            ? `Filtra entre ${snapshotInfo.count} empresas guardadas en caché`
            : `Filter among ${snapshotInfo.count} cached companies`
          }
        </p>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FILTER_DEFS.map(def => (
            <FilterRow
              key={def.key}
              def={def}
              value={filters[def.key]}
              onChange={v => handleFilter(def.key, v)}
              lang={lang}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            {loading ? (isEs ? 'Buscando...' : 'Searching...') : (isEs ? 'Buscar' : 'Search')}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-x-auto">
          {sortedResults.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-tertiary)]">
              {isEs ? 'No se encontraron empresas con estos filtros' : 'No companies match these filters'}
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-[var(--border)]">
                <span className="text-sm text-[var(--text-secondary)]">
                  {sortedResults.length} {isEs ? 'resultados' : 'results'}
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                    {columns.map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="py-2.5 px-3 text-xs font-medium text-[var(--text-tertiary)] uppercase cursor-pointer hover:text-[var(--text-primary)] transition-colors text-left"
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          <SortIcon col={col.key} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map(c => (
                    <tr
                      key={c.ticker}
                      onClick={() => navigate(`/stock/${c.ticker}`)}
                      className="border-b border-[var(--border)]/50 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div>
                          <span className="font-bold text-sm text-blue-400">{c.ticker}</span>
                          <p className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[120px]">{c.name}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)]">{c.metrics.per?.toFixed(1)}x</td>
                      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)]">{c.metrics.roe?.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)]">{c.metrics.marginNeto?.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)]">{c.metrics.fcfYield?.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)]">{c.metrics.deudaNetaEbitda?.toFixed(1)}x</td>
                      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)]">{c.metrics.dividendYield?.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)]">{Math.round(c.metrics.piotroski)}</td>
                      <td className="py-2.5 px-3 text-sm text-[var(--text-primary)]">{c.metrics.altmanZ?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  )
}
