import { useState, useMemo } from 'react'
import { User, Save, Target, History, Briefcase, Shield, Clock, BarChart3, PieChart, Award, Lock, KeyRound, Smartphone, Globe2, ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useCurrency } from '../context/CurrencyContext'
import { getProfile, saveProfile, getProfileInitials, getActivityLog, getActivityLabel, logActivity, ACTIVITY } from '../services/profileService'
import { getPortfolios } from '../services/portfolioService'
import { getHoldingCurrentValue } from '../services/simulationUtils'

const SECTORS = [
  'Technology', 'Financial Services', 'Healthcare', 'Consumer Cyclical',
  'Communication Services', 'Industrials', 'Consumer Defensive',
  'Energy', 'Real Estate', 'Utilities', 'Basic Materials'
]

const sectorTranslations = {
  'Technology': 'Tecnología',
  'Financial Services': 'Servicios Financieros',
  'Healthcare': 'Salud',
  'Consumer Cyclical': 'Consumo Cíclico',
  'Communication Services': 'Comunicación',
  'Industrials': 'Industria',
  'Consumer Defensive': 'Consumo Defensivo',
  'Energy': 'Energía',
  'Real Estate': 'Inmobiliario',
  'Utilities': 'Servicios Públicos',
  'Basic Materials': 'Materiales Básicos',
}

const COUNTRIES = [
  { code: 'ES', flag: '🇪🇸', name: 'España', nameEn: 'Spain' },
  { code: 'US', flag: '🇺🇸', name: 'Estados Unidos', nameEn: 'United States' },
  { code: 'GB', flag: '🇬🇧', name: 'Reino Unido', nameEn: 'United Kingdom' },
  { code: 'DE', flag: '🇩🇪', name: 'Alemania', nameEn: 'Germany' },
  { code: 'FR', flag: '🇫🇷', name: 'Francia', nameEn: 'France' },
  { code: 'IT', flag: '🇮🇹', name: 'Italia', nameEn: 'Italy' },
  { code: 'PT', flag: '🇵🇹', name: 'Portugal', nameEn: 'Portugal' },
  { code: 'NL', flag: '🇳🇱', name: 'Países Bajos', nameEn: 'Netherlands' },
  { code: 'BE', flag: '🇧🇪', name: 'Bélgica', nameEn: 'Belgium' },
  { code: 'CH', flag: '🇨🇭', name: 'Suiza', nameEn: 'Switzerland' },
  { code: 'AT', flag: '🇦🇹', name: 'Austria', nameEn: 'Austria' },
  { code: 'SE', flag: '🇸🇪', name: 'Suecia', nameEn: 'Sweden' },
  { code: 'NO', flag: '🇳🇴', name: 'Noruega', nameEn: 'Norway' },
  { code: 'DK', flag: '🇩🇰', name: 'Dinamarca', nameEn: 'Denmark' },
  { code: 'FI', flag: '🇫🇮', name: 'Finlandia', nameEn: 'Finland' },
  { code: 'IE', flag: '🇮🇪', name: 'Irlanda', nameEn: 'Ireland' },
  { code: 'PL', flag: '🇵🇱', name: 'Polonia', nameEn: 'Poland' },
  { code: 'MX', flag: '🇲🇽', name: 'México', nameEn: 'Mexico' },
  { code: 'AR', flag: '🇦🇷', name: 'Argentina', nameEn: 'Argentina' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia', nameEn: 'Colombia' },
  { code: 'CL', flag: '🇨🇱', name: 'Chile', nameEn: 'Chile' },
  { code: 'PE', flag: '🇵🇪', name: 'Perú', nameEn: 'Peru' },
  { code: 'BR', flag: '🇧🇷', name: 'Brasil', nameEn: 'Brazil' },
  { code: 'JP', flag: '🇯🇵', name: 'Japón', nameEn: 'Japan' },
  { code: 'CN', flag: '🇨🇳', name: 'China', nameEn: 'China' },
  { code: 'KR', flag: '🇰🇷', name: 'Corea del Sur', nameEn: 'South Korea' },
  { code: 'IN', flag: '🇮🇳', name: 'India', nameEn: 'India' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia', nameEn: 'Australia' },
  { code: 'CA', flag: '🇨🇦', name: 'Canadá', nameEn: 'Canada' },
]

export default function Profile() {
  const { lang } = useLanguage()
  const { currency, setCurrency, usdToEur, rateLoaded, symbol } = useCurrency()
  const isEs = lang === 'es'

  const [profile, setProfile] = useState(getProfile)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')
  const [countryOpen, setCountryOpen] = useState(false)

  // Re-read portfolios fresh from localStorage every time Profile mounts
  // (no stale useMemo — always in sync with Portfolio changes)
  const portfolios = getPortfolios()
  const activityLog = getActivityLog()

  // ─── Global Summary ───
  const globalSummary = useMemo(() => {
    let totalInvested = 0
    let totalCurrent = 0
    let holdingsCount = 0
    const sectorMap = {}

    portfolios.forEach(p => {
      p.holdings.forEach(h => {
        const invested = h.amount || 0
        totalInvested += invested
        totalCurrent += getHoldingCurrentValue(h, null)
        holdingsCount++
        const sec = h.sector && h.sector !== 'N/A' ? h.sector : null
        if (sec) {
          sectorMap[sec] = (sectorMap[sec] || 0) + invested
        }
      })
    })

    const totalReturn = totalInvested > 0 ? ((totalCurrent / totalInvested) - 1) * 100 : 0
    const sectors = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])

    return { totalInvested, totalCurrent, totalReturn, holdingsCount, portfolioCount: portfolios.length, sectors }
  }, [portfolios])

  // ─── Financial goals progress ───
  const goalProgress = useMemo(() => {
    if (!profile.targetPortfolioValue || profile.targetPortfolioValue <= 0) return 0
    return Math.min(100, (globalSummary.totalCurrent / profile.targetPortfolioValue) * 100)
  }, [globalSummary.totalCurrent, profile.targetPortfolioValue])

  const handleSave = () => {
    saveProfile(profile)
    logActivity(ACTIVITY.PROFILE_UPDATE, profile.name || '')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCurrencyChange = (c) => {
    setCurrency(c)
    setProfile(prev => ({ ...prev, currency: c }))
  }

  const toggleSector = (sector) => {
    setProfile(prev => {
      const favs = prev.favoriteSectors || []
      if (favs.includes(sector)) return { ...prev, favoriteSectors: favs.filter(s => s !== sector) }
      return { ...prev, favoriteSectors: [...favs, sector] }
    })
  }

  // Format portfolio values with currency toggle.
  // Amounts are stored as EUR (user's base). When USD selected, convert EUR→USD.
  const fmtVal = (v) => {
    if (v == null || isNaN(v)) return `${symbol}0`
    const converted = currency === 'USD' ? v / (usdToEur || 0.92) : v
    return `${symbol}${converted.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  const initials = getProfileInitials(profile)
  const selectedCountry = COUNTRIES.find(c => c.code === profile.country) || null

  const tabs = [
    { id: 'summary', label: isEs ? 'Resumen' : 'Summary', icon: BarChart3 },
    { id: 'data', label: isEs ? 'Datos' : 'Data', icon: User },
    { id: 'preferences', label: isEs ? 'Preferencias' : 'Preferences', icon: Shield },
    { id: 'goals', label: isEs ? 'Objetivos' : 'Goals', icon: Target },
    { id: 'security', label: isEs ? 'Seguridad' : 'Security', icon: Lock },
    { id: 'activity', label: isEs ? 'Historial' : 'Activity', icon: History },
  ]

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center text-xl font-bold text-blue-400">
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {profile.name || (isEs ? 'Mi Perfil' : 'My Profile')}
          </h1>
          <p className="text-sm text-[var(--text-tertiary)]">
            {isEs ? 'Gestiona tus datos, preferencias y objetivos de inversión' : 'Manage your data, preferences and investment goals'}
          </p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? (isEs ? 'Guardado' : 'Saved') : (isEs ? 'Guardar' : 'Save')}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border)] mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-hover)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ TAB: RESUMEN GLOBAL ═══════ */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{isEs ? 'Carteras' : 'Portfolios'}</p>
              <p className="text-2xl font-bold text-white">{globalSummary.portfolioCount}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{isEs ? 'Activos' : 'Holdings'}</p>
              <p className="text-2xl font-bold text-white">{globalSummary.holdingsCount}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{isEs ? 'Valor actual' : 'Current value'}</p>
              <p className="text-2xl font-bold text-blue-400">{fmtVal(globalSummary.totalCurrent)}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4">
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{isEs ? 'Rentabilidad' : 'Return'}</p>
              <p className={`text-2xl font-bold ${globalSummary.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {globalSummary.totalReturn >= 0 ? '+' : ''}{globalSummary.totalReturn.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Investment breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                {isEs ? 'Resumen de inversión' : 'Investment summary'}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{isEs ? 'Total invertido' : 'Total invested'}</span>
                  <span className="text-sm font-medium text-white">{fmtVal(globalSummary.totalInvested)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{isEs ? 'Valor actual' : 'Current value'}</span>
                  <span className="text-sm font-medium text-blue-400">{fmtVal(globalSummary.totalCurrent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)]">{isEs ? 'Ganancia/Pérdida' : 'Gain/Loss'}</span>
                  <span className={`text-sm font-medium ${globalSummary.totalCurrent - globalSummary.totalInvested >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fmtVal(globalSummary.totalCurrent - globalSummary.totalInvested)}
                  </span>
                </div>
                {profile.targetPortfolioValue > 0 && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <div className="flex justify-between text-xs text-[var(--text-tertiary)] mb-1">
                      <span>{isEs ? 'Progreso hacia objetivo' : 'Goal progress'}</span>
                      <span>{goalProgress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-main)] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                      {isEs ? 'Objetivo' : 'Target'}: {fmtVal(profile.targetPortfolioValue)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sector distribution */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-400" />
                {isEs ? 'Distribución por sector' : 'Sector distribution'}
              </h3>
              {globalSummary.sectors.length === 0 ? (
                <div className="text-center py-6">
                  <PieChart className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-[var(--text-tertiary)]">
                    {isEs
                      ? 'Los sectores aparecerán cuando añadas nuevas empresas a tus carteras'
                      : 'Sectors will appear when you add new companies to portfolios'}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-1 opacity-60">
                    {isEs ? 'Las empresas existentes necesitan ser re-añadidas para registrar su sector' : 'Existing companies need to be re-added to register their sector'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {globalSummary.sectors.slice(0, 6).map(([sector, amount]) => {
                    const pct = globalSummary.totalInvested > 0 ? (amount / globalSummary.totalInvested * 100) : 0
                    return (
                      <div key={sector}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-[var(--text-secondary)]">{isEs ? (sectorTranslations[sector] || sector) : sector}</span>
                          <span className="text-white">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-[var(--bg-main)] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB: DATOS PERSONALES ═══════ */}
      {activeTab === 'data' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            {isEs ? 'Datos del inversor' : 'Investor data'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{isEs ? 'Nombre' : 'Name'}</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder={isEs ? 'Tu nombre...' : 'Your name...'}
                className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
              {isEs ? 'País' : 'Country'}
            </label>
            <div className="relative">
              <button
                onClick={() => setCountryOpen(!countryOpen)}
                className="w-full sm:w-72 flex items-center justify-between px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
              >
                <span className="flex items-center gap-2">
                  {selectedCountry ? (
                    <>
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span>{isEs ? selectedCountry.name : selectedCountry.nameEn}</span>
                    </>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">{isEs ? 'Seleccionar país...' : 'Select country...'}</span>
                  )}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
              </button>
              {countryOpen && (
                <div className="absolute z-20 mt-1 w-full sm:w-72 max-h-60 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl">
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code}
                      onClick={() => { setProfile(p => ({ ...p, country: c.code })); setCountryOpen(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors ${
                        profile.country === c.code ? 'text-blue-400 bg-blue-500/5' : 'text-white'
                      }`}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span>{isEs ? c.name : c.nameEn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">{isEs ? 'Nivel de experiencia' : 'Experience level'}</label>
            <div className="flex gap-2">
              {[
                { value: 'beginner', label: isEs ? 'Principiante' : 'Beginner' },
                { value: 'intermediate', label: isEs ? 'Intermedio' : 'Intermediate' },
                { value: 'advanced', label: isEs ? 'Avanzado' : 'Advanced' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setProfile(p => ({ ...p, experienceLevel: opt.value }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    profile.experienceLevel === opt.value
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border)] hover:border-blue-500/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
              {isEs ? 'Moneda de referencia' : 'Reference currency'}
            </label>
            <div className="flex gap-2 items-center">
              {[
                { value: 'USD', label: 'USD ($)', icon: '🇺🇸' },
                { value: 'EUR', label: 'EUR (€)', icon: '🇪🇺' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleCurrencyChange(opt.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                    currency === opt.value
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border)] hover:border-blue-500/30'
                  }`}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
              <span className="text-xs text-[var(--text-tertiary)] ml-2">
                1 USD = {usdToEur.toFixed(4)} EUR
                {rateLoaded && <span className="text-green-400 ml-1">●</span>}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              {isEs ? 'El tipo de cambio se actualiza en tiempo real cada hora' : 'Exchange rate updates in real-time every hour'}
            </p>
          </div>
        </div>
      )}

      {/* ═══════ TAB: PREFERENCIAS ═══════ */}
      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-400" />
              {isEs ? 'Perfil de riesgo' : 'Risk profile'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'conservative', label: isEs ? 'Conservador' : 'Conservative', desc: isEs ? 'Priorizo preservar capital. Bonos, dividendos.' : 'Capital preservation priority. Bonds, dividends.', activeColor: 'bg-green-500/10 border-green-500/30', textColor: 'text-green-400' },
                { value: 'moderate', label: isEs ? 'Moderado' : 'Moderate', desc: isEs ? 'Balance entre crecimiento y seguridad.' : 'Balance between growth and safety.', activeColor: 'bg-yellow-500/10 border-yellow-500/30', textColor: 'text-yellow-400' },
                { value: 'aggressive', label: isEs ? 'Agresivo' : 'Aggressive', desc: isEs ? 'Máximo crecimiento. Tolero alta volatilidad.' : 'Maximum growth. High volatility tolerance.', activeColor: 'bg-red-500/10 border-red-500/30', textColor: 'text-red-400' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setProfile(p => ({ ...p, riskProfile: opt.value }))}
                  className={`text-left p-4 rounded-xl border transition-colors ${
                    profile.riskProfile === opt.value
                      ? opt.activeColor
                      : 'bg-[var(--bg-main)] border-[var(--border)] hover:border-blue-500/30'
                  }`}
                >
                  <p className={`font-medium text-sm ${profile.riskProfile === opt.value ? opt.textColor : 'text-white'}`}>{opt.label}</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-400" />
              {isEs ? 'Horizonte de inversión' : 'Investment horizon'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'short', label: isEs ? 'Corto plazo (< 2 años)' : 'Short term (< 2 years)' },
                { value: 'medium', label: isEs ? 'Medio plazo (2-7 años)' : 'Medium term (2-7 years)' },
                { value: 'long', label: isEs ? 'Largo plazo (> 7 años)' : 'Long term (> 7 years)' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setProfile(p => ({ ...p, investmentHorizon: opt.value }))}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                    profile.investmentHorizon === opt.value
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border)] hover:border-blue-500/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-blue-400" />
              {isEs ? 'Sectores favoritos' : 'Favorite sectors'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map(sector => {
                const selected = (profile.favoriteSectors || []).includes(sector)
                return (
                  <button
                    key={sector}
                    onClick={() => toggleSector(sector)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      selected
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-[var(--border)] hover:border-blue-500/30'
                    }`}
                  >
                    {isEs ? (sectorTranslations[sector] || sector) : sector}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TAB: OBJETIVOS ═══════ */}
      {activeTab === 'goals' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            {isEs ? 'Objetivos financieros' : 'Financial goals'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                {isEs ? 'Rentabilidad anual objetivo (%)' : 'Target annual return (%)'}
              </label>
              <input
                type="number"
                value={profile.targetAnnualReturn}
                onChange={e => setProfile(p => ({ ...p, targetAnnualReturn: Number(e.target.value) }))}
                min={0} max={100} step={0.5}
                className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                {isEs ? `Valor objetivo (${symbol})` : `Target value (${symbol})`}
              </label>
              <input
                type="number"
                value={profile.targetPortfolioValue}
                onChange={e => setProfile(p => ({ ...p, targetPortfolioValue: Number(e.target.value) }))}
                min={0} step={1000}
                className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                {isEs ? 'Plazo (años)' : 'Timeframe (years)'}
              </label>
              <input
                type="number"
                value={profile.targetYears}
                onChange={e => setProfile(p => ({ ...p, targetYears: Number(e.target.value) }))}
                min={1} max={50} step={1}
                className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>

          <div className="bg-[var(--bg-main)] rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[var(--text-secondary)]">{isEs ? 'Progreso hacia tu objetivo' : 'Progress towards your goal'}</span>
              <span className="text-sm font-bold text-blue-400">{goalProgress.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-[var(--border)] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${goalProgress >= 100 ? 'bg-green-500' : goalProgress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                style={{ width: `${Math.min(100, goalProgress)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
              <span>{fmtVal(globalSummary.totalCurrent)} {isEs ? 'actual' : 'current'}</span>
              <span>{fmtVal(profile.targetPortfolioValue)} {isEs ? 'objetivo' : 'target'}</span>
            </div>

            {profile.targetAnnualReturn > 0 && globalSummary.totalCurrent > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <p className="text-xs text-[var(--text-tertiary)]">
                  {isEs
                    ? `Con una rentabilidad del ${profile.targetAnnualReturn}% anual, tu cartera de ${fmtVal(globalSummary.totalCurrent)} valdría ${fmtVal(globalSummary.totalCurrent * Math.pow(1 + profile.targetAnnualReturn / 100, profile.targetYears))} en ${profile.targetYears} años.`
                    : `At ${profile.targetAnnualReturn}% annual return, your ${fmtVal(globalSummary.totalCurrent)} portfolio would be worth ${fmtVal(globalSummary.totalCurrent * Math.pow(1 + profile.targetAnnualReturn / 100, profile.targetYears))} in ${profile.targetYears} years.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ TAB: SEGURIDAD ═══════ */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* Change password */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-blue-400" />
              {isEs ? 'Cambiar contraseña' : 'Change password'}
            </h3>
            <div className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  {isEs ? 'Contraseña actual' : 'Current password'}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled
                  className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--text-tertiary)] focus:outline-none opacity-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  {isEs ? 'Nueva contraseña' : 'New password'}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled
                  className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--text-tertiary)] focus:outline-none opacity-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  {isEs ? 'Confirmar nueva contraseña' : 'Confirm new password'}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  disabled
                  className="w-full px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--text-tertiary)] focus:outline-none opacity-50 cursor-not-allowed"
                />
              </div>
              <button
                disabled
                className="px-4 py-2 bg-blue-600/50 text-white/50 rounded-lg text-sm font-medium cursor-not-allowed"
              >
                {isEs ? 'Actualizar contraseña' : 'Update password'}
              </button>
              <p className="text-[10px] text-[var(--text-tertiary)] opacity-60">
                {isEs ? 'Disponible próximamente con el sistema de autenticación' : 'Coming soon with authentication system'}
              </p>
            </div>
          </div>

          {/* 2FA */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Smartphone className="w-4 h-4 text-blue-400" />
              {isEs ? 'Autenticación de dos factores (2FA)' : 'Two-factor authentication (2FA)'}
            </h3>
            <div className="flex items-center justify-between bg-[var(--bg-main)] rounded-xl p-4">
              <div>
                <p className="text-sm text-white font-medium">
                  {isEs ? 'Autenticación por aplicación' : 'App-based authentication'}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {isEs ? 'Google Authenticator, Authy u otra app compatible' : 'Google Authenticator, Authy or compatible app'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">{isEs ? 'Desactivado' : 'Disabled'}</span>
                <div className="w-10 h-5 rounded-full bg-[var(--border)] relative opacity-50 cursor-not-allowed">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white/60" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between bg-[var(--bg-main)] rounded-xl p-4 mt-2">
              <div>
                <p className="text-sm text-white font-medium">
                  {isEs ? 'Autenticación por SMS' : 'SMS authentication'}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {isEs ? 'Recibe un código por mensaje de texto' : 'Receive a code via text message'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-tertiary)]">{isEs ? 'Desactivado' : 'Disabled'}</span>
                <div className="w-10 h-5 rounded-full bg-[var(--border)] relative opacity-50 cursor-not-allowed">
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white/60" />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-3 opacity-60">
              {isEs ? 'Disponible próximamente con el sistema de autenticación' : 'Coming soon with authentication system'}
            </p>
          </div>

          {/* Sessions */}
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Globe2 className="w-4 h-4 text-blue-400" />
              {isEs ? 'Sesiones activas' : 'Active sessions'}
            </h3>
            <div className="flex items-center justify-between bg-[var(--bg-main)] rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <div>
                  <p className="text-sm text-white font-medium">{isEs ? 'Sesión actual' : 'Current session'}</p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {isEs ? 'Este dispositivo · Activo ahora' : 'This device · Active now'}
                  </p>
                </div>
              </div>
            </div>
            <button
              disabled
              className="mt-3 text-xs text-red-400/50 font-medium cursor-not-allowed"
            >
              {isEs ? 'Cerrar todas las demás sesiones' : 'Sign out all other sessions'}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ TAB: HISTORIAL ═══════ */}
      {activeTab === 'activity' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-blue-400" />
            {isEs ? 'Historial de actividad' : 'Activity history'}
          </h3>

          {activityLog.length === 0 ? (
            <div className="text-center py-10">
              <History className="w-10 h-10 text-[var(--text-tertiary)] mx-auto mb-3 opacity-30" />
              <p className="text-sm text-[var(--text-tertiary)]">
                {isEs ? 'No hay actividad registrada todavía' : 'No activity recorded yet'}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {isEs ? 'Tu actividad aparecerá aquí conforme uses StockIQ' : 'Your activity will appear here as you use StockIQ'}
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {activityLog.map((entry, i) => {
                const date = new Date(entry.timestamp)
                const timeStr = date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-main)] transition-colors">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="text-sm text-white flex-1">{getActivityLabel(entry.action, isEs)}</span>
                    {entry.detail && <span className="text-xs text-blue-400 font-medium">{entry.detail}</span>}
                    <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">{timeStr}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
