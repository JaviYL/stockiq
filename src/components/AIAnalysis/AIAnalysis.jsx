import { useState } from 'react'
import { Brain, TrendingUp, AlertTriangle, Zap, Target, Sparkles } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function AIAnalysis({ company }) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const a = company.aiAnalysis

  const handleGenerate = () => {
    setLoading(true)
    // Simular latencia de la API
    setTimeout(() => {
      setLoading(false)
      setShowAnalysis(true)
    }, 2500)
  }

  if (!showAnalysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <Brain className="w-16 h-16 text-blue-500 mb-4" />
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{t('aiTitle')}</h3>
        <p className="text-[var(--text-secondary)] text-sm text-center max-w-md mb-6">
          {t('aiDesc')}
        </p>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('aiAnalyzing')}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {t('aiGenerate')}
            </>
          )}
        </button>
        {loading && (
          <p className="text-[var(--text-tertiary)] text-xs mt-3 animate-pulse">
            {t('aiProcessing')}
          </p>
        )}
      </div>
    )
  }

  const verdictColors = {
    'COMPRAR': 'bg-green-500/20 text-green-400 border-green-500/30',
    'MANTENER': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'EVITAR': 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const convictionColors = {
    'ALTA': 'text-green-400',
    'MEDIA': 'text-yellow-400',
    'BAJA': 'text-red-400',
  }

  return (
    <div className="space-y-4">
      {/* Veredicto */}
      <div className={`p-5 rounded-xl border ${verdictColors[a.verdict]}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium uppercase tracking-wider opacity-70">{t('aiRecommendation')}</span>
          <span className={`text-xs font-medium ${convictionColors[a.conviction]}`}>
            {t('aiConviction')}: {a.conviction}
          </span>
        </div>
        <p className="text-2xl font-bold mb-2">{a.verdict}</p>
        <p className="text-sm opacity-90 leading-relaxed">{a.summary}</p>
        {a.targetPrice && (
          <p className="text-xs mt-3 opacity-70">
            {t('aiTargetPrice')}: <span className="font-bold">${a.targetPrice}</span>
            {' '}({((a.targetPrice - company.price) / company.price * 100).toFixed(1)}% vs actual)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Fortalezas */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <h4 className="text-green-400 font-semibold text-sm">{t('aiStrengths')}</h4>
          </div>
          <ul className="space-y-3">
            {a.strengths.map((s, i) => (
              <li key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed pl-3 border-l-2 border-green-500/30">
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Riesgos */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h4 className="text-red-400 font-semibold text-sm">{t('aiRisks')}</h4>
          </div>
          <ul className="space-y-3">
            {a.risks.map((r, i) => (
              <li key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed pl-3 border-l-2 border-red-500/30">
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Catalizadores */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h4 className="text-yellow-400 font-semibold text-sm">{t('aiCatalysts')}</h4>
          </div>
          <ul className="space-y-3">
            {a.catalysts.map((c, i) => (
              <li key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed pl-3 border-l-2 border-yellow-500/30">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-[var(--text-muted)] text-center py-2">
        {t('aiDisclaimer')}
      </p>
    </div>
  )
}
