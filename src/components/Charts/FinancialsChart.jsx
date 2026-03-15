import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Minus, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

function formatNum(v, lang = 'es') {
  if (v == null || !isFinite(v)) return '$0'
  const locale = lang === 'es' ? 'es-ES' : 'en-US'
  if (Math.abs(v) >= 1000) {
    const num = (v / 1000).toLocaleString(locale, { maximumFractionDigits: 0 })
    return `$${num}${lang === 'es' ? 'MM' : 'B'}`
  }
  return `$${v.toLocaleString(locale, { maximumFractionDigits: 0 })}M`
}

function GrowthBadge({ current, previous }) {
  if (!previous || previous === 0) return null
  const pct = ((current - previous) / Math.abs(previous)) * 100
  const isUp = pct > 0
  const isFlat = Math.abs(pct) < 1
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${isFlat ? 'text-[var(--text-muted)]' : isUp ? 'text-green-400' : 'text-red-400'}`}>
      {isFlat ? <Minus className="w-2.5 h-2.5" /> : isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
      {isFlat ? '0%' : `${isUp ? '+' : ''}${pct.toFixed(1)}%`}
    </span>
  )
}

export default function FinancialsChart({ company }) {
  const { t, lang } = useLanguage()
  const [activeMetric, setActiveMetric] = useState('revenue')

  const fin = company?.financials
  const hasData = fin && fin.years && fin.years.length > 0 && fin.revenue && fin.revenue.length > 0

  if (!hasData) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 text-center">
        <h3 className="text-[var(--text-primary)] font-semibold mb-2">{t('finTitle')}</h3>
        <p className="text-[var(--text-tertiary)] text-sm">No financial data available</p>
      </div>
    )
  }

  const metrics = [
    { key: 'revenue', label: t('finRevenue'), data: fin.revenue, color: '#3b82f6', icon: DollarSign },
    { key: 'netIncome', label: t('finNetIncome'), data: fin.netIncome || [], color: '#22c55e', icon: TrendingUp },
    { key: 'fcf', label: 'FCF', data: fin.fcf || [], color: '#a855f7', icon: TrendingUp },
  ]

  const active = metrics.find(m => m.key === activeMetric)

  const hasActiveData = active.data && active.data.length > 0 && active.data.some(v => v !== 0)

  const data = hasActiveData ? fin.years.map((year, i) => ({
    year,
    value: active.data[i] || 0,
    growth: i > 0 && active.data[i - 1] ? ((active.data[i] - active.data[i - 1]) / Math.abs(active.data[i - 1])) * 100 : null,
  })) : []

  // Summary KPIs
  const lastVal = active.data[active.data.length - 1] || 0
  const firstVal = active.data[0] || 1
  const totalGrowth = firstVal !== 0 ? ((lastVal - firstVal) / Math.abs(firstVal)) * 100 : 0
  const cagr = firstVal > 0 && lastVal > 0 && active.data.length > 1
    ? (Math.pow(lastVal / firstVal, 1 / (active.data.length - 1)) - 1) * 100
    : 0

  const CustomTooltip = ({ active: isActive, payload, label }) => {
    if (!isActive || !payload || !payload.length) return null
    const entry = payload[0]
    const idx = company.financials.years.indexOf(label)
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-xs shadow-xl">
        <p className="text-[var(--text-primary)] font-semibold mb-1">{label}</p>
        <p style={{ color: active.color }} className="font-bold text-sm">
          {formatNum(entry.value, lang)}
        </p>
        {idx > 0 && (
          <p className="text-[var(--text-tertiary)] mt-1">
            vs {company.financials.years[idx - 1]}: <GrowthBadge current={active.data[idx]} previous={active.data[idx - 1]} />
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header with metric tabs */}
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[var(--text-primary)] font-semibold">{t('finTitle')}</h3>
          <div className="flex gap-1 bg-[var(--bg-main)] p-0.5 rounded-lg">
            {metrics.map(m => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  activeMetric === m.key
                    ? 'text-white shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                style={activeMetric === m.key ? { backgroundColor: m.color } : {}}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row — only show if active metric has data */}
        {hasActiveData && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-[var(--bg-main)] rounded-lg p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{t('finLatest')}</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{formatNum(lastVal, lang)}</p>
              <GrowthBadge current={active.data[active.data.length - 1]} previous={active.data[active.data.length - 2]} />
            </div>
            <div className="bg-[var(--bg-main)] rounded-lg p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">CAGR {active.data.length - 1}{lang === 'es' ? 'a' : 'Y'}</p>
              <p className={`text-lg font-bold ${cagr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {cagr >= 0 ? '+' : ''}{cagr.toFixed(1)}%
              </p>
            </div>
            <div className="bg-[var(--bg-main)] rounded-lg p-3">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{t('finTotalGrowth')}</p>
              <p className={`text-lg font-bold ${totalGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalGrowth >= 0 ? '+' : ''}{totalGrowth.toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart or no-data message */}
      {hasActiveData ? (
        <>
          <div className="px-5 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNum(v, lang)} width={50} />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} background={false}>
                  {data.map((entry, i) => (
                    <Cell key={i} fill={active.color} opacity={i === data.length - 1 ? 1 : 0.6 + (i * 0.1)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Growth row at bottom */}
          <div className="border-t border-[var(--border)] px-5 py-3 flex items-center gap-4 overflow-x-auto">
            {data.map((d, i) => (
              <div key={d.year} className="flex flex-col items-center min-w-[50px]">
                <span className="text-[10px] text-[var(--text-muted)]">{d.year}</span>
                {i > 0 ? (
                  <GrowthBadge current={active.data[i]} previous={active.data[i - 1]} />
                ) : (
                  <span className="text-[10px] text-[var(--text-muted)]">—</span>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="px-5 pb-6 pt-2 text-center">
          <p className="text-[var(--text-tertiary)] text-sm py-12">
            {lang === 'es' ? 'Datos no disponibles para esta métrica' : 'No data available for this metric'}
          </p>
        </div>
      )}
    </div>
  )
}
