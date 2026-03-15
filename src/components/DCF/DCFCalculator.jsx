import { useState, useMemo } from 'react'
import { Info, X, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

function formatBillions(v, lang) {
  const locale = lang === 'es' ? 'es-ES' : 'en-US'
  if (Math.abs(v) >= 1e9) {
    const num = (v / 1e9).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return `$${num}${lang === 'es' ? 'MM' : 'B'}`
  }
  if (Math.abs(v) >= 1e6) {
    const num = (v / 1e6).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return `$${num}M`
  }
  return `$${v.toLocaleString(locale, { maximumFractionDigits: 0 })}`
}

function formatPrice(v, lang) {
  const locale = lang === 'es' ? 'es-ES' : 'en-US'
  return `$${v.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatPct(v, lang) {
  const locale = lang === 'es' ? 'es-ES' : 'en-US'
  return v.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function SliderWithInput({ label, value, set, min, max, step, unit, helpText }) {
  // Slider clamps to min/max, but numeric input allows beyond range
  const sliderVal = Math.max(min, Math.min(max, value))
  const isOutOfRange = value < min || value > max

  return (
    <div>
      <div className="flex justify-between items-center text-sm mb-2">
        <label className="text-[var(--text-secondary)]">{label}</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            step={step}
            onChange={e => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) set(v)
            }}
            className={`w-20 px-2 py-1 bg-[var(--bg-main)] border rounded text-[var(--text-primary)] text-right text-sm font-semibold focus:outline-none focus:border-blue-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              isOutOfRange ? 'border-amber-500/50' : 'border-[var(--border)]'
            }`}
          />
          <span className="text-[var(--text-tertiary)] text-xs w-3">{unit}</span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min} max={max} step={step}
          value={sliderVal}
          onChange={e => set(parseFloat(e.target.value))}
          className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
          <span>{min}{unit}</span>
          <span>{((max + min) / 2).toFixed(1)}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
      {isOutOfRange && <p className="text-[10px] text-amber-400 mt-1">⚠ {value > max ? `> ${max}${unit}` : `< ${min}${unit}`}</p>}
      {helpText && <p className="text-[10px] text-[var(--text-muted)] mt-1">{helpText}</p>}
    </div>
  )
}

export default function DCFCalculator({ company }) {
  const { t, lang } = useLanguage()
  const d = company.dcf
  const [growth5, setGrowth5] = useState(d.growthRate5y)
  const [growth10, setGrowth10] = useState(d.growthRate10y)
  const [termGrowth, setTermGrowth] = useState(d.terminalGrowth)
  const [wacc, setWacc] = useState(d.wacc)
  const [showInfo, setShowInfo] = useState(false)

  const currentYear = new Date().getFullYear()

  const result = useMemo(() => {
    const fcfs = []
    let fcf = d.fcfBase
    let totalPV = 0
    let prevFcf = d.fcfBase

    for (let i = 1; i <= 5; i++) {
      fcf *= (1 + growth5 / 100)
      const pv = fcf / Math.pow(1 + wacc / 100, i)
      totalPV += pv
      const growth = ((fcf - prevFcf) / Math.abs(prevFcf)) * 100
      fcfs.push({ year: i, calendarYear: currentYear + i, fcf, pv, growth })
      prevFcf = fcf
    }

    for (let i = 6; i <= 10; i++) {
      fcf *= (1 + growth10 / 100)
      const pv = fcf / Math.pow(1 + wacc / 100, i)
      totalPV += pv
      const growth = ((fcf - prevFcf) / Math.abs(prevFcf)) * 100
      fcfs.push({ year: i, calendarYear: currentYear + i, fcf, pv, growth })
      prevFcf = fcf
    }

    const terminalValue = (fcf * (1 + termGrowth / 100)) / (wacc / 100 - termGrowth / 100)
    const terminalPV = terminalValue / Math.pow(1 + wacc / 100, 10)
    totalPV += terminalPV

    const intrinsicValue = totalPV / d.sharesOutstanding
    const margin = ((intrinsicValue - company.price) / company.price) * 100

    return { fcfs, terminalPV, totalPV, intrinsicValue, margin }
  }, [growth5, growth10, termGrowth, wacc, d, company.price, currentYear])

  function calcScenario(modifier) {
    const g5 = growth5 * (1 + modifier / 100)
    const g10 = growth10 * (1 + modifier / 100)
    let fcf = d.fcfBase
    let total = 0
    for (let i = 1; i <= 5; i++) {
      fcf *= (1 + g5 / 100)
      total += fcf / Math.pow(1 + wacc / 100, i)
    }
    for (let i = 6; i <= 10; i++) {
      fcf *= (1 + g10 / 100)
      total += fcf / Math.pow(1 + wacc / 100, i)
    }
    const tv = (fcf * (1 + termGrowth / 100)) / (wacc / 100 - termGrowth / 100)
    total += tv / Math.pow(1 + wacc / 100, 10)
    return total / d.sharesOutstanding
  }

  const scenarios = [
    { name: t('dcfBear'), growth5m: -30, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { name: t('dcfBase'), growth5m: 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { name: t('dcfBull'), growth5m: 30, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  ]

  // Calculate what growth rate would justify the current price (implied growth)
  const impliedGrowth = useMemo(() => {
    if (d.fcfBase <= 0 || d.sharesOutstanding <= 0) return null
    const waccDec = Math.max(wacc, 6) / 100
    const gT = termGrowth / 100
    for (let g = 0; g <= 40; g += 0.5) {
      const gDec = g / 100
      const g2 = (gDec + gT) / 2
      let totalPV = 0
      let fcf = d.fcfBase
      for (let y = 1; y <= 5; y++) {
        fcf *= (1 + gDec)
        totalPV += fcf / Math.pow(1 + waccDec, y)
      }
      for (let y = 6; y <= 10; y++) {
        fcf *= (1 + g2)
        totalPV += fcf / Math.pow(1 + waccDec, y)
      }
      const tv = (fcf * (1 + gT)) / (waccDec - gT)
      totalPV += tv / Math.pow(1 + waccDec, 10)
      const iv = totalPV / d.sharesOutstanding
      if (iv >= company.price) return g
    }
    return 40 // >40% needed
  }, [d.fcfBase, d.sharesOutstanding, wacc, termGrowth, company.price])

  const marginColor = result.margin > 15 ? 'text-green-400' : result.margin > 0 ? 'text-yellow-400' : 'text-red-400'
  const sharesLabel = lang === 'es'
    ? `${(d.sharesOutstanding / 1e9).toLocaleString('es-ES', { maximumFractionDigits: 1 })}MM`
    : `${(d.sharesOutstanding / 1e9).toLocaleString('en-US', { maximumFractionDigits: 1 })}B`

  return (
    <div className="space-y-6">
      {/* Resultado principal */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-[var(--text-primary)] font-semibold text-lg">{t('dcfTitle')}</h3>
          <button onClick={() => setShowInfo(!showInfo)} className="text-[var(--text-tertiary)] hover:text-blue-400 transition-colors">
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Info panel */}
        {showInfo && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 mb-4 text-sm text-[var(--text-secondary)] leading-relaxed relative">
            <button onClick={() => setShowInfo(false)} className="absolute top-2 right-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"><X className="w-4 h-4" /></button>
            <p className="mb-2 font-medium text-blue-400">{t('dcfInfoTitle')}</p>
            {[t('dcfInfoP1'), t('dcfInfoP2'), t('dcfInfoP3'), t('dcfInfoP4'), t('dcfInfoP5')].map((p, i) => (
              <p key={i} className={i < 4 ? 'mb-2' : ''} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
            ))}
          </div>
        )}

        <p className="text-xs text-[var(--text-tertiary)] mb-5">{t('dcfFcfBase')} ({currentYear}): {formatBillions(d.fcfBase, lang)} · {t('dcfSharesOutstanding')}: {sharesLabel}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-[var(--bg-main)] rounded-xl">
            <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mb-1">{t('dcfIntrinsic')}</p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{formatPrice(result.intrinsicValue, lang)}</p>
          </div>
          <div className="text-center p-4 bg-[var(--bg-main)] rounded-xl">
            <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mb-1">{t('dcfCurrentPrice')}</p>
            <p className="text-3xl font-bold text-[var(--text-secondary)]">{formatPrice(company.price, lang)}</p>
          </div>
          <div className="text-center p-4 bg-[var(--bg-main)] rounded-xl">
            <p className="text-[var(--text-tertiary)] text-xs uppercase tracking-wider mb-1">{t('dcfSafetyMargin')}</p>
            <p className={`text-3xl font-bold ${marginColor}`}>
              {result.margin > 0 ? '+' : ''}{formatPct(result.margin, lang)}%
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              {result.margin > 20 ? t('dcfUndervalued') : result.margin > 0 ? t('dcfSlightUnder') : result.margin > -15 ? t('dcfFairPrice') : t('dcfOvervalued')}
            </p>
          </div>
        </div>

        {/* Implied growth rate */}
        {impliedGrowth !== null && (
          <div className="bg-[var(--bg-main)] rounded-lg px-4 py-3 text-center">
            <p className="text-[11px] text-[var(--text-tertiary)]">
              {lang === 'es'
                ? `El precio actual ($${company.price.toFixed(0)}) implica un crecimiento del FCF de ~${formatPct(impliedGrowth, lang)}% anual durante 5 años`
                : `Current price ($${company.price.toFixed(0)}) implies ~${formatPct(impliedGrowth, lang)}% annual FCF growth for 5 years`}
            </p>
          </div>
        )}

        {/* Sliders con inputs numéricos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SliderWithInput label={t('dcfGrowth5')} value={growth5} set={setGrowth5} min={-10} max={50} step={0.5} unit="%" helpText={t('dcfHelp5')} />
          <SliderWithInput label={t('dcfGrowth10')} value={growth10} set={setGrowth10} min={-5} max={30} step={0.5} unit="%" helpText={t('dcfHelp10')} />
          <SliderWithInput label={t('dcfTerminal')} value={termGrowth} set={setTermGrowth} min={0} max={5} step={0.1} unit="%" helpText={t('dcfHelpTerminal')} />
          <SliderWithInput label={t('dcfWacc')} value={wacc} set={setWacc} min={5} max={20} step={0.1} unit="%" helpText={t('dcfHelpWacc')} />
        </div>
      </div>

      {/* Escenarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map(sc => {
          const val = calcScenario(sc.growth5m)
          const diff = ((val - company.price) / company.price * 100)
          return (
            <div key={sc.name} className={`p-5 rounded-xl border ${sc.bg}`}>
              <h4 className={`font-semibold ${sc.color} mb-2`}>{sc.name}</h4>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatPrice(val, lang)}</p>
              <p className={`text-sm mt-1 ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {diff >= 0 ? '+' : ''}{formatPct(diff, lang)}% {t('dcfVsActual')}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {t('dcfGrowth')}: {formatPct(growth5 * (1 + sc.growth5m / 100), lang)}% → {formatPct(growth10 * (1 + sc.growth5m / 100), lang)}%
              </p>
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-5 py-3">
        <p className="text-[11px] text-amber-400/80 leading-relaxed">
          <span className="font-semibold">⚠ {lang === 'es' ? 'Nota' : 'Note'}:</span>{' '}
          {lang === 'es'
            ? 'El DCF es un modelo teórico que estima valor basándose solo en flujos de caja futuros descontados. No captura factores como marca, ecosistema, posición competitiva o sentimiento del mercado. Úsalo como una herramienta más, no como una recomendación de compra/venta.'
            : 'DCF is a theoretical model that estimates value based only on discounted future cash flows. It does not capture factors like brand, ecosystem, competitive moat, or market sentiment. Use it as one tool among many, not as a buy/sell recommendation.'}
        </p>
      </div>

      {/* Detalle flujos */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 overflow-x-auto">
        <h4 className="text-[var(--text-primary)] font-semibold mb-3">{t('dcfFlows')}</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[var(--text-tertiary)] text-xs">
              <th className="text-left py-2 pr-4">{t('dcfYear')}</th>
              <th className="text-right py-2 px-4">{t('dcfProjectedFCF')}</th>
              <th className="text-right py-2 px-3">% YoY</th>
              <th className="text-right py-2 pl-4">{t('dcfPresentValue')}</th>
            </tr>
          </thead>
          <tbody>
            {result.fcfs.map(row => (
              <tr key={row.year} className="border-t border-[var(--border)]">
                <td className="py-2 pr-4 text-[var(--text-secondary)]">{row.calendarYear}</td>
                <td className="py-2 px-4 text-right text-[var(--text-primary)]">{formatBillions(row.fcf, lang)}</td>
                <td className="py-2 px-3 text-right">
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${row.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {row.growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {row.growth >= 0 ? '+' : ''}{formatPct(row.growth, lang)}%
                  </span>
                </td>
                <td className="py-2 pl-4 text-right text-[var(--text-secondary)]">{formatBillions(row.pv, lang)}</td>
              </tr>
            ))}
            <tr className="border-t border-[var(--border)] font-semibold">
              <td className="py-2 pr-4 text-blue-400">{currentYear + 10}+ (Terminal)</td>
              <td className="py-2 px-4 text-right text-[var(--text-tertiary)]">—</td>
              <td className="py-2 px-3 text-right text-[var(--text-tertiary)]">—</td>
              <td className="py-2 pl-4 text-right text-blue-400">{formatBillions(result.terminalPV, lang)}</td>
            </tr>
            <tr className="border-t-2 border-[var(--border)] font-bold">
              <td className="py-2 pr-4 text-[var(--text-primary)]">{t('dcfTotal')}</td>
              <td className="py-2 px-4 text-right text-[var(--text-tertiary)]">—</td>
              <td className="py-2 px-3 text-right text-[var(--text-tertiary)]">—</td>
              <td className="py-2 pl-4 text-right text-[var(--text-primary)]">{formatBillions(result.totalPV, lang)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
