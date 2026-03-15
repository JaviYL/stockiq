import { useState, useEffect, useMemo } from 'react'
import { PieChart, Trash2, Loader2, Plus, Edit3, Check, X, ChevronLeft, TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useCurrency } from '../context/CurrencyContext'
import { fetchCompanyData } from '../services/companyDataService'
import SearchAutocomplete from '../components/SearchAutocomplete'
import {
  getPortfolios, getPortfolio, createPortfolio, updatePortfolio, deletePortfolio,
  addHolding, removeHolding as removeHoldingSvc, updateHoldingAmount,
  calculateProjection, generateProjectionSeries
} from '../services/portfolioService'
import { simulateBuyPrice, getHoldingCurrentValue } from '../services/simulationUtils'
import { logActivity, ACTIVITY } from '../services/profileService'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

// ─── Portfolio List View ───
function PortfolioList({ portfolios, onSelect, onCreate, onDelete, isEs, fmtEur }) {
  const [newName, setNewName] = useState('')

  const handleCreate = () => {
    const name = newName.trim() || (isEs ? 'Mi Cartera' : 'My Portfolio')
    onCreate(name)
    setNewName('')
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <PieChart className="w-7 h-7 text-blue-500" />
          {isEs ? 'Mis Carteras' : 'My Portfolios'}
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {isEs ? 'Gestiona y analiza tus carteras de inversion' : 'Manage and analyze your investment portfolios'}
        </p>
      </div>

      {/* Create new */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder={isEs ? 'Nombre de la nueva cartera...' : 'New portfolio name...'}
          className="flex-1 px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-500/50"
        />
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isEs ? 'Crear' : 'Create'}
        </button>
      </div>

      {portfolios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PieChart className="w-16 h-16 text-[var(--text-tertiary)] mb-4 opacity-30" />
          <p className="text-lg text-[var(--text-secondary)] mb-2">
            {isEs ? 'No tienes carteras todavia' : 'No portfolios yet'}
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            {isEs ? 'Crea tu primera cartera para empezar a analizar' : 'Create your first portfolio to start analyzing'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {portfolios.map(p => {
            const totalInvested = p.holdings.reduce((sum, h) => sum + (h.amount || 0), 0)
            const currentValue = p.holdings.reduce((sum, h) => sum + getHoldingCurrentValue(h, null), 0)
            const gainPct = totalInvested > 0 ? ((currentValue / totalInvested) - 1) * 100 : 0
            const maxTags = 4
            const visibleHoldings = p.holdings.slice(0, maxTags)
            const remaining = p.holdings.length - maxTags
            return (
              <div
                key={p.id}
                onClick={() => onSelect(p.id)}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 cursor-pointer hover:border-blue-500/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">{p.name}</h3>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {isEs ? 'Creada' : 'Created'}: {new Date(p.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(p.id) }}
                    className="text-[var(--text-tertiary)] hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {p.holdings.length} {isEs ? 'activos' : 'assets'}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-400">{fmtEur(currentValue)}</span>
                    <p className="text-[10px] text-[var(--text-tertiary)]">{isEs ? 'valor actual' : 'current value'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {isEs ? 'Invertido' : 'Invested'}: {fmtEur(totalInvested)}
                  </span>
                  <span className={`text-xs font-medium ${gainPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%
                  </span>
                </div>
                {p.holdings.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3">
                    {visibleHoldings.map(h => (
                      <span key={h.ticker} className="px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] bg-[var(--bg-main)] border border-[var(--border)] rounded">
                        {h.ticker}
                      </span>
                    ))}
                    {remaining > 0 && (
                      <span className="text-[10px] text-[var(--text-tertiary)] ml-0.5">
                        +{remaining} {isEs ? 'más' : 'more'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Interactive Evolution Chart (SVG) with hover tooltip ───
function EvolutionChart({ historical, projected, isEs }) {
  const [hover, setHover] = useState(null)

  if (historical.length < 2 && projected.length < 2) return null

  const all = [...historical, ...projected.slice(1)]
  const values = all.map(p => p.value)
  const minVal = Math.min(...values) * 0.95
  const maxVal = Math.max(...values) * 1.05
  const range = maxVal - minVal || 1

  const W = 600
  const H = 200
  const padX = 0
  const padY = 10
  const chartH = H - padY * 2

  const toX = (i) => padX + (i / (all.length - 1)) * (W - padX * 2)
  const toY = (v) => padY + (1 - (v - minVal) / range) * chartH

  const histLen = historical.length
  const histPath = historical.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(p.value).toFixed(1)}`).join(' ')
  const histArea = histPath + ` L${toX(histLen - 1).toFixed(1)},${(padY + chartH).toFixed(1)} L${toX(0).toFixed(1)},${(padY + chartH).toFixed(1)} Z`

  const projPath = projected.map((p, i) => {
    const idx = histLen - 1 + i
    return `${i === 0 ? 'M' : 'L'}${toX(idx).toFixed(1)},${toY(p.value).toFixed(1)}`
  }).join(' ')
  const projArea = projected.length > 1
    ? projPath + ` L${toX(all.length - 1).toFixed(1)},${(padY + chartH).toFixed(1)} L${toX(histLen - 1).toFixed(1)},${(padY + chartH).toFixed(1)} Z`
    : ''

  const nowX = toX(histLen - 1)
  const startLabel = historical[0]?.date?.slice(0, 7) || ''
  const endLabel = all[all.length - 1]?.date?.slice(0, 7) || ''

  const handleMouseMove = (e) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * W
    let closestIdx = 0
    let closestDist = Infinity
    all.forEach((p, i) => {
      const dist = Math.abs(toX(i) - mouseX)
      if (dist < closestDist) { closestDist = dist; closestIdx = i }
    })
    const point = all[closestIdx]
    setHover({ idx: closestIdx, x: toX(closestIdx), y: toY(point.value), value: point.value, date: point.date, isProjected: closestIdx >= histLen })
  }

  // Tooltip positioning — clamp within SVG bounds
  const tooltipW = 120
  const tooltipH = 40
  const getTooltipX = (hx) => Math.max(2, Math.min(hx - tooltipW / 2, W - tooltipW - 2))
  const getTooltipY = (hy) => hy > tooltipH + 14 ? hy - tooltipH - 8 : hy + 14
  const getTooltipTextX = (hx) => getTooltipX(hx) + tooltipW / 2

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
        {isEs ? 'Evolución y proyección' : 'Evolution & projection'}
      </h3>
      <svg
        viewBox={`0 0 ${W} ${H + 28}`}
        className="w-full cursor-crosshair"
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = padY + (1 - pct) * chartH
          const val = minVal + pct * range
          return (
            <g key={pct}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} stroke="var(--border)" strokeWidth="0.5" />
              <text x={W - 2} y={y - 3} textAnchor="end" fill="var(--text-tertiary)" fontSize="9">
                {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toFixed(0)}
              </text>
            </g>
          )
        })}

        {/* Area fills */}
        <path d={histArea} fill="#3b82f6" opacity="0.08" />
        {projected.length > 1 && <path d={projArea} fill="#93c5fd" opacity="0.06" />}

        {/* Now divider */}
        {projected.length > 1 && (
          <>
            <line x1={nowX} y1={padY} x2={nowX} y2={padY + chartH} stroke="var(--text-tertiary)" strokeWidth="0.5" strokeDasharray="4,4" />
            <text x={nowX} y={H + 4} textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">{isEs ? 'Hoy' : 'Today'}</text>
          </>
        )}

        {/* Lines */}
        <path d={histPath} fill="none" stroke="#3b82f6" strokeWidth="2" />
        {projected.length > 1 && <path d={projPath} fill="none" stroke="#93c5fd" strokeWidth="2" strokeDasharray="5,4" opacity="0.8" />}

        {/* Hover indicator */}
        {hover && (
          <>
            <line x1={hover.x} y1={padY} x2={hover.x} y2={padY + chartH} stroke={hover.isProjected ? '#93c5fd' : '#3b82f6'} strokeWidth="1" opacity="0.5" />
            <circle cx={hover.x} cy={hover.y} r="4" fill={hover.isProjected ? '#93c5fd' : '#3b82f6'} stroke="var(--bg-card)" strokeWidth="2" />
            <rect x={getTooltipX(hover.x)} y={getTooltipY(hover.y)} width={tooltipW} height={tooltipH} rx="5" fill="var(--bg-main)" stroke="var(--border)" strokeWidth="0.5" opacity="0.95" />
            <text x={getTooltipTextX(hover.x)} y={getTooltipY(hover.y) + 16} textAnchor="middle" fill="var(--text-tertiary)" fontSize="9">
              {hover.date} {hover.isProjected ? (isEs ? '(proy.)' : '(proj.)') : ''}
            </text>
            <text x={getTooltipTextX(hover.x)} y={getTooltipY(hover.y) + 32} textAnchor="middle" fill={hover.isProjected ? '#93c5fd' : '#3b82f6'} fontSize="11" fontWeight="bold">
              {hover.value >= 1000 ? `${(hover.value / 1000).toFixed(1)}k` : hover.value.toFixed(0)} EUR
            </text>
          </>
        )}

        {/* Date labels */}
        <text x={padX + 2} y={H + 18} fill="var(--text-tertiary)" fontSize="9">{startLabel}</text>
        <text x={W - padX - 2} y={H + 18} textAnchor="end" fill="var(--text-tertiary)" fontSize="9">{endLabel}</text>

        {/* Endpoint dots (hidden on hover) */}
        {!hover && historical.length > 0 && <circle cx={toX(0)} cy={toY(historical[0].value)} r="3" fill="#3b82f6" />}
        {!hover && historical.length > 0 && <circle cx={toX(histLen - 1)} cy={toY(historical[histLen - 1].value)} r="3" fill="#3b82f6" />}
        {!hover && projected.length > 1 && <circle cx={toX(all.length - 1)} cy={toY(projected[projected.length - 1].value)} r="3" fill="#93c5fd" />}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-tertiary)]">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-blue-500 rounded" />
          <span>{isEs ? 'Histórico' : 'Historical'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #93c5fd 0, #93c5fd 4px, transparent 4px, transparent 7px)' }} />
          <span>{isEs ? 'Proyección' : 'Projection'}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Pie Chart with Hover Tooltip ───
function PieChartWithTooltip({ holdings, totalInvested, displayValue, isEs }) {
  const [hoverIdx, setHoverIdx] = useState(null)

  const slices = []
  let cumulative = 0
  holdings.forEach((h, i) => {
    const pct = totalInvested > 0 ? h.amount / totalInvested : 0
    const start = cumulative * 360
    cumulative += pct
    const end = cumulative * 360
    slices.push({ ...h, pct, start, end, color: COLORS[i % COLORS.length], idx: i })
  })

  const centerVal = displayValue || totalInvested

  return (
    <div className="relative flex items-center justify-center mb-3">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {slices.map((s) => {
          if (s.pct <= 0.001) return null
          if (s.pct >= 0.999) return (
            <circle key={s.idx} cx="90" cy="90" r="72" fill={s.color}
              opacity={hoverIdx !== null && hoverIdx !== s.idx ? 0.4 : 1}
              onMouseEnter={() => setHoverIdx(s.idx)} onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer transition-opacity" />
          )
          const startRad = (s.start - 90) * Math.PI / 180
          const endRad = (s.end - 90) * Math.PI / 180
          const largeArc = s.end - s.start > 180 ? 1 : 0
          const r = hoverIdx === s.idx ? 75 : 72
          const x1 = 90 + r * Math.cos(startRad)
          const y1 = 90 + r * Math.sin(startRad)
          const x2 = 90 + r * Math.cos(endRad)
          const y2 = 90 + r * Math.sin(endRad)
          return (
            <path key={s.idx}
              d={`M90,90 L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
              fill={s.color}
              opacity={hoverIdx !== null && hoverIdx !== s.idx ? 0.4 : 1}
              onMouseEnter={() => setHoverIdx(s.idx)}
              onMouseLeave={() => setHoverIdx(null)}
              className="cursor-pointer transition-opacity"
            />
          )
        })}
        <circle cx="90" cy="90" r="44" fill="var(--bg-card)" />
        <text x="90" y="86" textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontWeight="bold">
          {hoverIdx !== null
            ? `${(slices[hoverIdx]?.pct * 100).toFixed(1)}%`
            : centerVal >= 1000 ? `${(centerVal / 1000).toFixed(1)}k` : centerVal.toFixed(0)
          }
        </text>
        <text x="90" y="100" textAnchor="middle" fill="var(--text-tertiary)" fontSize="10">
          {hoverIdx !== null ? slices[hoverIdx]?.ticker : 'EUR'}
        </text>
      </svg>
    </div>
  )
}

// ─── Portfolio Detail View ───
function PortfolioDetail({ portfolioId, onBack, isEs, lang, fmtEur }) {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(false)
  const [liveData, setLiveData] = useState({})
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [targetDate, setTargetDate] = useState('2030-01-01')

  // Load portfolio
  useEffect(() => {
    const p = getPortfolio(portfolioId)
    if (p) {
      setPortfolio(p)
      setNameInput(p.name)
    }
  }, [portfolioId])

  // Fetch live data for all holdings
  useEffect(() => {
    if (!portfolio || portfolio.holdings.length === 0) return
    let cancelled = false
    portfolio.holdings.forEach(h => {
      if (liveData[h.ticker]) return
      fetchCompanyData(h.ticker)
        .then(data => {
          if (!cancelled) setLiveData(prev => ({ ...prev, [h.ticker]: data }))
        })
        .catch(() => {})
    })
    return () => { cancelled = true }
  }, [portfolio?.holdings?.length])

  if (!portfolio) return null

  const totalInvested = portfolio.holdings.reduce((sum, h) => sum + (h.amount || 0), 0)
  const getPercent = (amount) => totalInvested > 0 ? (amount / totalInvested) * 100 : 0

  // Calculate live market value per holding using shared utility
  const getHoldingLiveValue = (h) => getHoldingCurrentValue(h, liveData[h.ticker])

  // Current portfolio market value = sum of all holdings' live values
  const currentValue = portfolio.holdings.reduce((sum, h) => sum + getHoldingLiveValue(h), 0)

  // Weighted metrics
  const weightedMetric = (key) => {
    if (portfolio.holdings.length === 0 || totalInvested === 0) return 0
    return portfolio.holdings.reduce((sum, h) => {
      const data = liveData[h.ticker]
      return sum + ((data?.metrics?.[key]) || 0) * ((h.amount || 0) / totalInvested)
    }, 0)
  }

  const avgQuality = portfolio.holdings.length > 0 && totalInvested > 0
    ? portfolio.holdings.reduce((sum, h) => {
        const data = liveData[h.ticker]
        return sum + ((data?.qualityScore) || 0) * ((h.amount || 0) / totalInvested)
      }, 0)
    : 0

  const avgDividend = weightedMetric('dividendYield')
  const estimatedDividendIncome = currentValue * (avgDividend / 100)

  // Sector translation map
  const sectorTranslations = {
    'Technology': 'Tecnología',
    'Financial Services': 'Servicios Financieros',
    'Healthcare': 'Salud',
    'Consumer Cyclical': 'Consumo Cíclico',
    'Consumer Defensive': 'Consumo Defensivo',
    'Communication Services': 'Comunicación',
    'Industrials': 'Industria',
    'Energy': 'Energía',
    'Utilities': 'Servicios Públicos',
    'Real Estate': 'Inmobiliario',
    'Basic Materials': 'Materiales Básicos',
    'Other': 'Otro',
  }

  // Sectors
  const sectors = {}
  portfolio.holdings.forEach(h => {
    const data = liveData[h.ticker]
    const rawSector = data?.sector || 'Other'
    const s = isEs ? (sectorTranslations[rawSector] || rawSector) : rawSector
    sectors[s] = (sectors[s] || 0) + getPercent(h.amount)
  })

  // Projection
  const projection = calculateProjection(totalInvested, currentValue, portfolio.startDate, targetDate)
  const series = generateProjectionSeries(totalInvested, currentValue, portfolio.startDate, targetDate)

  // Handlers
  const handleAddHolding = async (ticker) => {
    const t = ticker.toUpperCase()
    if (portfolio.holdings.find(h => h.ticker === t)) return
    if (portfolio.holdings.length >= 50) return

    setLoading(true)
    try {
      const data = await fetchCompanyData(t)
      const currentPrice = data.price || 0
      // Simulate a past buy price for demo mode (shared utility for consistency)
      const buyPrice = simulateBuyPrice(t, currentPrice)
      const defaultAmount = 1000
      const shares = buyPrice > 0 ? defaultAmount / buyPrice : 0
      const holding = {
        ticker: t,
        name: data.name,
        amount: defaultAmount,
        buyPrice: Math.round(buyPrice * 100) / 100,
        shares,
        sector: data.sector,
        image: data.image,
        addedAt: new Date().toISOString(),
      }
      addHolding(portfolioId, holding)
      logActivity(ACTIVITY.HOLDING_ADD, `${t} — ${data.name}`)
      setPortfolio(getPortfolio(portfolioId))
      setLiveData(prev => ({ ...prev, [t]: data }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveHolding = (ticker) => {
    removeHoldingSvc(portfolioId, ticker)
    logActivity(ACTIVITY.HOLDING_REMOVE, ticker)
    setPortfolio(getPortfolio(portfolioId))
  }

  const handleAmountChange = (ticker, amount) => {
    const holding = portfolio.holdings.find(h => h.ticker === ticker)
    const currentPrice = holding?.buyPrice || liveData[ticker]?.price || null
    updateHoldingAmount(portfolioId, ticker, Number(amount) || 0, currentPrice)
    setPortfolio(getPortfolio(portfolioId))
  }

  const handleSaveName = () => {
    updatePortfolio(portfolioId, { name: nameInput.trim() || portfolio.name })
    setPortfolio(getPortfolio(portfolioId))
    setEditingName(false)
  }

  const handleStartDateChange = (date) => {
    updatePortfolio(portfolioId, { startDate: date })
    setPortfolio(getPortfolio(portfolioId))
  }


  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                className="text-2xl font-bold bg-transparent text-[var(--text-primary)] border-b-2 border-blue-500 outline-none"
                autoFocus
              />
              <button onClick={handleSaveName} className="text-green-400 hover:text-green-300 p-1">
                <Check className="w-5 h-5" />
              </button>
              <button onClick={() => { setEditingName(false); setNameInput(portfolio.name) }} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{portfolio.name}</h1>
              <button onClick={() => setEditingName(true)} className="text-[var(--text-tertiary)] hover:text-blue-400 p-1">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Config row: add company + start date + target date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 sm:col-span-1">
          <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <Plus className="w-3 h-3" />
            {isEs ? 'Añadir empresa' : 'Add company'}
          </label>
          <div className="flex items-center gap-1.5">
            <SearchAutocomplete
              onSelect={handleAddHolding}
              placeholder="AAPL, MSFT..."
              className="flex-1"
            />
            {loading && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
          </div>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
          <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <Calendar className="w-3 h-3" />
            {isEs ? 'Fecha inicio' : 'Start date'}
          </label>
          <input
            type="date"
            value={portfolio.startDate}
            onChange={e => handleStartDateChange(e.target.value)}
            className="w-full px-2 py-1.5 bg-[var(--bg-main)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3">
          <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-1 mb-1.5">
            <Target className="w-3 h-3" />
            {isEs ? 'Proyección — fecha objetivo' : 'Projection — target date'}
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            className="w-full px-2 py-1.5 bg-[var(--bg-main)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
          />
          <p className="text-[9px] text-[var(--text-tertiary)] mt-1 opacity-60">{isEs ? 'Opcional' : 'Optional'}</p>
        </div>
      </div>

      {/* Summary cards */}
      {totalInvested > 0 && projection.yearsElapsed > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          {[
            { label: isEs ? 'Inversión inicial' : 'Initial investment', value: fmtEur(totalInvested), color: 'text-[var(--text-primary)]' },
            { label: isEs ? 'Valor actual' : 'Current value', value: fmtEur(currentValue), color: 'text-blue-400' },
            { label: isEs ? 'Rentabilidad total' : 'Total return', value: `${projection.totalReturn >= 0 ? '+' : ''}${projection.totalReturn.toFixed(1)}%`, color: projection.totalReturn >= 0 ? 'text-green-400' : 'text-red-400' },
            { label: 'CAGR', value: `${projection.cagr.toFixed(2)}%`, color: projection.cagr >= 0 ? 'text-green-400' : 'text-red-400' },
            { label: isEs ? `Proyección ${targetDate.slice(0, 4)}` : `Projection ${targetDate.slice(0, 4)}`, value: fmtEur(projection.projectedValue), sub: targetDate, color: 'text-[var(--text-primary)]' },
          ].map(card => (
            <div key={card.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{card.label}</p>
              <p className={`text-base font-bold ${card.color}`}>{card.value}</p>
              {card.sub && <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5 opacity-60">{card.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {portfolio.holdings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PieChart className="w-16 h-16 text-[var(--text-tertiary)] mb-4 opacity-30" />
          <p className="text-lg text-[var(--text-secondary)]">
            {isEs ? 'Añade empresas a esta cartera' : 'Add companies to this portfolio'}
          </p>
        </div>
      ) : (
        <>
          {/* Main content: 2-column layout — left: chart + holdings, right: pie + metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* ═══ LEFT COLUMN: Chart + Holdings ═══ */}
            <div className="lg:col-span-2 space-y-4">
              {/* Evolution chart */}
              {totalInvested > 0 && projection.yearsElapsed > 0 && (
                <EvolutionChart historical={series.historical} projected={series.projected} isEs={isEs} />
              )}

              {/* Holdings list */}
              <div className="space-y-3">
                {portfolio.holdings.map((h, i) => {
                  const pct = getPercent(h.amount)
                  const data = liveData[h.ticker]
                  const liveVal = getHoldingLiveValue(h)
                  const holdingGain = h.amount > 0 ? ((liveVal / h.amount) - 1) * 100 : 0
                  const hasShares = h.shares && h.shares > 0
                  return (
                    <div key={h.ticker} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4">
                      <div className="w-3 h-10 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-blue-400">{h.ticker}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)] truncate">{h.name || data?.name}</span>
                        </div>
                        {data && (
                          <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-tertiary)]">
                            <span>${data.price?.toFixed(2)}</span>
                            {/* 24h change */}
                            {data.changePct != null && (
                              <span className={`flex items-center gap-0.5 font-medium ${data.changePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {data.changePct >= 0
                                  ? <TrendingUp className="w-3 h-3" />
                                  : <TrendingDown className="w-3 h-3" />
                                }
                                {data.changePct >= 0 ? '+' : ''}{data.changePct.toFixed(2)}% 24h
                              </span>
                            )}
                            {hasShares && (
                              <span className="text-[var(--text-tertiary)]">
                                {h.shares.toFixed(2)} acc.
                              </span>
                            )}
                            {hasShares && (
                              <span className={`font-medium ${holdingGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {holdingGain >= 0 ? '+' : ''}{holdingGain.toFixed(1)}%
                              </span>
                            )}
                            <span>{data.sector}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-1">
                          <input
                            type="number"
                            value={h.amount}
                            onChange={e => handleAmountChange(h.ticker, e.target.value)}
                            min={0}
                            step={100}
                            className="w-24 px-2 py-1.5 text-right text-sm bg-[var(--bg-main)] border border-[var(--border)] rounded text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                          />
                          {hasShares && data?.price && (
                            <p className={`text-[10px] mt-0.5 font-medium ${holdingGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {fmtEur(liveVal)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-[var(--text-tertiary)] w-8">{isEs ? 'inv.' : 'inv.'}</span>
                        <span className="text-xs text-[var(--text-secondary)] w-14 text-right font-medium">{pct.toFixed(1)}%</span>
                        <button onClick={() => handleRemoveHolding(h.ticker)} className="text-[var(--text-tertiary)] hover:text-red-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ═══ RIGHT COLUMN: Pie + Metrics + Sectors + Alerts ═══ */}
            <div className="space-y-4">
              {/* Pie chart distribution */}
              {totalInvested > 0 && (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">{isEs ? 'Distribución' : 'Distribution'}</h3>
                  <PieChartWithTooltip holdings={portfolio.holdings} totalInvested={totalInvested} displayValue={currentValue} isEs={isEs} />
                  {portfolio.holdings.map((h, i) => (
                    <div key={h.ticker} className="flex items-center gap-2 py-0.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-[var(--text-primary)] flex-1 truncate">{h.ticker}</span>
                      <span className="text-xs text-[var(--text-secondary)] font-medium">{getPercent(h.amount).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
            {/* Aggregated metrics */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{isEs ? 'Métricas agregadas' : 'Aggregated metrics'}</h3>
              <div className="space-y-2">
                {[
                  { label: isEs ? 'Calidad media' : 'Avg quality', value: avgQuality.toFixed(1) },
                  { label: 'ROE', value: `${weightedMetric('roe').toFixed(1)}%` },
                  { label: isEs ? 'Margen neto' : 'Net margin', value: `${weightedMetric('marginNeto').toFixed(1)}%` },
                  { label: 'PER', value: `${weightedMetric('per').toFixed(1)}x` },
                  { label: isEs ? 'Dividendo medio' : 'Avg dividend', value: `${avgDividend.toFixed(2)}%` },
                  { label: isEs ? 'Ingreso dividendos/año' : 'Dividend income/yr', value: fmtEur(estimatedDividendIncome) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-[var(--text-tertiary)]">{row.label}</span>
                    <span className="text-[var(--text-primary)] font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sector breakdown */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{isEs ? 'Por sector' : 'By sector'}</h3>
              {Object.entries(sectors).sort((a, b) => b[1] - a[1]).map(([sector, pct]) => (
                <div key={sector} className="mb-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[var(--text-primary)]">{sector}</span>
                    <span className="text-[var(--text-tertiary)]">{pct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Alerts & recommendations */}
            {(() => {
              const alerts = []
              const sectorEntries = Object.entries(sectors)
              const maxSectorPct = sectorEntries.length > 0 ? Math.max(...sectorEntries.map(s => s[1])) : 0
              const maxSectorName = sectorEntries.find(s => s[1] === maxSectorPct)?.[0]
              const topHolding = portfolio.holdings.reduce((max, h) => (h.amount > (max?.amount || 0) ? h : max), null)
              const topHoldingPct = topHolding ? getPercent(topHolding.amount) : 0

              if (sectorEntries.length === 1 && portfolio.holdings.length > 1) {
                alerts.push({ type: 'warn', text: isEs ? `Toda tu cartera está en un solo sector (${maxSectorName}). Considera diversificar.` : `Your entire portfolio is in one sector (${maxSectorName}). Consider diversifying.` })
              } else if (maxSectorPct > 60) {
                alerts.push({ type: 'warn', text: isEs ? `El sector ${maxSectorName} representa el ${maxSectorPct.toFixed(0)}% de tu cartera. Alta concentración sectorial.` : `Sector ${maxSectorName} represents ${maxSectorPct.toFixed(0)}% of your portfolio. High sector concentration.` })
              }

              if (topHoldingPct > 40 && portfolio.holdings.length > 1) {
                alerts.push({ type: 'warn', text: isEs ? `${topHolding.ticker} supone el ${topHoldingPct.toFixed(0)}% de tu cartera. Mucha exposición a un solo activo.` : `${topHolding.ticker} is ${topHoldingPct.toFixed(0)}% of your portfolio. High single-stock exposure.` })
              }

              if (portfolio.holdings.length < 5 && portfolio.holdings.length > 0) {
                alerts.push({ type: 'info', text: isEs ? 'Cartera poco diversificada. Se recomienda al menos 5-10 posiciones para reducir riesgo.' : 'Low diversification. At least 5-10 positions are recommended to reduce risk.' })
              }

              if (portfolio.holdings.length >= 15) {
                alerts.push({ type: 'info', text: isEs ? 'Cartera muy diversificada. Más posiciones puede dificultar el seguimiento.' : 'Highly diversified portfolio. More positions may make tracking harder.' })
              }

              if (avgDividend > 5) {
                alerts.push({ type: 'ok', text: isEs ? `Rendimiento por dividendo elevado (${avgDividend.toFixed(1)}%). Verifica que sea sostenible.` : `High dividend yield (${avgDividend.toFixed(1)}%). Verify it's sustainable.` })
              }

              if (weightedMetric('per') > 40) {
                alerts.push({ type: 'warn', text: isEs ? `PER medio muy alto (${weightedMetric('per').toFixed(0)}x). La cartera puede estar cara.` : `Very high average PER (${weightedMetric('per').toFixed(0)}x). Portfolio may be expensive.` })
              }

              if (sectorEntries.length >= 4) {
                alerts.push({ type: 'ok', text: isEs ? `Buena diversificación sectorial con ${sectorEntries.length} sectores.` : `Good sector diversification with ${sectorEntries.length} sectors.` })
              }

              if (alerts.length === 0) return null

              const colors = { warn: 'bg-amber-500/10 border-amber-500/30 text-amber-400', info: 'bg-blue-500/10 border-blue-500/30 text-blue-400', ok: 'bg-green-500/10 border-green-500/30 text-green-400' }

              return (
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{isEs ? 'Análisis' : 'Analysis'}</h3>
                  <div className="space-y-2">
                    {alerts.map((a, i) => (
                      <div key={i} className={`px-3 py-2 rounded-lg border text-xs leading-relaxed ${colors[a.type]}`}>
                        {a.text}
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-[var(--text-muted)] mt-3 leading-relaxed">
                    {isEs
                      ? 'Estos avisos son orientativos y no constituyen asesoramiento financiero. Consulta con un profesional antes de tomar decisiones de inversión.'
                      : 'These alerts are informational only and do not constitute financial advice. Consult a professional before making investment decisions.'
                    }
                  </p>
                </div>
              )
            })()}
          </div>
        </div>
        </>
      )}
    </div>
  )
}

// ─── Main Portfolio Page ───
export default function Portfolio() {
  const { lang } = useLanguage()
  const { currency, usdToEur, symbol } = useCurrency()
  const isEs = lang === 'es'
  const [selectedId, setSelectedId] = useState(null)
  const [portfolios, setPortfolios] = useState(() => getPortfolios())

  // Currency-aware formatter: amounts stored as EUR, converted to USD if selected
  const fmtEur = (val) => {
    if (val == null || isNaN(val)) return `0,00 ${currency}`
    const converted = currency === 'USD' ? val / (usdToEur || 0.92) : val
    return `${converted.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
  }

  const handleCreate = (name) => {
    const p = createPortfolio(name)
    logActivity(ACTIVITY.PORTFOLIO_CREATE, name)
    setPortfolios(getPortfolios())
    setSelectedId(p.id)
  }

  const handleDelete = (id) => {
    if (!confirm(isEs ? 'Eliminar esta cartera?' : 'Delete this portfolio?')) return
    const p = portfolios.find(x => x.id === id)
    deletePortfolio(id)
    logActivity(ACTIVITY.PORTFOLIO_DELETE, p?.name || id)
    setPortfolios(getPortfolios())
    if (selectedId === id) setSelectedId(null)
  }

  if (selectedId) {
    return (
      <PortfolioDetail
        portfolioId={selectedId}
        onBack={() => { setSelectedId(null); setPortfolios(getPortfolios()) }}
        isEs={isEs}
        lang={lang}
        fmtEur={fmtEur}
      />
    )
  }

  return (
    <PortfolioList
      portfolios={portfolios}
      onSelect={setSelectedId}
      onCreate={handleCreate}
      onDelete={handleDelete}
      isEs={isEs}
      fmtEur={fmtEur}
    />
  )
}
