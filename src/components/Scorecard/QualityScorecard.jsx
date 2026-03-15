import { CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

const SCORECARD_ITEMS_ES = [
  { key: 'roeAbove15', label: 'ROE superior al 15% (3 años)', category: 'Rentabilidad' },
  { key: 'marginStable', label: 'Margen neto creciente o estable (3 años)', category: 'Rentabilidad' },
  { key: 'roicAboveWacc', label: 'ROIC superior al WACC', category: 'Rentabilidad' },
  { key: 'revenueGrowth', label: 'Ingresos con crecimiento positivo (3 años)', category: 'Crecimiento' },
  { key: 'fcfPositive', label: 'FCF positivo (3 años)', category: 'Crecimiento' },
  { key: 'debtBelow3', label: 'Deuda neta/EBITDA inferior a 3x', category: 'Solvencia' },
  { key: 'interestAbove5', label: 'Cobertura de intereses superior a 5x', category: 'Solvencia' },
  { key: 'piotAbove6', label: 'Piotroski F-Score superior a 6', category: 'Salud financiera' },
  { key: 'altmanAbove3', label: 'Altman Z-Score superior a 3', category: 'Salud financiera' },
  { key: 'perBelowSector', label: 'PER inferior a la media del sector', category: 'Valoración' },
  { key: 'paysDividend', label: 'Paga dividendo de forma consistente', category: 'Dividendo' },
  { key: 'dividendGrowing', label: 'Dividendo creciente (5 años)', category: 'Dividendo' },
]

const SCORECARD_ITEMS_EN = [
  { key: 'roeAbove15', label: 'ROE above 15% (3 years)', category: 'Profitability' },
  { key: 'marginStable', label: 'Net margin stable or growing (3 years)', category: 'Profitability' },
  { key: 'roicAboveWacc', label: 'ROIC above WACC', category: 'Profitability' },
  { key: 'revenueGrowth', label: 'Revenue growing (3 years)', category: 'Growth' },
  { key: 'fcfPositive', label: 'Positive FCF (3 years)', category: 'Growth' },
  { key: 'debtBelow3', label: 'Net debt/EBITDA below 3x', category: 'Solvency' },
  { key: 'interestAbove5', label: 'Interest coverage above 5x', category: 'Solvency' },
  { key: 'piotAbove6', label: 'Piotroski F-Score above 6', category: 'Financial health' },
  { key: 'altmanAbove3', label: 'Altman Z-Score above 3', category: 'Financial health' },
  { key: 'perBelowSector', label: 'P/E below sector average', category: 'Valuation' },
  { key: 'paysDividend', label: 'Pays dividend consistently', category: 'Dividend' },
  { key: 'dividendGrowing', label: 'Growing dividend (5 years)', category: 'Dividend' },
]

export default function QualityScorecard({ company }) {
  const { lang, t } = useLanguage()
  const sc = company.scorecard
  const items = lang === 'en' ? SCORECARD_ITEMS_EN : SCORECARD_ITEMS_ES

  // Count: true = passed, false = failed, null = unavailable
  const allValues = Object.values(sc)
  const available = allValues.filter(v => v !== null)
  const passed = available.filter(Boolean).length
  const failed = available.filter(v => v === false).length
  const unavailable = allValues.filter(v => v === null).length
  const total = company.scorecardTotal || available.length
  const score = passed

  const scoreColor = score >= 9 ? 'text-green-400' : score >= 6 ? 'text-yellow-400' : 'text-red-400'
  const scoreLabel = score >= 9 ? (lang === 'en' ? 'Excellent' : 'Excelente') : score >= 6 ? (lang === 'en' ? 'Good' : 'Buena') : (lang === 'en' ? 'Weak' : 'Débil')

  const categories = [...new Set(items.map(i => i.category))]

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Header with score ring */}
      <div className="p-5 flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke={score >= 9 ? '#22c55e' : score >= 6 ? '#eab308' : '#ef4444'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(total > 0 ? score / total : 0) * 213.6} 213.6`}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">/{total}</span>
          </div>
        </div>
        <div>
          <h3 className="text-[var(--text-primary)] font-semibold text-lg">{t('scorecardTitle')}</h3>
          <p className={`text-sm font-medium ${scoreColor}`}>{scoreLabel}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            <span className="text-green-400">{passed} {lang === 'en' ? 'passed' : 'cumple'}</span> · <span className="text-red-400">{failed} {lang === 'en' ? 'failed' : 'no cumple'}</span>
            {unavailable > 0 && <span className="text-[var(--text-muted)]"> · {unavailable} {lang === 'en' ? 'N/A' : 'sin datos'}</span>}
          </p>
        </div>
      </div>

      {/* Grouped criteria */}
      <div className="border-t border-[var(--border)]">
        {categories.map(cat => {
          const catItems = items.filter(i => i.category === cat)
          const catPassed = catItems.filter(i => sc[i.key]).length
          return (
            <div key={cat} className="border-b border-[var(--border)] last:border-b-0">
              <div className="px-5 py-2 bg-[var(--bg-main)] flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{cat}</span>
                <span className={`text-[11px] font-semibold ${catPassed === catItems.length ? 'text-green-400' : catPassed > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {catPassed}/{catItems.filter(i => sc[i.key] !== null).length}
                </span>
              </div>
              {catItems.map(item => {
                const val = sc[item.key]
                const isNull = val === null
                const ok = val === true
                return (
                  <div key={item.key} className="flex items-center gap-3 px-5 py-2.5 hover:bg-[var(--bg-hover)] transition-colors">
                    {isNull ? (
                      <HelpCircle className="w-4 h-4 text-[var(--text-muted)]/40 shrink-0" />
                    ) : ok ? (
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400/60 shrink-0" />
                    )}
                    <span className={`text-sm ${isNull ? 'text-[var(--text-muted)] italic' : ok ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)] line-through decoration-[var(--text-faint)]'}`}>
                      {item.label}
                      {isNull && <span className="ml-1.5 text-[10px] not-italic font-medium text-[var(--text-muted)]/60">{lang === 'en' ? '(no data)' : '(sin datos)'}</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
