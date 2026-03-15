import React, { useState } from 'react'
import { GitCompareArrows, Loader2, X, TrendingUp, TrendingDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { fetchCompanyData } from '../services/companyDataService'
import SearchAutocomplete from '../components/SearchAutocomplete'
import CompanyLogo from '../components/CompanyLogo'

function formatNum(val, decimals = 2) {
  if (val == null || !isFinite(val)) return 'N/A'
  return val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function formatPrice(val) {
  if (val == null || !isFinite(val)) return 'N/A'
  return `$${formatNum(val)}`
}

function formatPct(val) {
  if (val == null || !isFinite(val)) return 'N/A'
  return `${formatNum(val)}%`
}

function formatMktCap(val) {
  if (val == null || !isFinite(val)) return 'N/A'
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`
  return `$${val.toLocaleString()}`
}

// Determine which value is "best" for a metric (higher or lower)
function bestOf(values, higherIsBetter = true) {
  const valid = values.filter(v => v != null && isFinite(v))
  if (valid.length === 0) return null
  return higherIsBetter ? Math.max(...valid) : Math.min(...valid)
}

function ComparisonRow({ label, values, format = 'num', higherIsBetter = true }) {
  const formatted = values.map(v => {
    if (v == null) return 'N/A'
    switch (format) {
      case 'price': return formatPrice(v)
      case 'pct': return formatPct(v)
      case 'mktcap': return formatMktCap(v)
      case 'x': return `${formatNum(v, 1)}x`
      case 'int': return Math.round(v).toString()
      default: return formatNum(v)
    }
  })

  const best = bestOf(values, higherIsBetter)
  const isQuality = format === 'int' && label.toLowerCase().includes('calidad') || label.toLowerCase() === 'quality'

  return (
    <tr className="border-b border-[var(--border)]/50">
      <td className="py-2.5 px-3 text-sm text-[var(--text-secondary)] font-medium">{label}</td>
      {formatted.map((val, i) => {
        const isBest = values[i] != null && isFinite(values[i]) && values[i] === best && values.filter(v => v === best).length < values.length
        let colorClass = isBest ? 'text-green-400' : 'text-[var(--text-primary)]'
        if (isQuality && values[i] != null) {
          colorClass = values[i] >= 8 ? 'text-green-400' : values[i] >= 5 ? 'text-yellow-400' : 'text-red-400'
        }
        return (
          <td key={i} className={`py-2.5 px-3 text-sm text-center font-medium ${colorClass}`}>
            {val}
          </td>
        )
      })}
    </tr>
  )
}

function CompanySummary({ data, onRemove }) {
  const { t } = useLanguage()
  const isUp = data.changePct >= 0
  const verdictColors = {
    'INFRAVALORADA': 'bg-green-500/20 text-green-400',
    'PRECIO JUSTO': 'bg-yellow-500/20 text-yellow-400',
    'SOBREVALORADA': 'bg-red-500/20 text-red-400',
  }

  return (
    <th className="py-3 px-3 text-center min-w-[160px]">
      <div className="flex items-center justify-center gap-2 mb-1">
        <CompanyLogo ticker={data.ticker} image={data.image} size={28} />
        <span className="font-bold text-lg text-blue-400">{data.ticker}</span>
        <button onClick={onRemove} className="text-[var(--text-tertiary)] hover:text-red-400 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-xs text-[var(--text-tertiary)] truncate max-w-[160px] mx-auto">{data.name}</p>
      <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{formatPrice(data.price)}</p>
      <div className={`flex items-center justify-center gap-1 text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isUp ? '+' : ''}{data.changePct?.toFixed(2)}%
      </div>
      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${verdictColors[data.verdict] || ''}`}>
        {t(data.verdict)}
      </span>
    </th>
  )
}

const COMPARATOR_KEY = 'stockiq_comparator_tickers'

function loadSavedTickers() {
  try {
    const raw = localStorage.getItem(COMPARATOR_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveTickers(tickers) {
  localStorage.setItem(COMPARATOR_KEY, JSON.stringify(tickers))
}

export default function Comparator() {
  const { lang } = useLanguage()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [initialized, setInitialized] = useState(false)

  // On mount, restore previously saved tickers
  React.useEffect(() => {
    const saved = loadSavedTickers()
    if (saved.length === 0) { setInitialized(true); return }
    let cancelled = false
    Promise.all(saved.map(t => fetchCompanyData(t).catch(() => null)))
      .then(results => {
        if (cancelled) return
        setCompanies(results.filter(Boolean))
        setInitialized(true)
      })
    return () => { cancelled = true }
  }, [])

  // Persist tickers whenever companies change (after init)
  React.useEffect(() => {
    if (!initialized) return
    saveTickers(companies.map(c => c.ticker))
  }, [companies, initialized])

  const handleAdd = async (ticker) => {
    const t = ticker.toUpperCase()
    if (companies.find(c => c.ticker === t)) return
    if (companies.length >= 6) {
      setError(lang === 'es' ? 'Máximo 6 empresas' : 'Maximum 6 companies')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const data = await fetchCompanyData(t)
      setCompanies(prev => [...prev, data])
    } catch (err) {
      const msg = err.message || String(err)
      if (msg.includes('429') || msg.includes('rate') || msg.includes('limit')) {
        setError(lang === 'es'
          ? 'Límite de llamadas API alcanzado. Espera unos minutos e intenta de nuevo.'
          : 'API rate limit reached. Wait a few minutes and try again.')
      } else {
        setError(lang === 'es'
          ? `Error al cargar ${t}: ${msg}`
          : `Error loading ${t}: ${msg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = (ticker) => {
    setCompanies(prev => prev.filter(c => c.ticker !== ticker))
  }

  const vals = (fn) => companies.map(fn)

  const sections = [
    {
      title: lang === 'es' ? 'Valoración' : 'Valuation',
      rows: [
        { label: 'PER', values: vals(c => c.metrics.per), format: 'x', higherIsBetter: false },
        { label: 'P/B', values: vals(c => c.metrics.pb), format: 'x', higherIsBetter: false },
        { label: 'EV/EBITDA', values: vals(c => c.metrics.evEbitda), format: 'x', higherIsBetter: false },
        { label: lang === 'es' ? 'Valor intrínseco' : 'Intrinsic value', values: vals(c => c.intrinsicValue), format: 'price' },
        { label: lang === 'es' ? 'Margen seguridad' : 'Safety margin', values: vals(c => c.safetyMargin), format: 'pct' },
      ]
    },
    {
      title: lang === 'es' ? 'Rentabilidad' : 'Profitability',
      rows: [
        { label: 'ROE', values: vals(c => c.metrics.roe), format: 'pct' },
        { label: 'ROA', values: vals(c => c.metrics.roa), format: 'pct' },
        { label: 'ROIC', values: vals(c => c.metrics.roic), format: 'pct' },
      ]
    },
    {
      title: lang === 'es' ? 'Márgenes' : 'Margins',
      rows: [
        { label: lang === 'es' ? 'Margen bruto' : 'Gross margin', values: vals(c => c.metrics.marginBruto), format: 'pct' },
        { label: lang === 'es' ? 'Margen neto' : 'Net margin', values: vals(c => c.metrics.marginNeto), format: 'pct' },
        { label: lang === 'es' ? 'Margen EBITDA' : 'EBITDA margin', values: vals(c => c.metrics.marginEbitda), format: 'pct' },
        { label: 'FCF Yield', values: vals(c => c.metrics.fcfYield), format: 'pct' },
      ]
    },
    {
      title: lang === 'es' ? 'Deuda y solvencia' : 'Debt & solvency',
      rows: [
        { label: lang === 'es' ? 'Deuda neta/EBITDA' : 'Net debt/EBITDA', values: vals(c => c.metrics.deudaNetaEbitda), format: 'x', higherIsBetter: false },
        { label: lang === 'es' ? 'Cobertura intereses' : 'Interest coverage', values: vals(c => c.metrics.interestCoverage), format: 'x' },
        { label: 'Piotroski F-Score', values: vals(c => c.metrics.piotroski), format: 'int' },
        { label: 'Altman Z-Score', values: vals(c => c.metrics.altmanZ), format: 'num' },
      ]
    },
    {
      title: lang === 'es' ? 'Dividendo' : 'Dividend',
      rows: [
        { label: lang === 'es' ? 'Rendimiento' : 'Yield', values: vals(c => c.metrics.dividendYield), format: 'pct' },
        { label: 'Payout', values: vals(c => c.metrics.payoutRatio), format: 'pct', higherIsBetter: false },
      ]
    },
    {
      title: lang === 'es' ? 'General' : 'General',
      rows: [
        { label: 'Market Cap', values: vals(c => c.marketCap), format: 'mktcap' },
        { label: 'WACC', values: vals(c => c.metrics.wacc), format: 'pct', higherIsBetter: false },
        { label: lang === 'es' ? 'Calidad' : 'Quality', values: vals(c => c.qualityScore), format: 'int' },
        { label: 'Graham Number', values: vals(c => c.metrics.grahamNumber), format: 'price' },
      ]
    },
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <GitCompareArrows className="w-7 h-7 text-blue-500" />
          {lang === 'es' ? 'Comparador' : 'Comparator'}
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {lang === 'es'
            ? 'Compara hasta 6 empresas lado a lado'
            : 'Compare up to 6 companies side by side'
          }
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <SearchAutocomplete
          onSelect={handleAdd}
          placeholder={lang === 'es' ? 'Añadir empresa...' : 'Add company...'}
          className="w-full max-w-md"
        />
        {loading && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-4">{error}</p>
      )}

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GitCompareArrows className="w-16 h-16 text-[var(--text-tertiary)] mb-4 opacity-30" />
          <p className="text-lg text-[var(--text-secondary)] mb-2">
            {lang === 'es' ? 'Añade empresas para comparar' : 'Add companies to compare'}
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            {lang === 'es'
              ? 'Busca y selecciona 2 o más empresas para ver sus métricas lado a lado'
              : 'Search and select 2 or more companies to see their metrics side by side'
            }
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-3 px-3 text-left text-sm font-medium text-[var(--text-tertiary)] min-w-[140px]">
                  {lang === 'es' ? 'Métrica' : 'Metric'}
                </th>
                {companies.map(c => (
                  <CompanySummary key={c.ticker} data={c} onRemove={() => handleRemove(c.ticker)} />
                ))}
              </tr>
            </thead>
            <tbody>
              {sections.map(section => (
                <React.Fragment key={section.title}>
                  <tr className="bg-[var(--bg-hover)]">
                    <td colSpan={companies.length + 1} className="py-2 px-3 text-xs font-bold text-blue-400 uppercase tracking-wider">
                      {section.title}
                    </td>
                  </tr>
                  {section.rows.map(row => (
                    <ComparisonRow
                      key={row.label}
                      label={row.label}
                      values={row.values}
                      format={row.format}
                      higherIsBetter={row.higherIsBetter}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
