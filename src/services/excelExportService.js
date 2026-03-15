/**
 * Excel Export Service
 * Generates .xlsx reports from company data using SheetJS.
 */
import * as XLSX from 'xlsx'

function safe(val, fallback = '') {
  if (val == null || (typeof val === 'number' && !isFinite(val))) return fallback
  return val
}

export function generateCompanyExcel(company, lang = 'es') {
  const isEs = lang === 'es'
  const wb = XLSX.utils.book_new()

  // ====== Sheet 1: Overview ======
  const overviewData = [
    [company.name, '', '', ''],
    [`${company.ticker} - ${company.exchange}`, '', '', ''],
    [''],
    [isEs ? 'Métrica' : 'Metric', isEs ? 'Valor' : 'Value'],
    [isEs ? 'Precio' : 'Price', safe(company.price)],
    [isEs ? 'Cambio %' : 'Change %', safe(company.changePct)],
    ['Market Cap', safe(company.marketCap)],
    [isEs ? 'Sector' : 'Sector', safe(company.sector)],
    [isEs ? 'Industria' : 'Industry', safe(company.industry)],
    [isEs ? 'Veredicto' : 'Verdict', safe(company.verdict)],
    [isEs ? 'Valor intrínseco' : 'Intrinsic value', safe(company.intrinsicValue)],
    [isEs ? 'Margen de seguridad' : 'Safety margin', `${safe(company.safetyMargin)}%`],
    [isEs ? 'Puntuación calidad' : 'Quality score', `${company.qualityScore}/${company.scorecardTotal}`],
    ['WACC', safe(company.metrics?.wacc)],
  ]
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData)
  wsOverview['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, wsOverview, isEs ? 'Resumen' : 'Overview')

  // ====== Sheet 2: Metrics ======
  const m = company.metrics || {}
  const metricsRows = [
    [isEs ? 'Métricas Fundamentales' : 'Fundamental Metrics', '', ''],
    [''],
    [isEs ? 'VALORACIÓN' : 'VALUATION', '', ''],
    ['PER', safe(m.per), 'x'],
    ['P/B', safe(m.pb), 'x'],
    ['EV/EBITDA', safe(m.evEbitda), 'x'],
    [''],
    [isEs ? 'RENTABILIDAD' : 'PROFITABILITY', '', ''],
    ['ROE', safe(m.roe), '%'],
    ['ROA', safe(m.roa), '%'],
    ['ROIC', safe(m.roic), '%'],
    [''],
    [isEs ? 'MÁRGENES' : 'MARGINS', '', ''],
    [isEs ? 'Margen bruto' : 'Gross margin', safe(m.marginBruto), '%'],
    [isEs ? 'Margen neto' : 'Net margin', safe(m.marginNeto), '%'],
    [isEs ? 'Margen EBITDA' : 'EBITDA margin', safe(m.marginEbitda), '%'],
    ['FCF Yield', safe(m.fcfYield), '%'],
    [''],
    [isEs ? 'DEUDA' : 'DEBT', '', ''],
    [isEs ? 'Deuda neta / EBITDA' : 'Net debt / EBITDA', safe(m.deudaNetaEbitda), 'x'],
    [isEs ? 'Cobertura intereses' : 'Interest coverage', safe(m.interestCoverage), 'x'],
    ['Piotroski F-Score', safe(m.piotroski), '/9'],
    ['Altman Z-Score', safe(m.altmanZ), ''],
    ['Graham Number', safe(m.grahamNumber), '$'],
    [''],
    [isEs ? 'DIVIDENDO' : 'DIVIDEND', '', ''],
    [isEs ? 'Rendimiento' : 'Yield', safe(m.dividendYield), '%'],
    ['Payout Ratio', safe(m.payoutRatio), '%'],
  ]
  const wsMetrics = XLSX.utils.aoa_to_sheet(metricsRows)
  wsMetrics['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 8 }]
  XLSX.utils.book_append_sheet(wb, wsMetrics, isEs ? 'Métricas' : 'Metrics')

  // ====== Sheet 3: Financials ======
  const fin = company.financials || { years: [], revenue: [], netIncome: [], fcf: [] }
  const finRows = [
    [isEs ? 'Evolución Financiera (en millones USD)' : 'Financial Evolution (in millions USD)'],
    [''],
    [isEs ? 'Año' : 'Year', ...fin.years],
    [isEs ? 'Ingresos' : 'Revenue', ...fin.revenue],
    [isEs ? 'Beneficio Neto' : 'Net Income', ...fin.netIncome],
    ['FCF', ...fin.fcf],
  ]
  const wsFin = XLSX.utils.aoa_to_sheet(finRows)
  wsFin['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsFin, isEs ? 'Financieros' : 'Financials')

  // ====== Sheet 4: DCF ======
  const dcf = company.dcf || {}
  const dcfRows = [
    [isEs ? 'Modelo DCF' : 'DCF Model'],
    [''],
    ['FCF Base ($)', safe(dcf.fcfBase)],
    [isEs ? 'Acciones en circulación' : 'Shares outstanding', safe(dcf.sharesOutstanding)],
    [isEs ? 'Crecimiento FCF 1-5 años' : 'FCF Growth 1-5y', `${safe(dcf.growthRate5y)}%`],
    [isEs ? 'Crecimiento FCF 6-10 años' : 'FCF Growth 6-10y', `${safe(dcf.growthRate10y)}%`],
    [isEs ? 'Crecimiento terminal' : 'Terminal growth', `${safe(dcf.terminalGrowth)}%`],
    ['WACC', `${safe(dcf.wacc)}%`],
    [''],
    [isEs ? 'Valor intrínseco' : 'Intrinsic value', `$${safe(company.intrinsicValue)}`],
    [isEs ? 'Precio actual' : 'Current price', `$${safe(company.price)}`],
    [isEs ? 'Margen de seguridad' : 'Safety margin', `${safe(company.safetyMargin)}%`],
  ]
  const wsDCF = XLSX.utils.aoa_to_sheet(dcfRows)
  wsDCF['!cols'] = [{ wch: 28 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, wsDCF, 'DCF')

  // ====== Sheet 5: Scorecard ======
  const scorecardLabels = {
    roeAbove15: 'ROE > 15%',
    marginStable: isEs ? 'Margen estable' : 'Stable margin',
    roicAboveWacc: 'ROIC > WACC',
    revenueGrowth: isEs ? 'Ingresos crecientes' : 'Revenue growing',
    fcfPositive: isEs ? 'FCF positivo 3 años' : 'FCF positive 3y',
    debtBelow3: isEs ? 'Deuda neta/EBITDA < 3' : 'Net debt/EBITDA < 3',
    interestAbove5: isEs ? 'Cobertura intereses > 5' : 'Interest coverage > 5',
    piotAbove6: 'Piotroski > 6',
    altmanAbove3: 'Altman Z > 3',
    perBelowSector: 'PER < 20',
    paysDividend: isEs ? 'Paga dividendo' : 'Pays dividend',
    dividendGrowing: isEs ? 'Dividendo sostenible' : 'Sustainable dividend',
  }
  const sc = company.scorecard || {}
  const scRows = [
    [isEs ? 'Scorecard de Calidad' : 'Quality Scorecard'],
    [''],
    [isEs ? 'Criterio' : 'Criteria', isEs ? 'Resultado' : 'Result'],
    ...Object.entries(sc).map(([key, val]) => [
      scorecardLabels[key] || key,
      val === true ? 'SI' : val === false ? 'NO' : 'N/A',
    ]),
    [''],
    [isEs ? 'Puntuación total' : 'Total score', `${company.qualityScore}/${company.scorecardTotal}`],
  ]
  const wsSC = XLSX.utils.aoa_to_sheet(scRows)
  wsSC['!cols'] = [{ wch: 28 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, wsSC, 'Scorecard')

  // ====== SAVE ======
  const filename = `StockIQ_${company.ticker}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
  return filename
}
