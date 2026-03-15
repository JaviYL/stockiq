import { AlertTriangle, Info } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

// Interpret result categories (language-agnostic keys for color mapping)
const CAT = {
  VERY_GOOD: 'very_good', GOOD: 'good', OK: 'ok', NEUTRAL: 'neutral',
  BAD: 'bad', VERY_BAD: 'very_bad', NONE: 'none',
}

const METRICS_CONFIG = [
  { key: 'per', label: { es: 'PER (P/E)', en: 'PER (P/E)' }, sectorKey: 'perSector', alert: (v, s) => v > 2 * s, better: 'lower', format: 'x',
    interpret: (v) => v < 10 ? CAT.VERY_GOOD : v < 15 ? CAT.GOOD : v < 25 ? CAT.NEUTRAL : v < 40 ? CAT.BAD : CAT.VERY_BAD },
  { key: 'pb', label: { es: 'P/B', en: 'P/B' }, sectorKey: 'pbSector', alert: (v) => v > 10, better: 'lower', format: 'x',
    interpret: (v) => v < 1 ? CAT.VERY_GOOD : v < 3 ? CAT.NEUTRAL : v < 10 ? CAT.BAD : CAT.VERY_BAD },
  { key: 'evEbitda', label: { es: 'EV/EBITDA', en: 'EV/EBITDA' }, sectorKey: 'evEbitdaSector', alert: (v) => v > 20, better: 'lower', format: 'x', hideZero: true,
    interpret: (v) => v < 8 ? CAT.GOOD : v < 15 ? CAT.NEUTRAL : v < 25 ? CAT.BAD : CAT.VERY_BAD },
  { key: 'peg', label: { es: 'Ratio PEG', en: 'PEG Ratio' }, alert: (v) => v > 2, better: 'lower', format: 'x',
    interpret: (v) => v < 0.5 ? CAT.VERY_GOOD : v < 1 ? CAT.GOOD : v < 1.5 ? CAT.NEUTRAL : v < 2 ? CAT.BAD : CAT.VERY_BAD },
  { key: 'roe', label: { es: 'ROE', en: 'ROE' }, sectorKey: 'roeSector', alert: (v) => v < 10, better: 'higher', format: '%',
    interpret: (v) => v < 5 ? CAT.VERY_BAD : v < 10 ? CAT.BAD : v < 15 ? CAT.NEUTRAL : v < 25 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'roa', label: { es: 'ROA', en: 'ROA' }, sectorKey: 'roaSector', alert: (v) => v < 5, better: 'higher', format: '%',
    interpret: (v) => v < 3 ? CAT.BAD : v < 7 ? CAT.NEUTRAL : v < 15 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'roic', label: { es: 'ROIC', en: 'ROIC' }, alert: (v, s, m) => m.roic < m.wacc, better: 'higher', format: '%', hideZero: true,
    interpret: (v, m) => v === 0 ? CAT.NONE : v < m?.wacc ? CAT.VERY_BAD : v < 15 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'marginBruto', label: { es: 'Margen Bruto', en: 'Gross Margin' }, sectorKey: 'marginBrutoSector', better: 'higher', format: '%', hideZero: true,
    interpret: (v) => v < 20 ? CAT.BAD : v < 40 ? CAT.NEUTRAL : v < 60 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'marginNeto', label: { es: 'Margen Neto', en: 'Net Margin' }, sectorKey: 'marginNetoSector', alert: (v) => v < 0, better: 'higher', format: '%',
    interpret: (v) => v < 0 ? CAT.VERY_BAD : v < 5 ? CAT.BAD : v < 15 ? CAT.NEUTRAL : v < 25 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'marginEbitda', label: { es: 'Margen EBITDA', en: 'EBITDA Margin' }, sectorKey: 'marginEbitdaSector', better: 'higher', format: '%', hideZero: true,
    interpret: (v) => v < 10 ? CAT.BAD : v < 20 ? CAT.NEUTRAL : v < 35 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'fcfYield', label: { es: 'FCF Yield', en: 'FCF Yield' }, alert: (v) => v < 2, better: 'higher', format: '%',
    interpret: (v) => v < 2 ? CAT.BAD : v < 4 ? CAT.NEUTRAL : v < 6 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'deudaNetaEbitda', label: { es: 'Deuda Neta/EBITDA', en: 'Net Debt/EBITDA' }, alert: (v) => v > 3, better: 'lower', format: 'x', hideZero: true,
    interpret: (v) => v < 0 ? CAT.VERY_GOOD : v < 1 ? CAT.VERY_GOOD : v < 2 ? CAT.GOOD : v < 3 ? CAT.NEUTRAL : v < 5 ? CAT.BAD : CAT.VERY_BAD },
  { key: 'interestCoverage', label: { es: 'Cobertura de Intereses', en: 'Interest Coverage' }, alert: (v) => v < 3 && v > 0, better: 'higher', format: 'x', hideZero: true,
    interpret: (v) => v < 1.5 ? CAT.VERY_BAD : v < 3 ? CAT.BAD : v < 10 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'piotroski', label: { es: 'Piotroski F-Score', en: 'Piotroski F-Score' }, alert: (v) => v < 3, better: 'higher', format: '',
    interpret: (v) => v <= 2 ? CAT.VERY_BAD : v <= 4 ? CAT.BAD : v <= 6 ? CAT.NEUTRAL : v <= 8 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'altmanZ', label: { es: 'Altman Z-Score', en: 'Altman Z-Score' }, alert: (v) => v < 1.8 && v > 0, better: 'higher', format: '', hideZero: true,
    interpret: (v) => v < 1.1 ? CAT.VERY_BAD : v < 1.8 ? CAT.BAD : v < 3 ? CAT.GOOD : CAT.VERY_GOOD },
  { key: 'grahamNumber', label: { es: 'Número de Graham', en: 'Graham Number' }, format: '$',
    interpret: (v, m, p) => p > v * 2 ? CAT.VERY_BAD : p > v * 1.2 ? CAT.BAD : p < v ? CAT.GOOD : CAT.NEUTRAL },
  { key: 'dividendYield', label: { es: 'Rentabilidad por Dividendo', en: 'Dividend Yield' }, alert: (v) => v > 8, format: '%',
    interpret: (v) => v === 0 ? CAT.NONE : v < 1 ? CAT.BAD : v < 3 ? CAT.NEUTRAL : v < 5 ? CAT.GOOD : v < 8 ? CAT.GOOD : CAT.VERY_BAD },
  { key: 'payoutRatio', label: { es: 'Ratio de Pago', en: 'Payout Ratio' }, alert: (v) => v > 90, format: '%',
    interpret: (v) => v === 0 ? CAT.NONE : v < 30 ? CAT.GOOD : v < 60 ? CAT.NEUTRAL : v < 80 ? CAT.BAD : v < 100 ? CAT.BAD : CAT.VERY_BAD },
]

// Localized text for each metric
const METRIC_TEXT = {
  es: {
    per: { desc: 'Precio / Beneficio por acción', scale: '< 15 barato · 15-25 normal · > 25 caro',
      labels: { very_good: 'Muy barato', good: 'Barato', ok: 'Razonable', neutral: 'Razonable', bad: 'Caro', very_bad: 'Muy caro' } },
    pb: { desc: 'Cuánto pagas por cada euro de patrimonio neto', scale: '< 1 ganga · 1-3 normal · > 5 caro',
      labels: { very_good: 'Por debajo del valor contable', neutral: 'Razonable', bad: 'Caro', very_bad: 'Muy caro' } },
    evEbitda: { desc: 'Valoración de la empresa sobre su beneficio operativo', scale: '< 10 barato · 10-15 normal · > 20 caro',
      labels: { good: 'Barato', neutral: 'Razonable', bad: 'Caro', very_bad: 'Muy caro' } },
    peg: { desc: 'PER ajustado por el crecimiento esperado', scale: '< 1 buen precio · 1-2 normal · > 2 caro',
      labels: { very_good: 'Muy atractivo', good: 'Buen precio', neutral: 'Razonable', bad: 'Algo caro', very_bad: 'Sobrevalorado' } },
    roe: { desc: 'Cuánto beneficio genera por cada euro de patrimonio', scale: '> 15% bueno · > 25% excelente · < 10% preocupante',
      labels: { very_bad: 'Muy bajo', bad: 'Bajo', neutral: 'Aceptable', good: 'Bueno', very_good: 'Excelente' } },
    roa: { desc: 'Eficiencia usando todos sus activos para generar beneficio', scale: '> 7% bueno · > 15% excelente · < 5% bajo',
      labels: { bad: 'Bajo', neutral: 'Aceptable', good: 'Bueno', very_good: 'Excelente' } },
    roic: { desc: 'Retorno sobre el capital invertido. Si supera el WACC, crea valor', scale: 'Debe superar el WACC para crear valor',
      labels: { none: 'N/A', very_bad: 'Destruye valor (< WACC)', good: 'Crea valor', very_good: 'Muy rentable' } },
    marginBruto: { desc: 'Qué porcentaje de cada venta es beneficio bruto', scale: '> 40% alto · > 60% muy alto',
      labels: { bad: 'Bajo (negocio de volumen)', neutral: 'Moderado', good: 'Alto', very_good: 'Muy alto' } },
    marginNeto: { desc: 'Qué porcentaje de cada venta queda como beneficio final', scale: '> 10% bueno · > 20% excelente · < 0 pierde dinero',
      labels: { very_bad: 'Pierde dinero', bad: 'Bajo', neutral: 'Moderado', good: 'Alto', very_good: 'Muy alto' } },
    marginEbitda: { desc: 'Beneficio operativo sobre ingresos', scale: '> 20% bueno · > 35% excelente',
      labels: { bad: 'Bajo', neutral: 'Moderado', good: 'Bueno', very_good: 'Excelente' } },
    fcfYield: { desc: 'Flujo de caja libre respecto al precio que pagas', scale: '> 4% atractivo · > 6% muy atractivo · < 2% caro',
      labels: { bad: 'Bajo (caro)', neutral: 'Moderado', good: 'Atractivo', very_good: 'Muy atractivo' } },
    deudaNetaEbitda: { desc: 'Años que tardaría en pagar toda su deuda', scale: '< 2x bajo · 2-3x normal · > 3x alto · > 5x peligroso',
      labels: { very_good: 'Caja neta / Muy bajo', good: 'Bajo', neutral: 'Moderado', bad: 'Alto', very_bad: 'Peligroso' } },
    interestCoverage: { desc: 'Cuántas veces puede pagar los intereses de su deuda', scale: '> 5x cómodo · > 10x muy seguro · < 3x riesgo',
      labels: { very_bad: 'Riesgo alto', bad: 'Justo', good: 'Cómodo', very_good: 'Muy holgado' } },
    piotroski: { desc: 'Puntuación de salud financiera (9 criterios)', scale: 'Escala 0-9 · > 6 fuerte · < 3 muy débil',
      labels: { very_bad: 'Muy débil', bad: 'Débil', neutral: 'Moderada', good: 'Fuerte', very_good: 'Muy fuerte' } },
    altmanZ: { desc: 'Predicción de probabilidad de quiebra', scale: '< 1.8 riesgo · 1.8-3 zona gris · > 3 seguro',
      labels: { very_bad: 'Zona de quiebra', bad: 'Zona gris (riesgo)', good: 'Zona segura', very_good: 'Muy seguro' } },
    grahamNumber: { desc: 'Precio máximo que pagaría Benjamin Graham', scale: 'Si precio > Graham, está cara para un inversor conservador',
      labels: { very_bad: 'Precio MUY por encima', bad: 'Precio por encima', good: 'Precio por debajo', neutral: 'Cerca del límite' } },
    dividendYield: { desc: 'Porcentaje del precio que recibes en dividendos', scale: '1-3% normal · 3-5% atractivo · > 8% trampa',
      labels: { none: 'No paga dividendo', bad: 'Simbólico', neutral: 'Moderado', good: 'Atractivo', very_bad: 'Sospechosamente alto' } },
    payoutRatio: { desc: 'Qué porcentaje de beneficios reparte como dividendo', scale: '30-60% equilibrado · > 80% difícil de mantener',
      labels: { none: 'No reparte', good: 'Conservador', neutral: 'Equilibrado', bad: 'Alto', very_bad: 'Insostenible (> 100%)' } },
  },
  en: {
    per: { desc: 'Price / Earnings per share', scale: '< 15 cheap · 15-25 normal · > 25 expensive',
      labels: { very_good: 'Very cheap', good: 'Cheap', ok: 'Reasonable', neutral: 'Reasonable', bad: 'Expensive', very_bad: 'Very expensive' } },
    pb: { desc: 'How much you pay per euro of net equity', scale: '< 1 bargain · 1-3 normal · > 5 expensive',
      labels: { very_good: 'Below book value', neutral: 'Reasonable', bad: 'Expensive', very_bad: 'Very expensive' } },
    evEbitda: { desc: 'Enterprise valuation over operating profit', scale: '< 10 cheap · 10-15 normal · > 20 expensive',
      labels: { good: 'Cheap', neutral: 'Reasonable', bad: 'Expensive', very_bad: 'Very expensive' } },
    peg: { desc: 'P/E adjusted for expected growth', scale: '< 1 good price · 1-2 normal · > 2 expensive',
      labels: { very_good: 'Very attractive', good: 'Good price', neutral: 'Reasonable', bad: 'Somewhat expensive', very_bad: 'Overvalued' } },
    roe: { desc: 'Profit generated per unit of equity', scale: '> 15% good · > 25% excellent · < 10% concerning',
      labels: { very_bad: 'Very low', bad: 'Low', neutral: 'Acceptable', good: 'Good', very_good: 'Excellent' } },
    roa: { desc: 'Efficiency using all assets to generate profit', scale: '> 7% good · > 15% excellent · < 5% low',
      labels: { bad: 'Low', neutral: 'Acceptable', good: 'Good', very_good: 'Excellent' } },
    roic: { desc: 'Return on invested capital. Must exceed WACC to create value', scale: 'Must exceed WACC to create value',
      labels: { none: 'N/A', very_bad: 'Destroys value (< WACC)', good: 'Creates value', very_good: 'Very profitable' } },
    marginBruto: { desc: 'What percentage of each sale is gross profit', scale: '> 40% high · > 60% very high',
      labels: { bad: 'Low (volume business)', neutral: 'Moderate', good: 'High', very_good: 'Very high' } },
    marginNeto: { desc: 'What percentage of each sale remains as net profit', scale: '> 10% good · > 20% excellent · < 0 losing money',
      labels: { very_bad: 'Losing money', bad: 'Low', neutral: 'Moderate', good: 'High', very_good: 'Very high' } },
    marginEbitda: { desc: 'Operating profit over revenue', scale: '> 20% good · > 35% excellent',
      labels: { bad: 'Low', neutral: 'Moderate', good: 'Good', very_good: 'Excellent' } },
    fcfYield: { desc: 'Free cash flow relative to price paid', scale: '> 4% attractive · > 6% very attractive · < 2% expensive',
      labels: { bad: 'Low (expensive)', neutral: 'Moderate', good: 'Attractive', very_good: 'Very attractive' } },
    deudaNetaEbitda: { desc: 'Years to pay off all debt with operating profit', scale: '< 2x low · 2-3x normal · > 3x high · > 5x dangerous',
      labels: { very_good: 'Net cash / Very low', good: 'Low', neutral: 'Moderate', bad: 'High', very_bad: 'Dangerous' } },
    interestCoverage: { desc: 'How many times it can pay debt interest', scale: '> 5x comfortable · > 10x very safe · < 3x risky',
      labels: { very_bad: 'High risk', bad: 'Tight', good: 'Comfortable', very_good: 'Very comfortable' } },
    piotroski: { desc: 'Financial health score (9 criteria)', scale: 'Scale 0-9 · > 6 strong · < 3 very weak',
      labels: { very_bad: 'Very weak', bad: 'Weak', neutral: 'Moderate', good: 'Strong', very_good: 'Very strong' } },
    altmanZ: { desc: 'Bankruptcy probability prediction', scale: '< 1.8 risk · 1.8-3 grey zone · > 3 safe',
      labels: { very_bad: 'Bankruptcy zone', bad: 'Grey zone (risk)', good: 'Safe zone', very_good: 'Very safe' } },
    grahamNumber: { desc: 'Max price Benjamin Graham would pay', scale: 'If price > Graham Number, expensive for value investors',
      labels: { very_bad: 'Price WAY above', bad: 'Price above', good: 'Price below', neutral: 'Near the limit' } },
    dividendYield: { desc: 'Percentage of price received as dividends', scale: '1-3% normal · 3-5% attractive · > 8% trap',
      labels: { none: 'No dividend', bad: 'Symbolic', neutral: 'Moderate', good: 'Attractive', very_bad: 'Suspiciously high' } },
    payoutRatio: { desc: 'Percentage of earnings paid as dividends', scale: '30-60% balanced · > 80% hard to sustain',
      labels: { none: 'None', good: 'Conservative', neutral: 'Balanced', bad: 'High', very_bad: 'Unsustainable (> 100%)' } },
  }
}

// Color palette
const LIGHT_GREEN = [74, 222, 128]   // #4ade80
const DARK_GREEN  = [163, 230, 53]   // #a3e635
const LIGHT_RED   = [239, 68, 68]    // #ef4444
const DARK_RED    = [197, 48, 48]    // #c53030

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t)
}

function getGradientColor(value, sectorVal, better) {
  if (!sectorVal || sectorVal <= 0 || !better) return { color: 'var(--metric-neutral)' }
  const pctDiff = ((value - sectorVal) / sectorVal) * 100
  const effectiveDiff = better === 'higher' ? pctDiff : -pctDiff
  if (Math.abs(pctDiff) < 10) return { color: 'var(--metric-neutral)' }
  const t = Math.min((Math.abs(pctDiff) - 10) / 90, 1)
  if (effectiveDiff > 0) {
    return { color: `rgb(${lerp(LIGHT_GREEN[0], DARK_GREEN[0], t)}, ${lerp(LIGHT_GREEN[1], DARK_GREEN[1], t)}, ${lerp(LIGHT_GREEN[2], DARK_GREEN[2], t)})` }
  } else {
    return { color: `rgb(${lerp(LIGHT_RED[0], DARK_RED[0], t)}, ${lerp(LIGHT_RED[1], DARK_RED[1], t)}, ${lerp(LIGHT_RED[2], DARK_RED[2], t)})` }
  }
}

function getStandaloneColor(cat) {
  if (cat === CAT.VERY_GOOD) return { color: `rgb(${DARK_GREEN})` }
  if (cat === CAT.GOOD) return { color: `rgb(${LIGHT_GREEN})` }
  if (cat === CAT.VERY_BAD) return { color: `rgb(${DARK_RED})` }
  if (cat === CAT.BAD) return { color: `rgb(${LIGHT_RED})` }
  return { color: 'var(--metric-neutral)' }
}

export default function MetricsGrid({ company }) {
  const { lang, t } = useLanguage()
  const m = company.metrics
  const texts = METRIC_TEXT[lang] || METRIC_TEXT.es

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--text-tertiary)]">
        <span className="text-green-400">{t('metricsGreen')}</span> = {t('metricsBetter')} · <span className="text-red-400">{t('metricsRed')}</span> = {t('metricsWorse')} · <span className="text-[var(--text-primary)] font-medium">{t('metricsWhite')}</span> = {t('metricsAverage')}
        <span className="inline-flex items-center gap-1 ml-2"><AlertTriangle className="w-3 h-3 text-amber-400" /> {t('metricsAlert')}</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {METRICS_CONFIG.map(cfg => {
          const value = m[cfg.key]
          if (cfg.hideZero && value === 0) return null
          const sectorVal = cfg.sectorKey ? m[cfg.sectorKey] : null
          const hasAlert = cfg.alert && cfg.alert(value, sectorVal, m)
          const metricText = texts[cfg.key]

          // Get interpret category
          const cat = cfg.interpret ? cfg.interpret(value, m, company.price) : null

          // Determine value color
          let valueStyle
          if (sectorVal && sectorVal > 0 && cfg.better) {
            valueStyle = getGradientColor(value, sectorVal, cfg.better)
          } else if (cat) {
            valueStyle = getStandaloneColor(cat)
          } else {
            valueStyle = { color: 'var(--metric-neutral)' }
          }

          const formatVal = (v) => {
            if (cfg.format === '$') return `$${v.toFixed(2)}`
            if (cfg.format === '%') return `${v.toFixed(1)}%`
            if (cfg.format === 'x') return `${v.toFixed(1)}x`
            return v.toFixed(1)
          }

          const interpretation = cat && metricText?.labels?.[cat] ? metricText.labels[cat] : null

          return (
            <div
              key={cfg.key}
              className={`p-4 rounded-xl border transition-colors ${
                hasAlert
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-[var(--bg-card)] border-[var(--border)]'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h4 className="text-sm font-semibold text-[var(--text-secondary)]">{cfg.label[lang] || cfg.label.en}</h4>
                {hasAlert && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              </div>
              {metricText?.desc && <p className="text-[11px] text-[var(--text-tertiary)] mb-3 leading-relaxed">{metricText.desc}</p>}
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-2xl font-bold" style={valueStyle}>
                  {formatVal(value)}
                </span>
                {sectorVal > 0 && (
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {t('sector')}: {formatVal(sectorVal)}
                  </span>
                )}
              </div>
              {interpretation && (
                <div className="flex items-start gap-1.5 mt-1">
                  <Info className="w-3 h-3 text-[var(--text-muted)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium">{interpretation}</p>
                    {metricText?.scale && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{metricText.scale}</p>}
                  </div>
                </div>
              )}
              {hasAlert && (
                <p className="text-[10px] text-amber-400/70 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {t('metricsOutOfRange')}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
