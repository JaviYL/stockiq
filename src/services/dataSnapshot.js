/**
 * Data Snapshot System
 *
 * Provides a way to pre-load company data so the app works
 * without burning API calls on popular tickers.
 *
 * How it works:
 * 1. Run `saveSnapshot(ticker)` from browser console to capture current API data
 * 2. Or run `saveAllPopularSnapshots()` once to capture all popular tickers
 * 3. Snapshots are saved in localStorage with a 7-day TTL
 * 4. When fetchCompanyData is called, it checks snapshot first
 *
 * Snapshots store the RAW API responses (profile, income, balance, cashflow)
 * so they can be reprocessed if our calculation logic changes.
 */

const SNAPSHOT_PREFIX = 'stockiq_snap_'
const SNAPSHOT_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * Save a raw data snapshot for a ticker
 */
export function saveSnapshot(ticker, rawData) {
  const key = SNAPSHOT_PREFIX + ticker.toUpperCase()
  const entry = {
    ticker: ticker.toUpperCase(),
    data: rawData,
    ts: Date.now(),
    version: 2, // Bump this when data format changes
  }
  try {
    localStorage.setItem(key, JSON.stringify(entry))
    console.log(`💾 StockIQ: Snapshot saved for ${ticker}`)
  } catch (e) {
    console.warn(`⚠️ StockIQ: Failed to save snapshot for ${ticker}`, e)
  }
}

/**
 * Load a snapshot if available and not expired
 */
export function loadSnapshot(ticker) {
  const key = SNAPSHOT_PREFIX + ticker.toUpperCase()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw)
    if (entry.version !== 2) return null // Stale format
    if (Date.now() - entry.ts > SNAPSHOT_TTL) {
      localStorage.removeItem(key)
      return null
    }
    console.log(`📦 StockIQ: Using snapshot for ${ticker} (${Math.round((Date.now() - entry.ts) / 3600000)}h old)`)
    return entry.data
  } catch (_) {
    return null
  }
}

/**
 * Check if a snapshot exists and is valid
 */
export function hasSnapshot(ticker) {
  return loadSnapshot(ticker) !== null
}

/**
 * Get all saved snapshots info
 */
export function getSnapshotInfo() {
  const snapshots = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(SNAPSHOT_PREFIX)) {
        const raw = localStorage.getItem(k)
        const entry = JSON.parse(raw)
        const ageHours = Math.round((Date.now() - entry.ts) / 3600000)
        snapshots.push({
          ticker: entry.ticker,
          ageHours,
          sizeKB: Math.round(raw.length / 1024),
          expired: Date.now() - entry.ts > SNAPSHOT_TTL,
        })
      }
    }
  } catch (_) { /* ignore */ }
  const sorted = snapshots.sort((a, b) => a.ticker.localeCompare(b.ticker))
  sorted.count = sorted.length
  return sorted
}

/**
 * Clear all snapshots
 */
export function clearSnapshots() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (k && k.startsWith(SNAPSHOT_PREFIX)) {
        localStorage.removeItem(k)
      }
    }
  } catch (_) { /* ignore */ }
  console.log('📊 StockIQ: All snapshots cleared')
}
