import { useState, useEffect } from 'react'
import { CalendarDays, Bell, BellOff, Loader2, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { getWatchlist } from '../services/watchlistService'
import { fetchCompanyData } from '../services/companyDataService'

// Attempt to get earnings data from FMP (may fail on free plan)
async function fetchEarningsCalendar(from, to) {
  const API_KEY = import.meta.env.VITE_FMP_API_KEY
  try {
    const url = `https://financialmodelingprep.com/stable/earning-calendar?from=${from}&to=${to}&apikey=${API_KEY}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data && Array.isArray(data)) return data
    return null
  } catch (_) { return null }
}

function getNextQuarterDates() {
  const now = new Date()
  const from = now.toISOString().split('T')[0]
  const future = new Date(now)
  future.setDate(future.getDate() + 90)
  const to = future.toISOString().split('T')[0]
  return { from, to }
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(dateStr) {
  if (!dateStr) return Infinity
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((d - now) / (1000 * 60 * 60 * 24))
}

// localStorage alerts
const ALERTS_KEY = 'stockiq_earnings_alerts'
function getAlerts() {
  try { return JSON.parse(localStorage.getItem(ALERTS_KEY)) || {} } catch (_) { return {} }
}
function setAlert(ticker, enabled) {
  const a = getAlerts()
  if (enabled) a[ticker] = true
  else delete a[ticker]
  try { localStorage.setItem(ALERTS_KEY, JSON.stringify(a)) } catch (_) {}
}
function hasAlert(ticker) {
  return !!getAlerts()[ticker]
}

export default function EarningsCalendar() {
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const isEs = lang === 'es'
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiAvailable, setApiAvailable] = useState(true)
  const [alerts, setAlerts] = useState(getAlerts())

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const { from, to } = getNextQuarterDates()
      const watchlist = getWatchlist()

      // Try FMP earnings calendar first
      const calendarData = await fetchEarningsCalendar(from, to)

      if (calendarData && calendarData.length > 0) {
        // Filter to watchlist if available, or show top earnings
        const filtered = watchlist.length > 0
          ? calendarData.filter(e => watchlist.includes(e.symbol))
          : calendarData.slice(0, 30)

        if (!cancelled) {
          setEarnings(filtered.map(e => ({
            ticker: e.symbol,
            date: e.date,
            epsEstimated: e.epsEstimated,
            revenueEstimated: e.revenueEstimated,
            time: e.time, // 'bmo' (before market open) or 'amc' (after market close)
          })).sort((a, b) => new Date(a.date) - new Date(b.date)))
          setApiAvailable(true)
        }
      } else {
        // Fallback: show watchlist companies with estimated next earnings
        setApiAvailable(false)
        const results = []
        for (const ticker of watchlist.slice(0, 20)) {
          try {
            const data = await fetchCompanyData(ticker)
            results.push({
              ticker,
              name: data.name,
              price: data.price,
              date: null, // Unknown
              sector: data.sector,
            })
          } catch (_) { /* skip */ }
        }
        if (!cancelled) setEarnings(results)
      }

      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const toggleAlert = (ticker) => {
    const enabled = !hasAlert(ticker)
    setAlert(ticker, enabled)
    setAlerts(getAlerts())

    // Request notification permission
    if (enabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  // Check and fire notifications for upcoming earnings
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const alertTickers = getAlerts()
    earnings.forEach(e => {
      if (alertTickers[e.ticker] && e.date) {
        const days = daysUntil(e.date)
        if (days === 1 || days === 0) {
          // Would fire notification — in a real app this would be a service worker
          console.log(`StockIQ: ${e.ticker} reports earnings ${days === 0 ? 'today' : 'tomorrow'}!`)
        }
      }
    })
  }, [earnings])

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <CalendarDays className="w-7 h-7 text-blue-500" />
          {isEs ? 'Calendario de Earnings' : 'Earnings Calendar'}
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {apiAvailable
            ? (isEs ? 'Proximas fechas de resultados de tus empresas' : 'Upcoming earnings dates for your companies')
            : (isEs ? 'Empresas de tu watchlist (fechas de earnings no disponibles en plan gratuito)' : 'Your watchlist companies (earnings dates not available on free plan)')
          }
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : earnings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-16 h-16 text-[var(--text-tertiary)] mb-4 opacity-30" />
          <p className="text-lg text-[var(--text-secondary)] mb-2">
            {isEs ? 'No hay datos de earnings' : 'No earnings data'}
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            {isEs
              ? 'Anade empresas a tu watchlist para ver sus proximos earnings'
              : 'Add companies to your watchlist to see their upcoming earnings'
            }
          </p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase">Ticker</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase">{isEs ? 'Fecha' : 'Date'}</th>
                {apiAvailable && (
                  <>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[var(--text-tertiary)] uppercase">{isEs ? 'Hora' : 'Time'}</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-[var(--text-tertiary)] uppercase">EPS Est.</th>
                  </>
                )}
                <th className="py-3 px-4 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase">{isEs ? 'Dias' : 'Days'}</th>
                <th className="py-3 px-4 text-center text-xs font-medium text-[var(--text-tertiary)] uppercase">{isEs ? 'Alerta' : 'Alert'}</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map((e, i) => {
                const days = e.date ? daysUntil(e.date) : null
                const isToday = days === 0
                const isSoon = days !== null && days <= 7 && days > 0
                return (
                  <tr
                    key={e.ticker + i}
                    className={`border-b border-[var(--border)]/50 transition-colors ${
                      isToday ? 'bg-amber-500/10' : 'hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={() => navigate(`/stock/${e.ticker}`)}
                        className="font-bold text-sm text-blue-400 hover:underline"
                      >
                        {e.ticker}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--text-primary)]">
                      {e.date ? formatDate(e.date) : (isEs ? 'Desconocida' : 'Unknown')}
                    </td>
                    {apiAvailable && (
                      <>
                        <td className="py-3 px-4 text-xs text-[var(--text-tertiary)]">
                          {e.time === 'bmo' ? (isEs ? 'Pre-apertura' : 'Pre-market')
                            : e.time === 'amc' ? (isEs ? 'Post-cierre' : 'After-hours')
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-[var(--text-primary)]">
                          {e.epsEstimated != null ? `$${e.epsEstimated.toFixed(2)}` : '-'}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-center">
                      {days !== null ? (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          isToday ? 'bg-amber-500/20 text-amber-400'
                            : isSoon ? 'bg-blue-500/20 text-blue-400'
                            : 'text-[var(--text-tertiary)]'
                        }`}>
                          {isToday ? (isEs ? 'HOY' : 'TODAY') : `${days}d`}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleAlert(e.ticker)}
                        className={`p-1.5 rounded transition-colors ${
                          alerts[e.ticker]
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {alerts[e.ticker] ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
