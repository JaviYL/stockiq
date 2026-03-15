import { useState, useRef } from 'react'
import { Clock, TrendingUp, DollarSign, CalendarRange } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { fetchPriceHistory } from '../services/companyDataService'
import SearchAutocomplete from '../components/SearchAutocomplete'

function fmt$(val) {
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function BarChartWithTooltip({ data, invested, maxValue, minValue, isEs }) {
  const [tooltip, setTooltip] = useState(null)
  const containerRef = useRef(null)

  const range = maxValue - minValue || 1

  const handleMouseEnter = (d, i, e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const barRect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      x: barRect.left - rect.left + barRect.width / 2,
      y: barRect.top - rect.top - 8,
      date: d.date,
      value: d.value,
      profit: d.value - invested,
      pct: ((d.value / invested) - 1) * 100,
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-end gap-[2px] h-40">
        {data.map((d, i) => {
          const height = ((d.value - minValue) / range) * 100
          const isProfit = d.value >= invested
          return (
            <div
              key={i}
              className={`flex-1 rounded-t cursor-crosshair transition-opacity ${isProfit ? 'bg-green-500/60 hover:bg-green-500/90' : 'bg-red-500/60 hover:bg-red-500/90'}`}
              style={{ height: `${Math.max(height, 2)}%` }}
              onMouseEnter={(e) => handleMouseEnter(d, i, e)}
              onMouseLeave={() => setTooltip(null)}
            />
          )
        })}
      </div>
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] shadow-lg text-xs"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <p className="text-[var(--text-tertiary)] mb-0.5">{tooltip.date}</p>
          <p className="text-[var(--text-primary)] font-bold">{fmt$(tooltip.value)}</p>
          <p className={tooltip.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
            {tooltip.profit >= 0 ? '+' : ''}{fmt$(tooltip.profit)} ({tooltip.pct >= 0 ? '+' : ''}{tooltip.pct.toFixed(1)}%)
          </p>
        </div>
      )}
    </div>
  )
}

export default function WhatIf() {
  const { lang } = useLanguage()
  const isEs = lang === 'es'
  const [ticker, setTicker] = useState('')
  const [amount, setAmount] = useState(10000)
  const [years, setYears] = useState(5)
  const [useCustomDates, setUseCustomDates] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const todayStr = new Date().toISOString().slice(0, 10)

  const handleCalculate = async () => {
    if (!ticker) return
    setLoading(true)
    setError(null)
    try {
      let days
      let filterFrom = null
      let filterTo = null
      if (useCustomDates && customFrom) {
        const from = new Date(customFrom)
        const to = customTo ? new Date(customTo) : new Date()
        days = Math.ceil((to - from) / (1000 * 60 * 60 * 24))
        if (days < 30) {
          setError(isEs ? 'El rango mínimo es de 30 días' : 'Minimum range is 30 days')
          setLoading(false)
          return
        }
        filterFrom = customFrom
        filterTo = customTo || todayStr
      } else {
        days = years * 365
      }
      const prices = await fetchPriceHistory(ticker.toUpperCase(), days)
      if (!prices || prices.length < 2) {
        setError(isEs ? 'No hay suficientes datos históricos' : 'Not enough historical data')
        return
      }

      // Filter prices by custom date range if applicable
      let filteredPrices = prices
      if (filterFrom) {
        filteredPrices = prices.filter(p => p.time >= filterFrom && (!filterTo || p.time <= filterTo))
        if (filteredPrices.length < 2) filteredPrices = prices
      }

      const oldestPrice = filteredPrices[0].close
      const latestPrice = filteredPrices[filteredPrices.length - 1].close
      const shares = amount / oldestPrice
      const currentValue = shares * latestPrice
      const profit = currentValue - amount
      const returnPct = ((currentValue / amount) - 1) * 100
      const actualDays = (new Date(filteredPrices[filteredPrices.length - 1].time) - new Date(filteredPrices[0].time)) / (1000 * 60 * 60 * 24)
      const actualYears = Math.max(actualDays / 365, 0.1)
      const annualReturn = (Math.pow(currentValue / amount, 1 / actualYears) - 1) * 100

      // Build monthly chart data
      const monthlyData = []
      const step = Math.max(1, Math.floor(filteredPrices.length / 60))
      for (let i = 0; i < filteredPrices.length; i += step) {
        const p = filteredPrices[i]
        monthlyData.push({
          date: p.time,
          value: Math.round(shares * p.close),
        })
      }
      // Always include last point
      if (monthlyData.length > 0 && monthlyData[monthlyData.length - 1].date !== filteredPrices[filteredPrices.length - 1].time) {
        monthlyData.push({
          date: filteredPrices[filteredPrices.length - 1].time,
          value: Math.round(shares * latestPrice),
        })
      }

      const maxValue = Math.max(...monthlyData.map(d => d.value))
      const minValue = Math.min(...monthlyData.map(d => d.value))

      setResult({
        ticker: ticker.toUpperCase(),
        startDate: filteredPrices[0].time,
        endDate: filteredPrices[filteredPrices.length - 1].time,
        startPrice: oldestPrice,
        endPrice: latestPrice,
        shares,
        invested: amount,
        currentValue,
        profit,
        returnPct,
        annualReturn,
        monthlyData,
        maxValue,
        minValue,
      })
    } catch (err) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <Clock className="w-7 h-7 text-blue-500" />
          {isEs ? 'Simulador What-If' : 'What-If Simulator'}
        </h1>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">
          {isEs
            ? 'Descubre cuánto tendrías si hubieses invertido en el pasado'
            : 'Discover how much you would have if you invested in the past'
          }
        </p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1.5 font-medium uppercase">
                {isEs ? 'Empresa' : 'Company'}
              </label>
              <SearchAutocomplete
                onSelect={(t) => setTicker(t)}
                placeholder="AAPL, MSFT..."
              />
              {ticker && (
                <span className="text-xs text-blue-400 mt-1 block">{ticker.toUpperCase()}</span>
              )}
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] mb-1.5 font-medium uppercase">
                {isEs ? 'Inversión (EUR)' : 'Investment ($)'}
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                min={100}
                step={1000}
                className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs text-[var(--text-tertiary)] mb-1.5 font-medium uppercase">
              {isEs ? 'Periodo' : 'Period'}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[1, 2, 3, 5, 10, 15, 20].map(y => (
                <button
                  key={y}
                  onClick={() => { setYears(y); setUseCustomDates(false) }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    years === y && !useCustomDates
                      ? 'bg-blue-600 text-white'
                      : 'bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {y}a
                </button>
              ))}
              <button
                onClick={() => setUseCustomDates(!useCustomDates)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  useCustomDates
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                {isEs ? 'Rango' : 'Range'}
              </button>
            </div>
            {useCustomDates && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  max={todayStr}
                  className="flex-1 px-2.5 py-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                />
                <span className="text-[var(--text-tertiary)] text-xs">→</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  max={todayStr}
                  placeholder={todayStr}
                  className="flex-1 px-2.5 py-2 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={!ticker || loading || (useCustomDates && !customFrom)}
          className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (isEs ? 'Calculando...' : 'Calculating...') : (isEs ? 'Calcular' : 'Calculate')}
        </button>

        {error && <p className="text-sm text-red-400 mt-3 text-center">{error}</p>}
      </div>

      {result && (
        <>
          {/* Results cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <p className="text-xs text-[var(--text-tertiary)]">{isEs ? 'Invertido' : 'Invested'}</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{fmt$(result.invested)}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <p className="text-xs text-[var(--text-tertiary)]">{isEs ? 'Valor actual' : 'Current value'}</p>
              <p className="text-lg font-bold text-green-400">{fmt$(result.currentValue)}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <p className="text-xs text-[var(--text-tertiary)]">{isEs ? 'Beneficio' : 'Profit'}</p>
              <p className={`text-lg font-bold ${result.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.profit >= 0 ? '+' : ''}{fmt$(result.profit)}
              </p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <p className="text-xs text-[var(--text-tertiary)]">{isEs ? 'Retorno anual' : 'Annual return'}</p>
              <p className={`text-lg font-bold ${result.annualReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {result.annualReturn >= 0 ? '+' : ''}{result.annualReturn.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Interactive bar chart with tooltip */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
              {isEs ? 'Evolución del valor' : 'Value evolution'} — {result.ticker}
            </h3>
            <BarChartWithTooltip data={result.monthlyData} invested={result.invested} maxValue={result.maxValue} minValue={result.minValue} isEs={isEs} />
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-[var(--text-tertiary)]">{result.startDate}</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">{result.endDate}</span>
            </div>

            {/* Details */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-3 text-xs text-[var(--text-tertiary)]">
              <div>{isEs ? 'Precio compra' : 'Buy price'}: <span className="text-[var(--text-primary)]">{fmt$(result.startPrice)}</span></div>
              <div>{isEs ? 'Precio actual' : 'Current price'}: <span className="text-[var(--text-primary)]">{fmt$(result.endPrice)}</span></div>
              <div>{isEs ? 'Acciones' : 'Shares'}: <span className="text-[var(--text-primary)]">{result.shares.toFixed(2)}</span></div>
              <div>{isEs ? 'Retorno total' : 'Total return'}: <span className={result.returnPct >= 0 ? 'text-green-400' : 'text-red-400'}>{result.returnPct >= 0 ? '+' : ''}{result.returnPct.toFixed(1)}%</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
