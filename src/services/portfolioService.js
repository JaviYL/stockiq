/**
 * Portfolio persistence service
 * Stores multiple named portfolios in localStorage
 */

const STORAGE_KEY = 'stockiq_portfolios'

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll(portfolios) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios))
  } catch (e) {
    console.error('StockIQ: Failed to save portfolios', e)
  }
}

/**
 * Get all portfolios (summary list)
 * @returns {Array<{id, name, createdAt, startDate, holdings}>}
 */
export function getPortfolios() {
  return loadAll()
}

/**
 * Get a single portfolio by id
 */
export function getPortfolio(id) {
  return loadAll().find(p => p.id === id) || null
}

/**
 * Create a new portfolio
 * @param {string} name
 * @returns the created portfolio
 */
export function createPortfolio(name) {
  const portfolios = loadAll()
  const portfolio = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: name || 'Mi Cartera',
    createdAt: new Date().toISOString(),
    // Default start date to 1 year ago for realistic projection demos
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    holdings: [],
  }
  portfolios.push(portfolio)
  saveAll(portfolios)
  return portfolio
}

/**
 * Update a portfolio (merge fields)
 */
export function updatePortfolio(id, updates) {
  const portfolios = loadAll()
  const idx = portfolios.findIndex(p => p.id === id)
  if (idx === -1) return null
  portfolios[idx] = { ...portfolios[idx], ...updates }
  saveAll(portfolios)
  return portfolios[idx]
}

/**
 * Delete a portfolio
 */
export function deletePortfolio(id) {
  const portfolios = loadAll().filter(p => p.id !== id)
  saveAll(portfolios)
}

/**
 * Add a holding to a portfolio
 */
export function addHolding(portfolioId, holding) {
  const portfolios = loadAll()
  const p = portfolios.find(p => p.id === portfolioId)
  if (!p) return
  if (p.holdings.find(h => h.ticker === holding.ticker)) return
  p.holdings.push(holding)
  saveAll(portfolios)
}

/**
 * Remove a holding from a portfolio
 */
export function removeHolding(portfolioId, ticker) {
  const portfolios = loadAll()
  const p = portfolios.find(p => p.id === portfolioId)
  if (!p) return
  p.holdings = p.holdings.filter(h => h.ticker !== ticker)
  saveAll(portfolios)
}

/**
 * Update a holding's amount (invested) in a portfolio.
 * Recalculates shares based on buyPrice if available.
 */
export function updateHoldingAmount(portfolioId, ticker, amount, currentPrice = null) {
  const portfolios = loadAll()
  const p = portfolios.find(p => p.id === portfolioId)
  if (!p) return
  const h = p.holdings.find(h => h.ticker === ticker)
  if (h) {
    h.amount = amount
    // Recalculate shares using buyPrice (keep original buy price for gain/loss calculation)
    const price = currentPrice || h.buyPrice
    if (price && price > 0 && isFinite(price)) {
      h.shares = amount / price
      if (!h.buyPrice) h.buyPrice = price
    }
  }
  saveAll(portfolios)
}

/**
 * Calculate compound interest projection
 * @param {number} initialValue - Starting value
 * @param {number} currentValue - Current value
 * @param {string} startDate - ISO date string
 * @param {string} targetDate - ISO date string
 * @returns {{ cagr, projectedValue, totalReturn, yearsElapsed, yearsToTarget }}
 */
export function calculateProjection(initialValue, currentValue, startDate, targetDate) {
  const start = new Date(startDate)
  const now = new Date()
  const target = new Date(targetDate)

  const msPerYear = 365.25 * 24 * 60 * 60 * 1000
  const yearsElapsed = (now - start) / msPerYear
  const yearsToTarget = (target - start) / msPerYear

  if (yearsElapsed <= 0 || initialValue <= 0) {
    return { cagr: 0, projectedValue: currentValue, totalReturn: 0, yearsElapsed: 0, yearsToTarget: 0 }
  }

  const totalReturn = ((currentValue - initialValue) / initialValue) * 100
  // CAGR = (currentValue / initialValue)^(1/years) - 1
  // Guard against very short timespans which produce misleading CAGR
  const effectiveYears = Math.max(yearsElapsed, 0.25) // minimum 3 months
  const cagr = (Math.pow(currentValue / initialValue, 1 / effectiveYears) - 1) * 100

  // Projected value at target date
  const projectedValue = initialValue * Math.pow(1 + cagr / 100, yearsToTarget)

  return {
    cagr,
    projectedValue,
    totalReturn,
    yearsElapsed,
    yearsToTarget,
  }
}

/**
 * Generate monthly projection data points for charting
 */
export function generateProjectionSeries(initialValue, currentValue, startDate, targetDate) {
  const start = new Date(startDate)
  const now = new Date()
  const target = new Date(targetDate)
  const msPerYear = 365.25 * 24 * 60 * 60 * 1000
  const yearsElapsed = (now - start) / msPerYear

  if (yearsElapsed <= 0 || initialValue <= 0) return { historical: [], projected: [] }

  const cagr = Math.pow(currentValue / initialValue, 1 / yearsElapsed) - 1

  // Historical: monthly from start to now
  const historical = []
  const cursor = new Date(start)
  while (cursor <= now) {
    const y = (cursor - start) / msPerYear
    historical.push({
      date: cursor.toISOString().split('T')[0],
      value: initialValue * Math.pow(1 + cagr, y),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  // Add exact current point
  historical.push({ date: now.toISOString().split('T')[0], value: currentValue })

  // Projected: monthly from now to target
  const projected = [{ date: now.toISOString().split('T')[0], value: currentValue }]
  const cursor2 = new Date(now)
  cursor2.setMonth(cursor2.getMonth() + 1)
  while (cursor2 <= target) {
    const y = (cursor2 - start) / msPerYear
    projected.push({
      date: cursor2.toISOString().split('T')[0],
      value: initialValue * Math.pow(1 + cagr, y),
    })
    cursor2.setMonth(cursor2.getMonth() + 1)
  }
  // Add exact target point
  const yTarget = (target - start) / msPerYear
  projected.push({ date: target.toISOString().split('T')[0], value: initialValue * Math.pow(1 + cagr, yTarget) })

  return { historical, projected }
}
