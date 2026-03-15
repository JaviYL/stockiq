import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { fetchCompanyData, forceRefreshCompanyData } from '../services/companyDataService'
import { useLanguage } from '../context/LanguageContext'
import { Loader2, FileDown, FileSpreadsheet, ChevronLeft } from 'lucide-react'
import { logActivity, ACTIVITY } from '../services/profileService'
import { generateCompanyPDF } from '../services/pdfExportService'
import { generateCompanyExcel } from '../services/excelExportService'
import StockHeader from '../components/Dashboard/StockHeader'
import MetricsGrid from '../components/Metrics/MetricsGrid'
import QualityScorecard from '../components/Scorecard/QualityScorecard'
import DCFCalculator from '../components/DCF/DCFCalculator'
import PriceChart from '../components/Charts/PriceChart'
import FinancialsChart from '../components/Charts/FinancialsChart'
import AIAnalysis from '../components/AIAnalysis/AIAnalysis'
import ChatPanel from '../components/AIAnalysis/ChatPanel'

export default function Stock() {
  const { ticker } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { t, lang } = useLanguage()
  const canGoBack = location.key !== 'default'
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = forceRefresh
        ? await forceRefreshCompanyData(ticker.toUpperCase())
        : await fetchCompanyData(ticker.toUpperCase())
      setCompany(data)
      logActivity(ACTIVITY.STOCK_VIEW, `${ticker.toUpperCase()} — ${data.name || ''}`)
    } catch (err) {
      console.error('StockIQ load error:', err)
      setError(err.message || 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [ticker])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = () => loadData(true)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
        <p className="text-[var(--text-secondary)] text-lg">
          {t('loading') || 'Cargando'} <span className="text-[var(--text-primary)] font-bold">{ticker?.toUpperCase()}</span>...
        </p>
        <p className="text-[var(--text-tertiary)] text-sm mt-2">
          {t('loadingDesc') || 'Obteniendo datos financieros en tiempo real'}
        </p>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-[var(--text-secondary)] text-lg mb-4">{t('notFound')}: <span className="text-[var(--text-primary)] font-bold">{ticker}</span></p>
        <p className="text-[var(--text-tertiary)] text-sm mb-2">{error || 'No data available'}</p>
        <p className="text-[var(--text-tertiary)] text-sm mb-6">{t('tryWith')}: AAPL, MSFT, AMZN, NVDA, SAN.MC, IBE.MC</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          {t('backHome')}
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: t('tabOverview') },
    { id: 'metrics', label: t('tabMetrics') },
    { id: 'dcf', label: t('tabDCF') },
    { id: 'ai', label: t('tabAI') },
    { id: 'chat', label: t('tabChat') },
  ]

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {canGoBack && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-[var(--text-tertiary)] hover:text-blue-400 transition-colors mb-2 -ml-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <StockHeader company={company} onRefresh={handleRefresh} />

      <div className="flex items-center gap-2 mt-6 mb-6">
        <div className="flex gap-1 overflow-x-auto flex-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => generateCompanyPDF(company, lang)}
          className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-blue-500/40 transition-all whitespace-nowrap"
          title={t('exportPDF')}
        >
          <FileDown className="w-4 h-4" />
          PDF
        </button>
        <button
          onClick={() => generateCompanyExcel(company, lang)}
          className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-green-500/40 transition-all whitespace-nowrap"
          title="Excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
          XLSX
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <PriceChart ticker={company.ticker} />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <QualityScorecard company={company} />
            <FinancialsChart company={company} />
          </div>
        </div>
      )}

      {activeTab === 'metrics' && <MetricsGrid company={company} />}
      {activeTab === 'dcf' && <DCFCalculator company={company} />}
      {activeTab === 'ai' && <AIAnalysis company={company} />}
      {activeTab === 'chat' && <ChatPanel company={company} />}
    </div>
  )
}
