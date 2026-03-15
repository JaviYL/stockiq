/**
 * Simulation utilities for demo portfolio data
 * Generates consistent pseudo-random offsets per ticker for realistic gains/losses.
 * Used by both Portfolio.jsx and Profile.jsx to ensure data consistency.
 */

/**
 * Generate a deterministic pseudo-random number [0, 1) for a given ticker.
 * Same ticker always produces the same value.
 */
export function tickerPseudoRand(ticker) {
  const seed = ticker.split('').reduce((s, c) => ((s << 5) - s + c.charCodeAt(0)) | 0, 0)
  return ((Math.abs(seed * 16807) % 2147483647) & 0x7fffffff) / 2147483647
}

/**
 * Simulate a past buy price given the current market price.
 * Returns a buyPrice that is 10-35% different from currentPrice.
 * ~70% of tickers will show gains, ~30% will show losses.
 *
 * @param {string} ticker - Stock ticker symbol
 * @param {number} currentPrice - Current market price
 * @returns {number} Simulated past buy price
 */
export function simulateBuyPrice(ticker, currentPrice) {
  const rand = tickerPseudoRand(ticker)
  const isGain = rand < 0.7
  const offset = 0.10 + rand * 0.25 // 10% to 35%

  const buyPrice = isGain
    ? currentPrice * (1 - offset)   // bought cheaper → now gaining
    : currentPrice * (1 + offset * 0.6) // bought more expensive → now losing

  return Math.round(buyPrice * 100) / 100
}

/**
 * Estimate current market price from a holding's stored buyPrice.
 * Reverses the simulateBuyPrice calculation.
 * Used when we don't have live data (e.g., Profile summary).
 *
 * @param {string} ticker - Stock ticker symbol
 * @param {number} buyPrice - The stored buy price
 * @returns {number} Estimated current market price
 */
export function estimateCurrentPrice(ticker, buyPrice) {
  const rand = tickerPseudoRand(ticker)
  const isGain = rand < 0.7
  const offset = 0.10 + rand * 0.25

  return isGain
    ? buyPrice / (1 - offset)
    : buyPrice / (1 + offset * 0.6)
}

/**
 * Calculate the simulated current value of a holding.
 * Uses live data if available, otherwise estimates from buyPrice.
 *
 * @param {object} holding - { ticker, amount, shares, buyPrice }
 * @param {object|null} liveData - { price } from fetchCompanyData, or null
 * @returns {number} Estimated current market value
 */
export function getHoldingCurrentValue(holding, liveData = null) {
  const { shares, buyPrice, amount, ticker } = holding

  // If we have live data and shares, use actual market price
  if (shares && shares > 0 && liveData?.price) {
    return shares * liveData.price
  }

  // If we have shares and buyPrice, estimate current price from simulation
  if (shares && shares > 0 && buyPrice && buyPrice > 0 && ticker) {
    const currentPrice = estimateCurrentPrice(ticker, buyPrice)
    return shares * currentPrice
  }

  // Legacy fallback: no shares data
  return amount || 0
}
