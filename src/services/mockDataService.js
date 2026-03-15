/**
 * Mock Data Service for StockIQ
 * Generates realistic financial data for testing without consuming API calls.
 * Activated automatically when API limit is reached, or manually via localStorage toggle.
 *
 * Usage:
 *   localStorage.setItem('stockiq_mock_mode', 'true')  // Force mock mode
 *   localStorage.removeItem('stockiq_mock_mode')        // Back to real API
 */

// ============ Seed-based pseudo-random for consistency ============
function seededRandom(seed) {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s & 0x7fffffff) / 2147483647
  }
}

// ============ Realistic company templates ============
const SECTORS = [
  { sector: 'Technology', industries: ['Software—Application', 'Software—Infrastructure', 'Semiconductors', 'Consumer Electronics', 'Information Technology Services'] },
  { sector: 'Healthcare', industries: ['Drug Manufacturers—General', 'Biotechnology', 'Medical Devices', 'Health Care Plans', 'Diagnostics & Research'] },
  { sector: 'Financial Services', industries: ['Banks—Diversified', 'Insurance—Life', 'Asset Management', 'Capital Markets', 'Credit Services'] },
  { sector: 'Consumer Cyclical', industries: ['Internet Retail', 'Auto Manufacturers', 'Restaurants', 'Apparel Retail', 'Home Improvement Retail'] },
  { sector: 'Communication Services', industries: ['Internet Content & Information', 'Entertainment', 'Telecom Services', 'Electronic Gaming & Multimedia', 'Advertising Agencies'] },
  { sector: 'Industrials', industries: ['Aerospace & Defense', 'Industrial Conglomerates', 'Railroads', 'Specialty Industrial Machinery', 'Waste Management'] },
  { sector: 'Consumer Defensive', industries: ['Beverages—Non-Alcoholic', 'Household & Personal Products', 'Packaged Foods', 'Discount Stores', 'Tobacco'] },
  { sector: 'Energy', industries: ['Oil & Gas Integrated', 'Oil & Gas E&P', 'Oil & Gas Midstream', 'Uranium', 'Solar'] },
  { sector: 'Real Estate', industries: ['REIT—Diversified', 'REIT—Industrial', 'REIT—Retail', 'Real Estate Services', 'REIT—Residential'] },
  { sector: 'Utilities', industries: ['Utilities—Regulated Electric', 'Utilities—Renewable', 'Utilities—Diversified', 'Utilities—Regulated Gas', 'Utilities—Regulated Water'] },
]

// Known companies with realistic base data
const KNOWN_COMPANIES = {
  AAPL: { name: 'Apple Inc.', sector: 0, ind: 3, price: 189, mktCap: 2.95e12, rev: 383e9, eps: 6.42, beta: 1.24, div: 0.96, exchange: 'NASDAQ' },
  MSFT: { name: 'Microsoft Corporation', sector: 0, ind: 1, price: 415, mktCap: 3.08e12, rev: 227e9, eps: 11.86, beta: 0.89, div: 3.0, exchange: 'NASDAQ' },
  GOOGL: { name: 'Alphabet Inc.', sector: 4, ind: 0, price: 152, mktCap: 1.89e12, rev: 307e9, eps: 5.80, beta: 1.06, div: 0, exchange: 'NASDAQ' },
  AMZN: { name: 'Amazon.com Inc.', sector: 3, ind: 0, price: 186, mktCap: 1.93e12, rev: 574e9, eps: 2.90, beta: 1.16, div: 0, exchange: 'NASDAQ' },
  META: { name: 'Meta Platforms Inc.', sector: 4, ind: 0, price: 505, mktCap: 1.28e12, rev: 134e9, eps: 14.87, beta: 1.22, div: 2.0, exchange: 'NASDAQ' },
  TSLA: { name: 'Tesla Inc.', sector: 3, ind: 1, price: 248, mktCap: 789e9, rev: 97e9, eps: 3.12, beta: 2.05, div: 0, exchange: 'NASDAQ' },
  NVDA: { name: 'NVIDIA Corporation', sector: 0, ind: 2, price: 875, mktCap: 2.15e12, rev: 60.9e9, eps: 12.96, beta: 1.68, div: 0.16, exchange: 'NASDAQ' },
  JPM: { name: 'JPMorgan Chase & Co.', sector: 2, ind: 0, price: 198, mktCap: 571e9, rev: 158e9, eps: 17.3, beta: 1.07, div: 4.6, exchange: 'NYSE' },
  V: { name: 'Visa Inc.', sector: 2, ind: 4, price: 279, mktCap: 567e9, rev: 32.7e9, eps: 8.84, beta: 0.94, div: 2.08, exchange: 'NYSE' },
  JNJ: { name: 'Johnson & Johnson', sector: 1, ind: 0, price: 156, mktCap: 375e9, rev: 85.2e9, eps: 6.73, beta: 0.52, div: 4.76, exchange: 'NYSE' },
  WMT: { name: 'Walmart Inc.', sector: 6, ind: 3, price: 167, mktCap: 449e9, rev: 611e9, eps: 6.46, beta: 0.51, div: 2.28, exchange: 'NYSE' },
  KO: { name: 'The Coca-Cola Company', sector: 6, ind: 0, price: 60, mktCap: 259e9, rev: 45.8e9, eps: 2.47, beta: 0.57, div: 1.84, exchange: 'NYSE' },
  DIS: { name: 'The Walt Disney Company', sector: 4, ind: 1, price: 112, mktCap: 205e9, rev: 88.9e9, eps: 3.76, beta: 1.33, div: 0, exchange: 'NYSE' },
  PFE: { name: 'Pfizer Inc.', sector: 1, ind: 0, price: 28, mktCap: 157e9, rev: 58.5e9, eps: 1.84, beta: 0.65, div: 1.64, exchange: 'NYSE' },
  BA: { name: 'The Boeing Company', sector: 5, ind: 0, price: 215, mktCap: 132e9, rev: 77.8e9, eps: -1.64, beta: 1.52, div: 0, exchange: 'NYSE' },
  NFLX: { name: 'Netflix Inc.', sector: 4, ind: 1, price: 628, mktCap: 271e9, rev: 33.7e9, eps: 12.03, beta: 1.28, div: 0, exchange: 'NASDAQ' },
  INTC: { name: 'Intel Corporation', sector: 0, ind: 2, price: 31, mktCap: 132e9, rev: 54.2e9, eps: 0.40, beta: 1.05, div: 0.5, exchange: 'NASDAQ' },
  AMD: { name: 'Advanced Micro Devices Inc.', sector: 0, ind: 2, price: 178, mktCap: 288e9, rev: 22.7e9, eps: 3.31, beta: 1.72, div: 0, exchange: 'NASDAQ' },
  // European
  'SAN.MC': { name: 'Banco Santander S.A.', sector: 2, ind: 0, price: 4.52, mktCap: 72e9, rev: 57.4e9, eps: 0.58, beta: 1.34, div: 0.16, exchange: 'BME' },
  'ITX.MC': { name: 'Industria de Diseño Textil S.A.', sector: 3, ind: 3, price: 44.8, mktCap: 140e9, rev: 35.9e9, eps: 1.54, beta: 0.88, div: 1.12, exchange: 'BME' },
  'TEF.MC': { name: 'Telefónica S.A.', sector: 4, ind: 2, price: 4.15, mktCap: 23.8e9, rev: 40.7e9, eps: 0.28, beta: 0.78, div: 0.30, exchange: 'BME' },
  'BBVA.MC': { name: 'Banco Bilbao Vizcaya Argentaria S.A.', sector: 2, ind: 0, price: 9.8, mktCap: 56e9, rev: 30.4e9, eps: 1.21, beta: 1.41, div: 0.55, exchange: 'BME' },
  'IBE.MC': { name: 'Iberdrola S.A.', sector: 9, ind: 0, price: 12.4, mktCap: 80e9, rev: 49.3e9, eps: 0.68, beta: 0.42, div: 0.52, exchange: 'BME' },
  'REP.MC': { name: 'Repsol S.A.', sector: 7, ind: 0, price: 14.2, mktCap: 17.5e9, rev: 56.4e9, eps: 2.18, beta: 0.92, div: 0.70, exchange: 'BME' },
  'SAP.DE': { name: 'SAP SE', sector: 0, ind: 0, price: 185, mktCap: 228e9, rev: 31.2e9, eps: 4.42, beta: 1.05, div: 2.2, exchange: 'XETRA' },
  'MC.PA': { name: 'LVMH Moët Hennessy', sector: 3, ind: 3, price: 742, mktCap: 372e9, rev: 86.2e9, eps: 30.34, beta: 0.94, div: 13.0, exchange: 'Euronext' },
  'ASML.AS': { name: 'ASML Holding N.V.', sector: 0, ind: 2, price: 920, mktCap: 362e9, rev: 27.6e9, eps: 21.53, beta: 1.18, div: 6.4, exchange: 'Euronext' },
  // Japanese
  '7203.T': { name: 'Toyota Motor Corporation', sector: 3, ind: 1, price: 2850, mktCap: 39e12, rev: 37.2e12, eps: 264, beta: 0.55, div: 75, exchange: 'TSE' },
  '6758.T': { name: 'Sony Group Corporation', sector: 0, ind: 3, price: 13200, mktCap: 16.5e12, rev: 13e12, eps: 1021, beta: 0.78, div: 85, exchange: 'TSE' },
}

// ============ Generate realistic data for any ticker ============

function generateCompanyBase(ticker) {
  const known = KNOWN_COMPANIES[ticker.toUpperCase()]
  if (known) return known

  // Generate pseudo-random but consistent data based on ticker
  const rng = seededRandom(ticker.toUpperCase())
  const sectorIdx = Math.floor(rng() * SECTORS.length)
  const indIdx = Math.floor(rng() * SECTORS[sectorIdx].industries.length)
  const price = Math.round((5 + rng() * 495) * 100) / 100
  const sharesB = 0.1 + rng() * 5
  const mktCap = price * sharesB * 1e9
  const revMultiple = 1 + rng() * 8
  const rev = mktCap / revMultiple
  const marginNet = 0.02 + rng() * 0.25
  const eps = (rev * marginNet) / (sharesB * 1e9)

  return {
    name: `${ticker} Corporation`,
    sector: sectorIdx,
    ind: indIdx,
    price,
    mktCap,
    rev,
    eps: Math.round(eps * 100) / 100,
    beta: Math.round((0.3 + rng() * 1.8) * 100) / 100,
    div: rng() > 0.4 ? Math.round(rng() * price * 0.04 * 100) / 100 : 0,
    exchange: ['NYSE', 'NASDAQ', 'NYSE', 'NASDAQ'][Math.floor(rng() * 4)],
  }
}

// ============ Mock FMP API responses ============

export function mockProfile(ticker) {
  const base = generateCompanyBase(ticker)
  const sectorData = SECTORS[base.sector]
  const rng = seededRandom(ticker + '_profile')
  const changePct = (rng() - 0.5) * 6 // -3% to +3%
  const change = base.price * changePct / 100

  return {
    symbol: ticker.toUpperCase(),
    companyName: base.name,
    price: base.price,
    change: Math.round(change * 100) / 100,
    changePercentage: Math.round(changePct * 100) / 100,
    marketCap: base.mktCap,
    averageVolume: Math.round(1e6 + rng() * 50e6),
    beta: base.beta,
    lastDividend: base.div,
    range: `${(base.price * 0.72).toFixed(2)}-${(base.price * 1.18).toFixed(2)}`,
    currency: ticker.includes('.MC') || ticker.includes('.PA') || ticker.includes('.DE') || ticker.includes('.AS') ? 'EUR' : ticker.includes('.T') ? 'JPY' : ticker.includes('.L') ? 'GBP' : 'USD',
    exchangeShortName: base.exchange,
    exchange: base.exchange,
    sector: sectorData.sector,
    industry: sectorData.industries[base.ind],
    description: `${base.name} es una empresa líder en el sector de ${sectorData.sector}. Opera en la industria de ${sectorData.industries[base.ind]}, ofreciendo productos y servicios a nivel global.`,
    image: `https://financialmodelingprep.com/image-stock/${ticker.toUpperCase()}.png`,
    _isMock: true,
  }
}

export function mockIncomeStatements(ticker, limit = 5) {
  const base = generateCompanyBase(ticker)
  const rng = seededRandom(ticker + '_income')
  const currentYear = new Date().getFullYear()
  const statements = []

  let rev = base.rev
  const growthRate = 0.02 + rng() * 0.18 // 2% to 20% growth
  const marginGross = 0.3 + rng() * 0.45
  const marginOp = marginGross * (0.3 + rng() * 0.5)
  const marginNet = marginOp * (0.7 + rng() * 0.25)

  // Build from oldest to newest
  for (let i = limit - 1; i >= 0; i--) {
    const yearRev = rev / Math.pow(1 + growthRate, i)
    const yearVariation = 0.95 + rng() * 0.1 // slight yearly variation
    const adjRev = yearRev * yearVariation

    const grossProfit = adjRev * marginGross * (0.95 + rng() * 0.1)
    const opIncome = adjRev * marginOp * (0.9 + rng() * 0.2)
    const netIncome = adjRev * marginNet * (0.85 + rng() * 0.3)
    const ebitda = opIncome * (1.15 + rng() * 0.15)
    const interestExp = adjRev * (0.005 + rng() * 0.03)
    const taxExpense = (opIncome - interestExp) * (0.15 + rng() * 0.1)
    const shares = base.mktCap / base.price

    statements.push({
      date: `${currentYear - i}-12-31`,
      calendarYear: String(currentYear - i),
      symbol: ticker.toUpperCase(),
      revenue: Math.round(adjRev),
      grossProfit: Math.round(grossProfit),
      operatingIncome: Math.round(opIncome),
      netIncome: Math.round(netIncome),
      ebitda: Math.round(ebitda),
      eps: Math.round((netIncome / shares) * 100) / 100,
      epsdiluted: Math.round((netIncome / shares) * 100) / 100,
      interestExpense: Math.round(interestExp),
      incomeTaxExpense: Math.round(taxExpense),
      incomeBeforeTax: Math.round(opIncome - interestExp),
      weightedAverageShsOut: Math.round(shares),
      weightedAverageShsOutDil: Math.round(shares * 1.02),
      _isMock: true,
    })
  }

  // Return newest first (like FMP API)
  return statements.reverse()
}

export function mockBalanceSheet(ticker, limit = 5) {
  const base = generateCompanyBase(ticker)
  const rng = seededRandom(ticker + '_balance')
  const currentYear = new Date().getFullYear()
  const statements = []

  const totalAssetsBase = base.mktCap * (0.5 + rng() * 1.5)
  const debtRatio = 0.1 + rng() * 0.5
  const currentRatio = 1.0 + rng() * 1.5

  for (let i = limit - 1; i >= 0; i--) {
    const growthFactor = Math.pow(1 + 0.03 + rng() * 0.08, limit - 1 - i)
    const ta = totalAssetsBase * growthFactor * (0.95 + rng() * 0.1)
    const tl = ta * debtRatio * (0.9 + rng() * 0.2)
    const equity = ta - tl
    const longTermDebt = tl * (0.5 + rng() * 0.3)
    const totalDebt = longTermDebt * (1.1 + rng() * 0.3)
    const cash = ta * (0.05 + rng() * 0.2)
    const currentAssets = ta * (0.2 + rng() * 0.3)
    const currentLiab = currentAssets / currentRatio

    statements.push({
      date: `${currentYear - i}-12-31`,
      calendarYear: String(currentYear - i),
      symbol: ticker.toUpperCase(),
      totalAssets: Math.round(ta),
      totalLiabilities: Math.round(tl),
      totalStockholdersEquity: Math.round(equity),
      totalDebt: Math.round(totalDebt),
      longTermDebt: Math.round(longTermDebt),
      cashAndCashEquivalents: Math.round(cash),
      cashAndShortTermInvestments: Math.round(cash * 1.3),
      totalCurrentAssets: Math.round(currentAssets),
      totalCurrentLiabilities: Math.round(currentLiab),
      retainedEarnings: Math.round(equity * (0.4 + rng() * 0.4)),
      commonStock: Math.round(equity * 0.1),
      _isMock: true,
    })
  }

  return statements.reverse()
}

export function mockCashFlowStatements(ticker, limit = 5) {
  const base = generateCompanyBase(ticker)
  const rng = seededRandom(ticker + '_cashflow')
  const currentYear = new Date().getFullYear()
  const statements = []

  const marginNet = base.eps * (base.mktCap / base.price) / base.rev
  const ocfMargin = Math.abs(marginNet) * (1.2 + rng() * 0.6)

  for (let i = limit - 1; i >= 0; i--) {
    const growthFactor = Math.pow(1 + 0.05 + rng() * 0.1, limit - 1 - i)
    const rev = base.rev / Math.pow(1 + 0.08, i)
    const ocf = rev * ocfMargin * (0.85 + rng() * 0.3)
    const capex = -Math.abs(rev * (0.03 + rng() * 0.1))
    const fcf = ocf + capex

    statements.push({
      date: `${currentYear - i}-12-31`,
      calendarYear: String(currentYear - i),
      symbol: ticker.toUpperCase(),
      operatingCashFlow: Math.round(ocf),
      capitalExpenditure: Math.round(capex),
      freeCashFlow: Math.round(fcf),
      _isMock: true,
    })
  }

  return statements.reverse()
}

export function mockHistoricalPrices(ticker, fromDate, toDate) {
  const base = generateCompanyBase(ticker)
  const rng = seededRandom(ticker + '_prices')

  const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const to = toDate ? new Date(toDate) : new Date()
  const days = Math.round((to - from) / (24 * 60 * 60 * 1000))

  const prices = []
  let price = base.price * (0.75 + rng() * 0.2) // Start lower than current
  const dailyDrift = Math.pow(base.price / price, 1 / Math.max(days, 1)) - 1
  const volatility = 0.01 + base.beta * 0.008

  for (let i = 0; i <= days; i++) {
    const date = new Date(from.getTime() + i * 24 * 60 * 60 * 1000)
    const dow = date.getDay()
    if (dow === 0 || dow === 6) continue // Skip weekends

    const dailyReturn = dailyDrift + (rng() - 0.5) * volatility * 2
    price = price * (1 + dailyReturn)
    price = Math.max(price, 0.5) // Floor

    const dayRange = price * (0.005 + rng() * 0.02)
    const open = price + (rng() - 0.5) * dayRange
    const high = Math.max(open, price) + rng() * dayRange * 0.5
    const low = Math.min(open, price) - rng() * dayRange * 0.5
    const volume = Math.round((5e5 + rng() * 20e6) * (0.7 + rng() * 0.6))

    prices.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(price * 100) / 100,
      volume,
      _isMock: true,
    })
  }

  // Return newest first (like FMP)
  return prices.reverse()
}

export function mockSearchResults(query) {
  if (!query || query.length < 1) return []

  const q = query.toUpperCase()
  const results = []

  // Search in known companies by ticker or name
  for (const [ticker, data] of Object.entries(KNOWN_COMPANIES)) {
    if (ticker.toUpperCase().includes(q) || data.name.toUpperCase().includes(q)) {
      const sectorData = SECTORS[data.sector]
      results.push({
        symbol: ticker,
        name: data.name,
        stockExchange: data.exchange,
        exchangeShortName: data.exchange,
        currency: ticker.includes('.MC') || ticker.includes('.PA') || ticker.includes('.DE') ? 'EUR' : ticker.includes('.T') ? 'JPY' : 'USD',
      })
    }
    if (results.length >= 10) break
  }

  // If no results from known, generate a fake one
  if (results.length === 0 && query.length >= 2) {
    results.push({
      symbol: query.toUpperCase(),
      name: `${query.toUpperCase()} Corp. (Mock)`,
      stockExchange: 'NASDAQ',
      exchangeShortName: 'NASDAQ',
      currency: 'USD',
    })
  }

  return results
}

// ============ Mock mode management ============

export function isMockMode() {
  try {
    // Explicit toggle
    if (localStorage.getItem('stockiq_mock_mode') === 'true') return true
    // Auto-activate if API limit reached
    const raw = localStorage.getItem('stockiq_api_tracker')
    if (raw) {
      const data = JSON.parse(raw)
      if (data.day === new Date().toDateString() && data.count >= 240) return true
    }
  } catch (_) { /* ignore */ }
  return false
}

export function setMockMode(enabled) {
  try {
    if (enabled) localStorage.setItem('stockiq_mock_mode', 'true')
    else localStorage.removeItem('stockiq_mock_mode')
  } catch (_) { /* ignore */ }
}

export function getMockModeLabel() {
  try {
    if (localStorage.getItem('stockiq_mock_mode') === 'true') return 'manual'
    const raw = localStorage.getItem('stockiq_api_tracker')
    if (raw) {
      const data = JSON.parse(raw)
      if (data.day === new Date().toDateString() && data.count >= 240) return 'auto'
    }
  } catch (_) { /* ignore */ }
  return null
}
