/**
 * Company Data Service
 * OPTIMIZED: Uses only 4 API calls per company (profile + income + balance + cashflow).
 * All ratios and metrics are calculated from these base financial statements.
 * DEFENSIVE: Handles both stable and legacy field names from FMP API.
 */

import {
  getCompanyProfile,
  getIncomeStatements,
  getBalanceSheet,
  getCashFlowStatements,
  getHistoricalPrices,
} from './fmpApi'
import { saveSnapshot, loadSnapshot, clearSnapshots } from './dataSnapshot'
import { clearAllCache } from './fmpApi'

export { searchCompanies } from './fmpApi'

/**
 * Safely extract a number, returning fallback if null/undefined/NaN
 */
function safe(val, fallback = 0) {
  if (val == null || !isFinite(val)) return fallback
  return val
}

/**
 * Extract year from a financial statement object.
 * Tries: calendarYear, fiscalYear, then parses from date field.
 */
function extractYear(stmt) {
  if (stmt.calendarYear) return String(stmt.calendarYear)
  if (stmt.fiscalYear) return String(stmt.fiscalYear)
  if (stmt.date) return stmt.date.substring(0, 4)
  return null
}

/**
 * Sort financial statements chronologically (oldest first).
 * Uses extractYear for robust year detection.
 */
function sortByYear(statements) {
  return [...statements].sort((a, b) => {
    const yearA = parseInt(extractYear(a)) || 0
    const yearB = parseInt(extractYear(b)) || 0
    return yearA - yearB
  })
}

/**
 * Extract FCF from a cashflow statement.
 * Tries freeCashFlow field first, then calculates from operatingCashFlow - |capitalExpenditure|
 */
function extractFCF(cf) {
  if (cf == null) return 0
  const fcf = cf.freeCashFlow
  if (fcf != null && isFinite(fcf)) return fcf
  // Calculate from operating cash flow minus capex
  const ocf = safe(cf.operatingCashFlow)
  const capex = safe(cf.capitalExpenditure)
  // capex is typically negative in FMP, so OCF + capex = OCF - |capex|
  if (ocf !== 0) return ocf + capex
  return 0
}

/**
 * Calculate Piotroski F-Score from financial data
 */
function calcPiotroski(incomes, balances, cashflows) {
  if (incomes.length < 2 || balances.length < 2 || cashflows.length < 1) return 0

  const curr = incomes[0]
  const prev = incomes[1]
  const currBS = balances[0]
  const prevBS = balances[1]
  const currCF = cashflows[0]

  let score = 0

  if (safe(curr.netIncome) > 0) score++
  if (safe(currCF.operatingCashFlow) > 0) score++
  const currROA = safe(curr.netIncome) / safe(currBS.totalAssets, 1)
  const prevROA = safe(prev.netIncome) / safe(prevBS.totalAssets, 1)
  if (currROA > prevROA) score++
  if (safe(currCF.operatingCashFlow) > safe(curr.netIncome)) score++
  const currDebtRatio = safe(currBS.longTermDebt) / safe(currBS.totalAssets, 1)
  const prevDebtRatio = safe(prevBS.longTermDebt) / safe(prevBS.totalAssets, 1)
  if (currDebtRatio <= prevDebtRatio) score++
  const currCR = safe(currBS.totalCurrentAssets) / safe(currBS.totalCurrentLiabilities, 1)
  const prevCR = safe(prevBS.totalCurrentAssets) / safe(prevBS.totalCurrentLiabilities, 1)
  if (currCR > prevCR) score++
  if (safe(currBS.commonStock) <= safe(prevBS.commonStock)) score++
  const currGM = safe(curr.grossProfit) / safe(curr.revenue, 1)
  const prevGM = safe(prev.grossProfit) / safe(prev.revenue, 1)
  if (currGM > prevGM) score++
  const currAT = safe(curr.revenue) / safe(currBS.totalAssets, 1)
  const prevAT = safe(prev.revenue) / safe(prevBS.totalAssets, 1)
  if (currAT > prevAT) score++

  return score
}

/**
 * Calculate Altman Z-Score
 */
function calcAltmanZ(income, balance, mktCap) {
  const ta = safe(balance.totalAssets, 1)
  const wc = safe(balance.totalCurrentAssets) - safe(balance.totalCurrentLiabilities)
  const re = safe(balance.retainedEarnings)
  const ebit = safe(income.operatingIncome)
  const tl = safe(balance.totalLiabilities, 1)
  const rev = safe(income.revenue)

  const A = wc / ta
  const B = re / ta
  const C = ebit / ta
  const D = mktCap / tl
  const E = rev / ta

  return 1.2 * A + 1.4 * B + 3.3 * C + 0.6 * D + 1.0 * E
}

/**
 * Calculate Graham Number
 */
function calcGrahamNumber(eps, bookValuePerShare) {
  if (eps <= 0 || bookValuePerShare <= 0) return 0
  return Math.sqrt(22.5 * eps * bookValuePerShare)
}

/**
 * Fetch ALL company data with only 4 API calls and transform to app format.
 */
export async function fetchCompanyData(ticker) {
  let profile, incomeStmts, balanceSheets, cashFlows
  let fromSnapshot = false

  // Try snapshot first (0 API calls)
  const snapshot = loadSnapshot(ticker)
  if (snapshot) {
    profile = snapshot.profile
    incomeStmts = snapshot.incomeStmts || []
    balanceSheets = snapshot.balanceSheets || []
    cashFlows = snapshot.cashFlows || []
    fromSnapshot = true
  } else {
    // === Only 4 API calls total ===
    ;[profile, incomeStmts, balanceSheets, cashFlows] = await Promise.all([
      getCompanyProfile(ticker),
      getIncomeStatements(ticker, 5).catch(() => []),
      getBalanceSheet(ticker, 5).catch(() => []),
      getCashFlowStatements(ticker, 5).catch(() => []),
    ])

    // Auto-save snapshot for future use (saves 4 API calls next time)
    saveSnapshot(ticker, { profile, incomeStmts, balanceSheets, cashFlows })
  }

  // Debug: log first response to help identify field names (only on fresh API calls)
  if (!fromSnapshot && incomeStmts.length > 0) {
    console.log('📊 StockIQ: Income statement fields:', Object.keys(incomeStmts[0]).join(', '))
  }
  if (!fromSnapshot && cashFlows.length > 0) {
    console.log('📊 StockIQ: Cashflow statement fields:', Object.keys(cashFlows[0]).join(', '))
  }
  if (!fromSnapshot && balanceSheets.length > 0) {
    console.log('📊 StockIQ: Balance sheet fields:', Object.keys(balanceSheets[0]).join(', '))
  }

  // Sort financials chronologically (FMP returns newest first)
  const incomes = sortByYear(incomeStmts)
  const balances = sortByYear(balanceSheets)
  const cashFlowsSorted = sortByYear(cashFlows)

  // Take last 5 years
  const last5Incomes = incomes.slice(-5)
  const last5CFs = cashFlowsSorted.slice(-5)

  // Financial history for charts — use extractYear for robust year detection
  const years = last5Incomes.map(i => extractYear(i) || '?')
  const revenues = last5Incomes.map(i => Math.round(safe(i.revenue) / 1e6))
  const netIncomes = last5Incomes.map(i => Math.round(safe(i.netIncome) / 1e6))
  const fcfs = last5CFs.map(c => Math.round(extractFCF(c) / 1e6))

  // Latest data (newest first from original arrays)
  const latestIncome = incomeStmts.length > 0 ? incomeStmts[0] : null
  const latestBalance = balanceSheets.length > 0 ? balanceSheets[0] : null
  const latestCF = cashFlows.length > 0 ? cashFlows[0] : null

  // === Map stable API profile fields ===
  // Stable API uses: marketCap, averageVolume, lastDividend, changePercentage, change
  // (NOT: mktCap, volAvg, lastDiv, changePct, changes, eps, pe, dcf)
  const price = safe(profile.price, 1)
  const mktCap = safe(profile.marketCap || profile.mktCap)
  // EPS: try eps/epsdiluted from income statement, then calculate from net income / shares
  const sharesOutFromStmt = safe(latestIncome?.weightedAverageShsOutDil, safe(latestIncome?.weightedAverageShsOut))
  const sharesOutFromMkt = price > 0 ? mktCap / price : 1e9
  const sharesOut = sharesOutFromStmt > 0 ? sharesOutFromStmt : sharesOutFromMkt
  const eps = latestIncome
    ? safe(latestIncome.epsdiluted, safe(latestIncome.eps, safe(latestIncome.netIncome) / (sharesOut || 1)))
    : 0

  // Balance sheet values
  const totalEquity = safe(latestBalance?.totalStockholdersEquity)
  const totalAssets = safe(latestBalance?.totalAssets, 1)
  const totalDebt = safe(latestBalance?.totalDebt, safe(latestBalance?.longTermDebt))
  const cashAndEq = safe(latestBalance?.cashAndCashEquivalents, safe(latestBalance?.cashAndShortTermInvestments))
  const netDebt = totalDebt - cashAndEq

  // Income statement values
  const revenueTTM = safe(latestIncome?.revenue, 1)
  const netIncomeTTM = safe(latestIncome?.netIncome)
  const grossProfit = safe(latestIncome?.grossProfit)
  const operatingIncome = safe(latestIncome?.operatingIncome)
  const ebitda = safe(latestIncome?.ebitda, operatingIncome)
  const interestExp = Math.abs(safe(latestIncome?.interestExpense))

  // Cash flow values — use extractFCF for robust field name handling
  const fcfTTM = latestCF ? extractFCF(latestCF) : 0

  // Book value per share
  const bookValuePS = sharesOut > 0 ? totalEquity / sharesOut : 0

  // Enterprise value
  const ev = mktCap + totalDebt - cashAndEq

  // === Valuation ratios ===
  const per = eps > 0 ? price / eps : 0
  const pb = bookValuePS > 0 ? price / bookValuePS : 0
  const evEbitda = ebitda > 0 ? ev / ebitda : 0
  const peg = 0 // Needs growth estimate — will show as N/A

  // === Profitability ===
  const roe = totalEquity > 0 ? (netIncomeTTM / totalEquity) * 100 : 0
  const roa = totalAssets > 0 ? (netIncomeTTM / totalAssets) * 100 : 0
  const investedCapital = totalEquity + totalDebt - cashAndEq
  const roic = investedCapital > 0 ? (operatingIncome / investedCapital) * 100 : 0

  // === Margins ===
  const marginBruto = revenueTTM > 0 ? (grossProfit / revenueTTM) * 100 : 0
  const marginNeto = revenueTTM > 0 ? (netIncomeTTM / revenueTTM) * 100 : 0
  const marginEbitda = revenueTTM > 0 ? (ebitda / revenueTTM) * 100 : 0

  // === Cash flow & debt ===
  const fcfYield = mktCap > 0 ? (fcfTTM / mktCap) * 100 : 0
  const deudaNetaEbitda = ebitda > 0 ? netDebt / ebitda : 0
  const interestCov = interestExp > 0 ? operatingIncome / interestExp : 99

  // === Dividends ===
  const lastDiv = safe(profile.lastDividend || profile.lastDiv)
  const divYield = price > 0 && lastDiv > 0 ? (lastDiv / price) * 100 : 0
  const payout = eps > 0 && lastDiv > 0 ? (lastDiv / eps) * 100 : 0

  // === Scores ===
  const piotroski = calcPiotroski(incomeStmts, balanceSheets, cashFlows)
  const altmanZ = incomeStmts.length > 0 && balanceSheets.length > 0
    ? calcAltmanZ(incomeStmts[0], balanceSheets[0], mktCap)
    : 0
  const grahamNumber = calcGrahamNumber(eps, bookValuePS)

  // === WACC estimate (proper weighted average of equity + debt costs) ===
  const beta = safe(profile.beta, 1)
  const riskFreeRate = 4.0  // ~10Y US Treasury
  const marketPremium = 5.0 // Historical equity risk premium
  const costOfEquity = riskFreeRate + beta * marketPremium

  // Cost of debt: interest expense / total debt, or estimate from credit quality
  const costOfDebt = totalDebt > 0 && interestExp > 0
    ? Math.min((interestExp / totalDebt) * 100, 8) // Cap at 8%
    : 4.0 // Default for high-grade companies
  const taxRate = latestIncome && safe(latestIncome.incomeTaxExpense) > 0 && safe(latestIncome.incomeBeforeTax) > 0
    ? safe(latestIncome.incomeTaxExpense) / safe(latestIncome.incomeBeforeTax, 1)
    : 0.21 // Default US corporate tax rate

  // Weights: equity = mktCap, debt = totalDebt
  const totalCapital = mktCap + totalDebt
  const weightEquity = totalCapital > 0 ? mktCap / totalCapital : 1
  const weightDebt = totalCapital > 0 ? totalDebt / totalCapital : 0
  const estimatedWACC = weightEquity * costOfEquity + weightDebt * costOfDebt * (1 - taxRate)

  // Latest FCF for DCF
  const latestFCF = fcfTTM

  // FCF growth rate from history (CAGR)
  let fcfGrowthRate = 10 // Default
  if (fcfs.length >= 2 && fcfs[0] > 0 && fcfs[fcfs.length - 1] > 0) {
    fcfGrowthRate = (Math.pow(fcfs[fcfs.length - 1] / fcfs[0], 1 / (fcfs.length - 1)) - 1) * 100
  }
  // Sanity bounds: min 3% for established companies, max 30%
  fcfGrowthRate = Math.max(3, Math.min(fcfGrowthRate, 30))

  // Intrinsic value estimate — 10-year DCF projection
  // Phase 1 (years 1-5): historical growth rate
  // Phase 2 (years 6-10): fade to terminal growth
  // Terminal value: perpetuity growth model
  const calcIntrinsic = (() => {
    if (fcfTTM <= 0 || sharesOut <= 0) return price
    const g1 = fcfGrowthRate / 100
    const gT = 0.03 // 3% terminal growth (long-run GDP + inflation)
    const wacc = Math.max(estimatedWACC, 6) / 100 // Floor WACC at 6%

    // Phase 2 growth: blend between g1 and terminal rate
    const g2 = (g1 + gT) / 2

    let totalPV = 0
    let fcf = fcfTTM
    for (let y = 1; y <= 5; y++) {
      fcf *= (1 + g1)
      totalPV += fcf / Math.pow(1 + wacc, y)
    }
    for (let y = 6; y <= 10; y++) {
      fcf *= (1 + g2)
      totalPV += fcf / Math.pow(1 + wacc, y)
    }
    const terminalValue = (fcf * (1 + gT)) / (wacc - gT)
    totalPV += terminalValue / Math.pow(1 + wacc, 10)
    return totalPV / sharesOut
  })()
  const intrinsicValue = calcIntrinsic

  // Determine verdict with wider "fair price" band
  const safetyMargin = Math.round(((intrinsicValue - price) / price) * 100)
  let verdict
  if (safetyMargin > 20) verdict = 'INFRAVALORADA'
  else if (safetyMargin > -20) verdict = 'PRECIO JUSTO'
  else verdict = 'SOBREVALORADA'

  // Build scorecard — use null for "data unavailable" vs false for "criteria not met"
  const hasIncomeData = last5Incomes.length > 0
  const hasCFData = last5CFs.length > 0
  const hasBalanceData = balances.length > 0
  const has3YrIncome = last5Incomes.length >= 3
  const has3YrCF = fcfs.length >= 3

  // Revenue growth: need at least 3 years of income data
  const revenueGrowing = has3YrIncome
    ? revenues[revenues.length - 1] > revenues[revenues.length - 3]
    : null

  // FCF positive 3 years: need at least 3 years of cashflow data with non-zero values
  const fcfPositive = has3YrCF && fcfs.some(f => f !== 0)
    ? fcfs.slice(-3).every(f => f > 0)
    : null

  // Margin stable: need at least 3 years of income data
  const marginStable = has3YrIncome ? (() => {
    const margins = last5Incomes.slice(-3).map(i => safe(i.netIncome) / safe(i.revenue, 1))
    return margins[2] >= margins[0] * 0.9
  })() : null

  const scorecard = {
    roeAbove15: hasIncomeData && hasBalanceData ? roe > 15 : null,
    marginStable,
    roicAboveWacc: hasIncomeData && hasBalanceData ? roic > estimatedWACC : null,
    revenueGrowth: revenueGrowing,
    fcfPositive,
    debtBelow3: hasBalanceData && hasIncomeData ? deudaNetaEbitda < 3 : null,
    interestAbove5: hasIncomeData ? interestCov > 5 : null,
    piotAbove6: incomeStmts.length >= 2 && balanceSheets.length >= 2 && cashFlows.length >= 1 ? piotroski > 6 : null,
    altmanAbove3: incomeStmts.length > 0 && balanceSheets.length > 0 ? altmanZ > 3 : null,
    perBelowSector: hasIncomeData ? (per > 0 && per < 20) : null,
    paysDividend: divYield > 0,
    dividendGrowing: divYield > 0 ? payout < 80 : null,
  }

  // Count only true/false (not null) for quality score
  const scorecardEntries = Object.values(scorecard).filter(v => v !== null)
  const qualityScore = scorecardEntries.filter(Boolean).length
  const scorecardTotal = scorecardEntries.length

  return {
    ticker: profile.symbol,
    name: profile.companyName,
    price,
    change: safe(profile.change || profile.changes),
    changePct: safe(profile.changePercentage || profile.changePct),
    marketCap: mktCap,
    volume: safe(profile.averageVolume || profile.volAvg),
    exchange: profile.exchangeShortName || profile.exchange,
    sector: profile.sector || 'N/A',
    industry: profile.industry || 'N/A',
    currency: profile.currency || 'USD',
    description: profile.description || '',
    image: profile.image || null,
    high52w: safe(profile.range ? parseFloat(profile.range.split('-')[1]) : 0),
    low52w: safe(profile.range ? parseFloat(profile.range.split('-')[0]) : 0),
    verdict,
    safetyMargin,
    intrinsicValue: safe(intrinsicValue),
    qualityScore,
    scorecardTotal,
    metrics: {
      per,
      pb,
      evEbitda,
      peg,
      roe,
      roa,
      roic,
      marginBruto,
      marginNeto,
      marginEbitda,
      fcfYield,
      deudaNetaEbitda,
      interestCoverage: interestCov,
      piotroski,
      altmanZ,
      grahamNumber,
      dividendYield: divYield,
      payoutRatio: payout,
      wacc: estimatedWACC,
    },
    financials: {
      years,
      revenue: revenues,
      netIncome: netIncomes,
      fcf: fcfs,
    },
    dcf: {
      fcfBase: latestFCF,
      sharesOutstanding: sharesOut > 0 ? sharesOut : 1e9,
      growthRate5y: Math.min(Math.max(fcfGrowthRate, -10), 50),
      growthRate10y: Math.min(Math.max(fcfGrowthRate * 0.6, -5), 30),
      terminalGrowth: 2.5,
      wacc: Math.min(Math.max(estimatedWACC, 5), 20),
    },
    scorecard,
    aiAnalysis: null,
    _cached: fromSnapshot,
    _cacheAge: fromSnapshot && snapshot ? Math.round((Date.now() - 0) / 3600000) : 0,
  }
}

/**
 * Force refresh: clear snapshot for this ticker and fetch fresh data from API.
 * Uses 4 API calls.
 */
export async function forceRefreshCompanyData(ticker) {
  // Remove the snapshot so fetchCompanyData goes to the API
  const key = 'stockiq_snap_' + ticker.toUpperCase()
  try { localStorage.removeItem(key) } catch (_) { /* ignore */ }
  // Also clear any FMP cache for this ticker
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith('stockiq_') && k.includes(ticker.toUpperCase())) {
        localStorage.removeItem(k)
      }
    }
  } catch (_) { /* ignore */ }
  console.log(`🔄 StockIQ: Force refreshing ${ticker}`)
  return fetchCompanyData(ticker)
}

/**
 * Fetch historical price data for the chart component. (1 API call)
 * Returns data in lightweight-charts format.
 */
export async function fetchPriceHistory(ticker, days = 365) {
  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)

  const from = fromDate.toISOString().split('T')[0]
  const to = toDate.toISOString().split('T')[0]

  const prices = await getHistoricalPrices(ticker, from, to)

  // FMP returns newest first, lightweight-charts needs oldest first
  return prices
    .map(p => ({
      time: p.date,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }))
    .reverse()
}
