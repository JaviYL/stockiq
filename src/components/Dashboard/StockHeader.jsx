import { useState } from 'react'
import { TrendingUp, TrendingDown, Building2, Tag, Database, RefreshCw, Star } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { getCacheStats } from '../../services/fmpApi'
import { isInWatchlist, toggleWatchlist } from '../../services/watchlistService'
import CompanyLogo from '../CompanyLogo'

function formatMarketCap(value, lang) {
  if (value == null || !isFinite(value)) return 'N/A'
  const locale = lang === 'es' ? 'es-ES' : 'en-US'
  if (value >= 1e12) {
    const num = (value / 1e12).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `$${num}T`
  }
  if (value >= 1e9) {
    const num = (value / 1e9).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return `$${num}${lang === 'es' ? 'MM' : 'B'}`
  }
  if (value >= 1e6) {
    const num = (value / 1e6).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return `$${num}M`
  }
  return `$${value.toLocaleString(locale)}`
}

function formatVolume(value, lang) {
  if (value == null || !isFinite(value)) return 'N/A'
  const locale = lang === 'es' ? 'es-ES' : 'en-US'
  if (value >= 1e6) return `${(value / 1e6).toLocaleString(locale, { maximumFractionDigits: 1 })}M`
  if (value >= 1e3) return `${(value / 1e3).toLocaleString(locale, { maximumFractionDigits: 1 })}K`
  return value.toLocaleString(locale)
}

function formatPrice(value, lang) {
  if (value == null || !isFinite(value)) return 'N/A'
  const locale = lang === 'es' ? 'es-ES' : 'en-US'
  return `$${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function StockHeader({ company, onRefresh }) {
  const { t, lang } = useLanguage()
  const [inWatchlist, setInWatchlist] = useState(() => isInWatchlist(company.ticker))
  const isUp = company.changePct >= 0

  const handleToggleWatchlist = () => {
    const { added } = toggleWatchlist(company.ticker)
    setInWatchlist(added)
  }
  const verdictColors = {
    'INFRAVALORADA': 'bg-green-500/20 text-green-400 border-green-500/30',
    'PRECIO JUSTO': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'SOBREVALORADA': 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <CompanyLogo ticker={company.ticker} image={company.image} size={36} />
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{company.name}</h1>
            <button
              onClick={handleToggleWatchlist}
              className={`p-1.5 rounded-lg transition-colors ${inWatchlist ? 'text-amber-400 hover:text-amber-300' : 'text-[var(--text-tertiary)] hover:text-amber-400'}`}
              title={inWatchlist ? (lang === 'es' ? 'Quitar de watchlist' : 'Remove from watchlist') : (lang === 'es' ? 'Añadir a watchlist' : 'Add to watchlist')}
            >
              <Star className={`w-5 h-5 ${inWatchlist ? 'fill-current' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{company.ticker}</span>
            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{company.exchange}</span>
            <span>{company.sector}</span>
            <span className="hidden sm:inline">· {company.industry}</span>
            {company._cached && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Database className="w-3 h-3" />
                {lang === 'es' ? 'Datos en caché' : 'Cached data'}
                {onRefresh && (
                  <button onClick={onRefresh} className="ml-1 hover:text-amber-300 transition-colors" title={lang === 'es' ? 'Actualizar datos' : 'Refresh data'}>
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </span>
            )}
          </div>
        </div>

        <div className={`flex flex-col items-center px-5 py-3 rounded-xl border ${verdictColors[company.verdict]}`}>
          <span className="text-xs font-medium uppercase tracking-wider opacity-80 mb-0.5">{t('verdict')}</span>
          <span className="text-lg font-bold">{t(company.verdict)}</span>
          <span className="text-xs opacity-70">
            {t('safetyMargin')}: {company.safetyMargin > 0 ? '+' : ''}{company.safetyMargin}%
          </span>
          <span className="text-xs mt-1.5 pt-1.5 border-t border-current/20 opacity-90 font-medium">
            {t('fairPrice')}: {formatPrice(company.intrinsicValue, lang)}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <p className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
            {formatPrice(company.price, lang)}
          </p>
          <div className={`flex items-center gap-1.5 mt-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold text-sm">
              {isUp ? '+' : ''}{company.change.toFixed(2)} ({isUp ? '+' : ''}{company.changePct.toFixed(2)}%)
            </span>
            <span className="text-[var(--text-tertiary)] text-xs ml-1">{t('today')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-[var(--text-tertiary)]">{t('marketCap')}</span>
            <p className="text-[var(--text-primary)] font-medium">{formatMarketCap(company.marketCap, lang)}</p>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)]">{t('volume')}</span>
            <p className="text-[var(--text-primary)] font-medium">{formatVolume(company.volume, lang)}</p>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)]">{t('week52')}</span>
            <p className="text-[var(--text-primary)] font-medium">{formatPrice(company.low52w, lang)} – {formatPrice(company.high52w, lang)}</p>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)]">{t('intrinsicValue')}</span>
            <p className="text-[var(--text-primary)] font-medium">{formatPrice(company.intrinsicValue, lang)}</p>
          </div>
          <div>
            <span className="text-[var(--text-tertiary)]">{t('quality')}</span>
            <p className={`font-bold ${(company.qualityScore || 0) >= 8 ? 'text-green-400' : (company.qualityScore || 0) >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{company.qualityScore}/{company.scorecardTotal || 12}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
