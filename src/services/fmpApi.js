/**
 * Financial Modeling Prep API Service
 * OPTIMIZED: Only uses endpoints available on the free plan.
 * Minimizes API calls (4 per company + 1 for price chart).
 *
 * CACHE STRATEGY (localStorage):
 * - Financial statements (income, balance, cashflow): 24h TTL (data changes quarterly)
 * - Company profile: 1h TTL (price changes frequently)
 * - Price history: 1h TTL
 * - Search results: 15min TTL
 * - In-memory fallback if localStorage unavailable
 */

import {
  isMockMode,
  mockProfile,
  mockIncomeStatements,
  mockBalanceSheet,
  mockCashFlowStatements,
  mockHistoricalPrices,
  mockSearchResults,
} from './mockDataService'

const API_KEY = import.meta.env.VITE_FMP_API_KEY || ''
const STABLE_URL = 'https://financialmodelingprep.com/stable'

// If no API key, force mock mode automatically
if (!API_KEY || API_KEY === 'your_api_key_here') {
  try { localStorage.setItem('stockiq_mock_mode', 'true') } catch (_) {}
}

// Cache TTLs in milliseconds — aggressive caching to minimize API calls
const TTL = {
  FINANCIAL: 7 * 24 * 60 * 60 * 1000,  // 7 days — statements change quarterly
  PROFILE:   4 * 60 * 60 * 1000,       // 4 hours — price updates
  PRICES:    4 * 60 * 60 * 1000,       // 4 hours
  SEARCH:    60 * 60 * 1000,            // 1 hour
}

// Determine TTL based on endpoint
function getTTL(endpoint) {
  if (endpoint.includes('income-statement') || endpoint.includes('balance-sheet') || endpoint.includes('cash-flow')) return TTL.FINANCIAL
  if (endpoint.includes('profile')) return TTL.PROFILE
  if (endpoint.includes('historical-price')) return TTL.PRICES
  return TTL.SEARCH
}

// Storage key prefix
const CACHE_PREFIX = 'stockiq_'

// In-memory fallback cache
const memoryCache = new Map()

/**
 * Try to get from localStorage, fallback to memory
 */
function getCached(key, ttl) {
  // Try localStorage first
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (raw) {
      const entry = JSON.parse(raw)
      if (Date.now() - entry.ts < ttl) {
        // Also populate memory cache for faster access
        memoryCache.set(key, entry)
        return entry.data
      }
      // Expired — remove it
      localStorage.removeItem(CACHE_PREFIX + key)
    }
  } catch (e) {
    // localStorage not available or parse error
  }

  // Fallback to memory cache
  const entry = memoryCache.get(key)
  if (entry && Date.now() - entry.ts < ttl) return entry.data
  memoryCache.delete(key)
  return null
}

/**
 * Save to both localStorage and memory
 */
function setCache(key, data) {
  const entry = { data, ts: Date.now() }
  memoryCache.set(key, entry)
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch (e) {
    // localStorage full or unavailable — memory cache still works
    if (e.name === 'QuotaExceededError') {
      clearOldCache()
      try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
      } catch (_) { /* give up on localStorage */ }
    }
  }
}

/**
 * Clear expired entries from localStorage to free space
 */
function clearOldCache() {
  try {
    const now = Date.now()
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(CACHE_PREFIX)) {
        try {
          const entry = JSON.parse(localStorage.getItem(k))
          // Remove anything older than 24h
          if (now - entry.ts > TTL.FINANCIAL) {
            localStorage.removeItem(k)
          }
        } catch (_) {
          localStorage.removeItem(k)
        }
      }
    }
  } catch (_) { /* ignore */ }
}

// ========= Request tracker (persisted in localStorage) =========
function getTrackerData() {
  try {
    const raw = localStorage.getItem('stockiq_api_tracker')
    if (raw) {
      const data = JSON.parse(raw)
      if (data.day === new Date().toDateString()) return data
    }
  } catch (_) { /* ignore */ }
  return { count: 0, day: new Date().toDateString() }
}

function trackRequest() {
  const tracker = getTrackerData()
  tracker.count++
  try { localStorage.setItem('stockiq_api_tracker', JSON.stringify(tracker)) } catch (_) { /* ignore */ }
  if (tracker.count > 200) {
    console.warn(`⚠️ StockIQ: ${tracker.count}/250 API calls used today`)
  }
  return tracker.count
}

export function getRequestCount() {
  return getTrackerData().count
}

/**
 * Get cache stats for UI display
 */
export function getCacheStats() {
  let entries = 0
  let totalSize = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(CACHE_PREFIX) && k !== 'stockiq_api_tracker') {
        entries++
        totalSize += (localStorage.getItem(k) || '').length
      }
    }
  } catch (_) { /* ignore */ }
  return {
    entries,
    sizeKB: Math.round(totalSize / 1024),
    apiCallsToday: getRequestCount(),
  }
}

/**
 * Clear all StockIQ cache from localStorage
 */
export function clearAllCache() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(k)
      }
    }
  } catch (_) { /* ignore */ }
  memoryCache.clear()
  console.log('📊 StockIQ: Cache cleared')
}

// ========= Core fetch function =========

/**
 * Single fetch function — stable endpoint only, with persistent cache
 */
async function fetchFMP(endpoint, params = {}) {
  // Build a clean cache key (without API key for readability)
  const cacheKey = endpoint + '?' + Object.entries(params).sort().map(([k, v]) => `${k}=${v}`).join('&')
  const ttl = getTTL(endpoint)

  const cached = getCached(cacheKey, ttl)
  if (cached) {
    console.log(`📦 StockIQ cache hit: ${endpoint} (${params.symbol || params.query || ''})`)
    return cached
  }

  // Build full URL for API call
  const url = new URL(`${STABLE_URL}${endpoint}`)
  url.searchParams.set('apikey', API_KEY)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))

  const callNum = trackRequest()
  console.log(`🌐 StockIQ API call #${callNum}: ${endpoint} (${params.symbol || params.query || ''})`)

  const response = await fetch(url.toString())
  if (response.status === 429) {
    throw new Error('Límite de llamadas API alcanzado (429). Espera unos minutos.')
  }
  if (!response.ok) {
    throw new Error(`FMP ${response.status}`)
  }

  const data = await response.json()
  if (data && typeof data === 'object' && !Array.isArray(data) && data['Error Message']) {
    throw new Error(data['Error Message'])
  }

  setCache(cacheKey, data)
  return data
}

function toArray(data) {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') return [data]
  return []
}

// ========= PUBLIC API — Only the endpoints we actually use =========

/**
 * Search companies (1 call)
 */
export async function searchCompanies(query) {
  if (!query || query.length < 1) return []
  if (isMockMode()) {
    console.log('🎭 StockIQ MOCK: searchCompanies', query)
    const data = mockSearchResults(query)
    return data.map(item => ({
      ticker: item.symbol,
      name: item.name,
      exchange: item.stockExchange || item.exchangeShortName,
      exchangeShort: item.exchangeShortName,
      currency: item.currency,
    }))
  }
  const data = await fetchFMP('/search', { query, limit: 10 })
  return toArray(data).map(item => ({
    ticker: item.symbol,
    name: item.name,
    exchange: item.stockExchange || item.exchangeShortName,
    exchangeShort: item.exchangeShortName,
    currency: item.currency,
  }))
}

/**
 * Company profile — includes price, mktCap, eps, beta, sector, pe, etc. (1 call)
 */
export async function getCompanyProfile(ticker) {
  if (isMockMode()) {
    console.log('🎭 StockIQ MOCK: getCompanyProfile', ticker)
    return mockProfile(ticker)
  }
  const data = await fetchFMP('/profile', { symbol: ticker })
  const arr = toArray(data)
  if (arr.length === 0 || !arr[0] || !arr[0].symbol) {
    throw new Error(`Company not found: ${ticker}`)
  }
  return arr[0]
}

/**
 * Income statements — annual, last 5 years (1 call)
 */
export async function getIncomeStatements(ticker, limit = 5) {
  if (isMockMode()) {
    console.log('🎭 StockIQ MOCK: getIncomeStatements', ticker)
    return mockIncomeStatements(ticker, limit)
  }
  const data = await fetchFMP('/income-statement', { symbol: ticker, period: 'annual', limit })
  return toArray(data)
}

/**
 * Balance sheet — annual, last 5 years (1 call)
 */
export async function getBalanceSheet(ticker, limit = 5) {
  if (isMockMode()) {
    console.log('🎭 StockIQ MOCK: getBalanceSheet', ticker)
    return mockBalanceSheet(ticker, limit)
  }
  const data = await fetchFMP('/balance-sheet-statement', { symbol: ticker, period: 'annual', limit })
  return toArray(data)
}

/**
 * Cash flow — annual, last 5 years (1 call)
 */
export async function getCashFlowStatements(ticker, limit = 5) {
  if (isMockMode()) {
    console.log('🎭 StockIQ MOCK: getCashFlowStatements', ticker)
    return mockCashFlowStatements(ticker, limit)
  }
  const data = await fetchFMP('/cash-flow-statement', { symbol: ticker, period: 'annual', limit })
  return toArray(data)
}

/**
 * Historical daily prices for chart (1 call)
 */
export async function getHistoricalPrices(ticker, fromDate, toDate) {
  if (isMockMode()) {
    console.log('🎭 StockIQ MOCK: getHistoricalPrices', ticker)
    return mockHistoricalPrices(ticker, fromDate, toDate)
  }
  const params = { symbol: ticker }
  if (fromDate) params.from = fromDate
  if (toDate) params.to = toDate
  const data = await fetchFMP('/historical-price-eod/full', params)
  if (Array.isArray(data)) return data
  return data?.historical || []
}
