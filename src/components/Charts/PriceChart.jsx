import { useEffect, useRef, useState } from 'react'
import { createChart, CandlestickSeries, LineSeries, AreaSeries } from 'lightweight-charts'
import { fetchPriceHistory } from '../../services/companyDataService'
import { useLanguage } from '../../context/LanguageContext'
import { useTheme } from '../../context/ThemeContext'

const TIMEFRAMES = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '5Y', days: 1825 },
]

export default function PriceChart({ ticker }) {
  const { t } = useLanguage()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const CHART_TYPES = [t('chartCandles'), t('chartLine'), t('chartArea')]
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const [timeframe, setTimeframe] = useState('1Y')
  const [chartType, setChartType] = useState(CHART_TYPES[0])
  const [priceData, setPriceData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch price data when ticker or timeframe changes
  useEffect(() => {
    let cancelled = false
    const tf = TIMEFRAMES.find(t => t.label === timeframe)

    setLoading(true)
    fetchPriceHistory(ticker, tf?.days || 365)
      .then(data => {
        if (!cancelled) {
          setPriceData(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPriceData(null)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [ticker, timeframe])

  // Render chart when data, chartType, or theme changes
  useEffect(() => {
    if (!containerRef.current || !priceData || priceData.length === 0) return

    // Clean up previous chart
    if (chartRef.current) {
      chartRef.current.remove()
      chartRef.current = null
    }

    const bgColor = isDark ? '#12131a' : '#ffffff'
    const textColor = isDark ? '#6b7280' : '#64748b'
    const gridColor = isDark ? '#1e2030' : '#e2e8f0'

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: bgColor },
        textColor,
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#3b82f6', width: 1, style: 2 },
        horzLine: { color: '#3b82f6', width: 1, style: 2 },
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
      timeScale: {
        borderColor: gridColor,
        timeVisible: false,
      },
    })

    chartRef.current = chart

    if (chartType === CHART_TYPES[0]) {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      })
      series.setData(priceData)
    } else if (chartType === CHART_TYPES[1]) {
      const series = chart.addSeries(LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
      })
      series.setData(priceData.map(d => ({ time: d.time, value: d.close })))
    } else {
      const series = chart.addSeries(AreaSeries, {
        topColor: 'rgba(59, 130, 246, 0.4)',
        bottomColor: 'rgba(59, 130, 246, 0.0)',
        lineColor: '#3b82f6',
        lineWidth: 2,
      })
      series.setData(priceData.map(d => ({ time: d.time, value: d.close })))
    }

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
      chartRef.current = null
    }
  }, [priceData, chartType, isDark])

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-[var(--border)]">
        <div className="flex gap-1">
          {CHART_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                chartType === t ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.label}
              onClick={() => setTimeframe(tf.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                timeframe === tf.label ? 'bg-blue-600 text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      {loading && (
        <div className="flex items-center justify-center h-[420px] text-[var(--text-tertiary)] text-sm">
          {t('loading') || 'Loading'} {ticker}...
        </div>
      )}
      <div ref={containerRef} style={{ display: loading ? 'none' : 'block' }} />
    </div>
  )
}
