import { createContext, useContext, useState } from 'react'

const LanguageContext = createContext()

const translations = {
  es: {
    // Nav
    home: 'Inicio',
    calculator: 'Calculadora',
    searchPlaceholder: 'Buscar ticker...',
    searchPlaceholderLong: 'Buscar por ticker o nombre (ej: AAPL, Microsoft...)',
    // Home
    heroSubtitle: 'Introduce un ticker y obtén un análisis completo con IA en segundos.',
    heroSubtitle2: 'Valoración, métricas fundamentales, DCF y veredicto accionable.',
    // Features
    featMetrics: 'Métricas Fundamentales',
    featMetricsDesc: '18 ratios clave con comparativa sectorial y alertas visuales',
    featChart: 'Gráfico Profesional',
    featChartDesc: 'Velas japonesas con TradingView, múltiples timeframes',
    featDCF: 'Valoración DCF',
    featDCFDesc: 'Modelo de flujos descontados con controles interactivos',
    featAI: 'Análisis con IA',
    featAIDesc: 'Veredicto completo generado por Claude: fortalezas, riesgos y recomendación',
    // Stock tabs
    tabOverview: 'Resumen',
    tabMetrics: 'Métricas',
    tabDCF: 'Valoración DCF',
    tabAI: 'Análisis IA',
    tabChat: 'Chat',
    // Stock header
    verdict: 'Veredicto',
    safetyMargin: 'Margen de seguridad',
    fairPrice: 'Precio justo',
    marketCap: 'Cap. mercado',
    volume: 'Volumen',
    week52: '52 sem.',
    intrinsicValue: 'Valor intrínseco',
    quality: 'Calidad',
    today: 'hoy',
    // Metrics
    metricsGreen: 'Verde',
    metricsRed: 'Rojo',
    metricsWhite: 'Blanco',
    metricsBetter: 'mejor que el sector',
    metricsWorse: 'peor que el sector',
    metricsAverage: 'en la media',
    metricsAlert: 'alerta',
    metricsOutOfRange: 'Este valor está fuera del rango habitual',
    sector: 'Sector',
    // Calculator
    calcTitle: 'Calculadora de Interés Compuesto',
    calcSubtitle: 'Simula el crecimiento de tu inversión a lo largo del tiempo',
    calcInitial: 'Capital inicial',
    calcMonthly: 'Aportación mensual',
    calcRate: 'Rentabilidad anual esperada',
    calcMonths: 'Horizonte temporal (meses)',
    calcHelpInitial: 'Importe que inviertes hoy',
    calcHelpMonthly: 'Cuánto añades cada mes',
    calcHelpRate: 'S&P 500 históricamente ~10%, bonos ~4%',
    calcYears: 'años',
    calcFinal: 'Capital final',
    calcProfit: 'Beneficio total',
    calcReturn: 'Rentabilidad',
    calcVsBond: 'vs Bono 4%',
    calcInvestment: 'Tu inversión',
    calcContributions: 'Aportaciones',
    months: 'meses',
    // Stock not found
    notFound: 'Empresa no encontrada',
    tryWith: 'Prueba con',
    backHome: 'Volver al inicio',
    // Loading
    loading: 'Cargando',
    loadingDesc: 'Obteniendo datos financieros en tiempo real',
    // Footer
    footerDisclaimer: 'No es asesoramiento financiero',
    footerMockData: 'Datos ficticios (demo)',
    footerRealData: 'Datos en tiempo real',
    // Verdicts
    INFRAVALORADA: 'INFRAVALORADA',
    'PRECIO JUSTO': 'PRECIO JUSTO',
    SOBREVALORADA: 'SOBREVALORADA',
    // Scorecard
    scorecardTitle: 'Scorecard de Calidad',
    // Financials
    finTitle: 'Evolución Financiera',
    finRevenue: 'Ingresos',
    finNetIncome: 'Beneficio Neto',
    finLatest: 'Último',
    finTotalGrowth: 'Crec. total',
    // Chart types
    chartCandles: 'Velas',
    chartLine: 'Línea',
    chartArea: 'Área',
    // AI Analysis
    aiTitle: 'Análisis IA Completo',
    aiDesc: 'Claude analizará los datos financieros y generará un informe con veredicto, fortalezas, riesgos, catalizadores y recomendación final.',
    aiGenerate: 'Generar análisis completo',
    aiAnalyzing: 'Analizando...',
    aiProcessing: 'Procesando datos financieros con Claude Sonnet 4.6...',
    aiRecommendation: 'Recomendación IA',
    aiConviction: 'Convicción',
    aiTargetPrice: 'Precio objetivo',
    aiStrengths: 'Fortalezas',
    aiRisks: 'Riesgos',
    aiCatalysts: 'Catalizadores',
    aiDisclaimer: 'Esto no es asesoramiento financiero. Haz tu propia investigación.',
    aiBuy: 'COMPRAR',
    aiHold: 'MANTENER',
    aiAvoid: 'EVITAR',
    // DCF
    dcfTitle: 'Modelo de Valoración DCF',
    dcfWhatIs: '¿Qué es el modelo DCF?',
    dcfIntrinsic: 'Valor intrínseco por acción',
    dcfCurrentPrice: 'Precio actual',
    dcfSafetyMargin: 'Margen de seguridad',
    dcfGrowth5: 'Crecimiento FCF años 1-5',
    dcfGrowth10: 'Crecimiento FCF años 6-10',
    dcfTerminal: 'Crecimiento terminal (perpetuo)',
    dcfWacc: 'WACC (tasa de descuento)',
    dcfBear: 'Bear (pesimista)',
    dcfBase: 'Base (actual)',
    dcfBull: 'Bull (optimista)',
    dcfFlows: 'Flujos de caja proyectados',
    dcfYear: 'Año',
    dcfProjectedFCF: 'FCF proyectado',
    dcfPresentValue: 'Valor presente',
    dcfTotal: 'Total',
    dcfVsActual: 'vs precio actual',
    dcfGrowth: 'Crecimiento',
    // DCF extra
    dcfFcfBase: 'FCF base',
    dcfSharesOutstanding: 'Acciones en circulación',
    dcfHelp5: 'Tasa anual de crecimiento esperada del flujo de caja libre',
    dcfHelp10: 'Normalmente más conservador que los primeros 5 años',
    dcfHelpTerminal: 'Crecimiento a perpetuidad después del año 10 (~PIB nominal)',
    dcfHelpWacc: 'Mayor WACC = más descuento = menor valor intrínseco',
    dcfInfoTitle: '¿Qué es el modelo DCF?',
    dcfInfoP1: 'El **Discounted Cash Flow (DCF)** calcula cuánto vale una empresa hoy basándose en el dinero que generará en el futuro. Proyecta el flujo de caja libre (FCF) de los próximos 10 años y lo descuenta al presente usando una tasa (WACC).',
    dcfInfoP2: '**Crecimiento años 1-5:** Tasa a la que esperas que crezca el FCF en los próximos 5 años. Se basa en el crecimiento histórico.',
    dcfInfoP3: '**Crecimiento años 6-10:** Tasa más conservadora para la segunda mitad, ya que el crecimiento se desacelera con el tiempo.',
    dcfInfoP4: '**Crecimiento terminal:** Tasa de crecimiento perpetuo después del año 10 (normalmente 2-3%, similar al PIB).',
    dcfInfoP5: '**WACC:** Coste medio ponderado del capital. Cuanto mayor sea, menos valen los flujos futuros. Incluye el coste de la deuda y la rentabilidad exigida por los accionistas.',
    dcfUndervalued: 'Potencialmente infravalorada',
    dcfSlightUnder: 'Ligeramente infravalorada',
    dcfFairPrice: 'Cerca de precio justo',
    dcfOvervalued: 'Potencialmente sobrevalorada',
    // Chat
    chatTitle: 'Chat con IA sobre',
    chatModel: 'Modelo',
    chatContext: 'Contexto: datos cargados de',
    chatPlaceholder: 'Pregunta sobre la empresa...',
    chatWelcome: '¡Hola! Soy tu analista financiero IA. Tengo cargados todos los datos de',
    chatWelcome2: 'Pregúntame lo que quieras: deuda, márgenes, valoración, dividendos, competidores...',
    chatSuggestions: [
      '¿Cuánta deuda tiene y puede pagarla?',
      '¿Cómo han evolucionado los márgenes?',
      '¿Qué pasa si el WACC sube al 12%?',
      '¿Compara con el sector?',
      '¿Paga dividendo sostenible?',
    ],
    // Watchlist
    watchlist: 'Watchlist',
    // Comparator
    comparator: 'Comparador',
    // PDF
    exportPDF: 'Exportar PDF',
    // Calculator extra
    calcToday: 'Hoy',
    calcBond: 'Bono 4%',
  },
  en: {
    // Nav
    home: 'Home',
    calculator: 'Calculator',
    searchPlaceholder: 'Search ticker...',
    searchPlaceholderLong: 'Search by ticker or name (e.g. AAPL, Microsoft...)',
    // Home
    heroSubtitle: 'Enter a ticker and get a full AI-powered analysis in seconds.',
    heroSubtitle2: 'Valuation, fundamental metrics, DCF model & actionable verdict.',
    // Features
    featMetrics: 'Fundamental Metrics',
    featMetricsDesc: '18 key ratios with sector comparison and visual alerts',
    featChart: 'Professional Chart',
    featChartDesc: 'Japanese candlesticks with TradingView, multiple timeframes',
    featDCF: 'DCF Valuation',
    featDCFDesc: 'Discounted cash flow model with interactive controls',
    featAI: 'AI Analysis',
    featAIDesc: 'Full verdict by Claude: strengths, risks & recommendation',
    // Stock tabs
    tabOverview: 'Overview',
    tabMetrics: 'Metrics',
    tabDCF: 'DCF Valuation',
    tabAI: 'AI Analysis',
    tabChat: 'Chat',
    // Stock header
    verdict: 'Verdict',
    safetyMargin: 'Safety margin',
    fairPrice: 'Fair price',
    marketCap: 'Market cap',
    volume: 'Volume',
    week52: '52 wk.',
    intrinsicValue: 'Intrinsic value',
    quality: 'Quality',
    today: 'today',
    // Metrics
    metricsGreen: 'Green',
    metricsRed: 'Red',
    metricsWhite: 'White',
    metricsBetter: 'better than sector',
    metricsWorse: 'worse than sector',
    metricsAverage: 'at the average',
    metricsAlert: 'alert',
    metricsOutOfRange: 'This value is outside the typical range',
    sector: 'Sector',
    // Calculator
    calcTitle: 'Compound Interest Calculator',
    calcSubtitle: 'Simulate your investment growth over time',
    calcInitial: 'Initial capital',
    calcMonthly: 'Monthly contribution',
    calcRate: 'Expected annual return',
    calcMonths: 'Time horizon (months)',
    calcHelpInitial: 'Amount you invest today',
    calcHelpMonthly: 'How much you add each month',
    calcHelpRate: 'S&P 500 historically ~10%, bonds ~4%',
    calcYears: 'years',
    calcFinal: 'Final capital',
    calcProfit: 'Total profit',
    calcReturn: 'Return',
    calcVsBond: 'vs Bond 4%',
    calcInvestment: 'Your investment',
    calcContributions: 'Contributions',
    months: 'months',
    // Stock not found
    notFound: 'Company not found',
    tryWith: 'Try with',
    backHome: 'Back to home',
    // Loading
    loading: 'Loading',
    loadingDesc: 'Fetching real-time financial data',
    // Footer
    footerDisclaimer: 'Not financial advice',
    footerMockData: 'Mock data (demo)',
    footerRealData: 'Real-time data',
    // Verdicts
    INFRAVALORADA: 'UNDERVALUED',
    'PRECIO JUSTO': 'FAIR PRICE',
    SOBREVALORADA: 'OVERVALUED',
    // Scorecard
    scorecardTitle: 'Quality Scorecard',
    // Financials
    finTitle: 'Financial Evolution',
    finRevenue: 'Revenue',
    finNetIncome: 'Net Income',
    finLatest: 'Latest',
    finTotalGrowth: 'Total growth',
    // Chart types
    chartCandles: 'Candles',
    chartLine: 'Line',
    chartArea: 'Area',
    // AI Analysis
    aiTitle: 'Full AI Analysis',
    aiDesc: 'Claude will analyze the financial data and generate a report with verdict, strengths, risks, catalysts and final recommendation.',
    aiGenerate: 'Generate full analysis',
    aiAnalyzing: 'Analyzing...',
    aiProcessing: 'Processing financial data with Claude Sonnet 4.6...',
    aiRecommendation: 'AI Recommendation',
    aiConviction: 'Conviction',
    aiTargetPrice: 'Target price',
    aiStrengths: 'Strengths',
    aiRisks: 'Risks',
    aiCatalysts: 'Catalysts',
    aiDisclaimer: 'This is not financial advice. Do your own research.',
    aiBuy: 'BUY',
    aiHold: 'HOLD',
    aiAvoid: 'AVOID',
    // DCF
    dcfTitle: 'DCF Valuation Model',
    dcfWhatIs: 'What is the DCF model?',
    dcfIntrinsic: 'Intrinsic value per share',
    dcfCurrentPrice: 'Current price',
    dcfSafetyMargin: 'Safety margin',
    dcfGrowth5: 'FCF Growth years 1-5',
    dcfGrowth10: 'FCF Growth years 6-10',
    dcfTerminal: 'Terminal growth (perpetual)',
    dcfWacc: 'WACC (discount rate)',
    dcfBear: 'Bear (pessimistic)',
    dcfBase: 'Base (current)',
    dcfBull: 'Bull (optimistic)',
    dcfFlows: 'Projected cash flows',
    dcfYear: 'Year',
    dcfProjectedFCF: 'Projected FCF',
    dcfPresentValue: 'Present value',
    dcfTotal: 'Total',
    dcfVsActual: 'vs current price',
    dcfGrowth: 'Growth',
    // DCF extra
    dcfFcfBase: 'Base FCF',
    dcfSharesOutstanding: 'Shares outstanding',
    dcfHelp5: 'Expected annual growth rate of free cash flow',
    dcfHelp10: 'Usually more conservative than the first 5 years',
    dcfHelpTerminal: 'Perpetual growth after year 10 (~nominal GDP)',
    dcfHelpWacc: 'Higher WACC = more discount = lower intrinsic value',
    dcfInfoTitle: 'What is the DCF model?',
    dcfInfoP1: 'The **Discounted Cash Flow (DCF)** calculates how much a company is worth today based on the money it will generate in the future. It projects free cash flow (FCF) for the next 10 years and discounts it to the present using a rate (WACC).',
    dcfInfoP2: '**Growth years 1-5:** Rate at which you expect FCF to grow over the next 5 years. Based on historical growth.',
    dcfInfoP3: '**Growth years 6-10:** More conservative rate for the second half, as growth decelerates over time.',
    dcfInfoP4: '**Terminal growth:** Perpetual growth rate after year 10 (usually 2-3%, similar to GDP).',
    dcfInfoP5: '**WACC:** Weighted average cost of capital. The higher it is, the less future cash flows are worth. Includes cost of debt and return required by shareholders.',
    dcfUndervalued: 'Potentially undervalued',
    dcfSlightUnder: 'Slightly undervalued',
    dcfFairPrice: 'Near fair price',
    dcfOvervalued: 'Potentially overvalued',
    // Chat
    chatTitle: 'AI Chat about',
    chatModel: 'Model',
    chatContext: 'Context: loaded data for',
    chatPlaceholder: 'Ask about the company...',
    chatWelcome: 'Hi! I\'m your AI financial analyst. I have all the data loaded for',
    chatWelcome2: 'Ask me anything: debt, margins, valuation, dividends, competitors...',
    chatSuggestions: [
      'How much debt does it have?',
      'How have the margins evolved?',
      'What if WACC rises to 12%?',
      'Compare with the sector?',
      'Is the dividend sustainable?',
    ],
    // Watchlist
    watchlist: 'Watchlist',
    // Comparator
    comparator: 'Comparator',
    // PDF
    exportPDF: 'Export PDF',
    // Calculator extra
    calcToday: 'Today',
    calcBond: 'Bond 4%',
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stockiq-lang') || 'es'
    }
    return 'es'
  })

  const changeLang = (l) => {
    setLang(l)
    localStorage.setItem('stockiq-lang', l)
  }

  const t = (key) => translations[lang]?.[key] || translations.es[key] || key

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
