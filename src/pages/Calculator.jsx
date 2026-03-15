import { useState, useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { useLanguage } from '../context/LanguageContext'

function NumberInput({ label, value, onChange, suffix, min = 0, max, step = 1, helpText }) {
  const suffixWidth = suffix.length > 3 ? 'pr-16' : suffix.length > 1 ? 'pr-12' : 'pr-10'
  return (
    <div>
      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v) && v >= min) onChange(v)
          }}
          className={`w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-right ${suffixWidth} font-semibold focus:outline-none focus:border-blue-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-sm">{suffix}</span>
      </div>
      {helpText && <p className="text-[11px] text-[var(--text-muted)] mt-1">{helpText}</p>}
    </div>
  )
}

export default function Calculator() {
  const { t, lang } = useLanguage()
  const [capital, setCapital] = useState(10000)
  const [monthly, setMonthly] = useState(500)
  const [rate, setRate] = useState(8)
  const [months, setMonths] = useState(120)

  const investLabel = t('calcInvestment')
  const contribLabel = t('calcContributions')
  const bondLabel = t('calcBond')

  const result = useMemo(() => {
    const safeMonths = Math.max(1, Math.min(months, 1200))
    const data = []
    let balance = capital
    let totalContrib = capital
    const bondRate = 4
    let bondBalance = capital

    const interval = Math.max(1, Math.floor(safeMonths / 60))

    for (let m = 0; m <= safeMonths; m++) {
      if (m > 0) {
        balance = balance * (1 + rate / 100 / 12) + monthly
        bondBalance = bondBalance * (1 + bondRate / 100 / 12) + monthly
        totalContrib += monthly
      }

      if (m % interval === 0 || m === safeMonths) {
        const years = m / 12
        let label
        if (m === 0) label = t('calcToday')
        else if (m < 12) label = `${m}m`
        else label = `${years.toFixed(years % 1 === 0 ? 0 : 1)}a`

        data.push({
          month: m,
          label,
          [investLabel]: Math.round(balance),
          [contribLabel]: Math.round(totalContrib),
          [bondLabel]: Math.round(bondBalance),
        })
      }
    }

    return {
      data,
      finalBalance: balance,
      totalContrib,
      totalProfit: balance - totalContrib,
      totalReturn: ((balance - totalContrib) / totalContrib) * 100,
      bondFinal: bondBalance,
    }
  }, [capital, monthly, rate, months, investLabel, contribLabel, bondLabel])

  const locale = lang === 'es' ? 'es-ES' : 'en-US'
  const curr = lang === 'es' ? '€' : '$'

  const formatCurrency = (v) => {
    if (v >= 1000000) {
      const num = (v / 1000000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      return `${num}M${curr}`
    }
    if (v >= 1000) {
      const num = (v / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
      return `${num}K${curr}`
    }
    return `${v.toLocaleString(locale, { maximumFractionDigits: 0 })}${curr}`
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null
    return (
      <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg p-3 text-xs">
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{t('calcTitle')}</h2>
      <p className="text-[var(--text-secondary)] text-sm mb-6">{t('calcSubtitle')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-5">
          <NumberInput label={t('calcInitial')} value={capital} onChange={setCapital} suffix="€" step={1000} helpText={t('calcHelpInitial')} />
          <NumberInput label={t('calcMonthly')} value={monthly} onChange={setMonthly} suffix="€" step={50} helpText={t('calcHelpMonthly')} />
          <NumberInput label={t('calcRate')} value={rate} onChange={setRate} suffix="%" min={0} max={50} step={0.5} helpText={t('calcHelpRate')} />
          <NumberInput label={t('calcMonths')} value={months} onChange={setMonths} suffix={t('months')} min={1} max={1200} step={12} helpText={`= ${(months / 12).toFixed(1)} ${t('calcYears')}`} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <p className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wider mb-1">{t('calcFinal')}</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">{formatCurrency(result.finalBalance)}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <p className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wider mb-1">{t('calcProfit')}</p>
              <p className="text-xl font-bold text-green-400">{formatCurrency(result.totalProfit)}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <p className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wider mb-1">{t('calcReturn')}</p>
              <p className="text-xl font-bold text-green-400">+{result.totalReturn.toFixed(1)}%</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
              <p className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wider mb-1">{t('calcVsBond')}</p>
              <p className="text-xl font-bold text-blue-400">+{formatCurrency(result.finalBalance - result.bondFinal)}</p>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center gap-4 mb-3 text-[11px]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-500 inline-block rounded"></span><span className="text-[var(--text-secondary)]">{investLabel}</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-purple-500 inline-block rounded opacity-60"></span><span className="text-[var(--text-secondary)]">{t('calcBond')}</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gray-500 inline-block rounded opacity-60"></span><span className="text-[var(--text-secondary)]">{contribLabel}</span></span>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={result.data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} />
                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={formatCurrency} width={65} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={investLabel} stroke="#3b82f6" fill="rgba(59,130,246,0.15)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
                <Area type="monotone" dataKey={bondLabel} stroke="#a855f7" fill="rgba(168,85,247,0.08)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} activeDot={{ r: 3, fill: '#a855f7' }} />
                <Area type="monotone" dataKey={contribLabel} stroke="#6b7280" fill="rgba(107,114,128,0.08)" strokeWidth={1} strokeDasharray="3 3" dot={false} activeDot={{ r: 3, fill: '#6b7280' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
