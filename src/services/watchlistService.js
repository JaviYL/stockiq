/**
 * Watchlist Service
 * Manages user's favorite tickers in localStorage.
 */

const STORAGE_KEY = 'stockiq_watchlist'

/**
 * Get the current watchlist
 */
export function getWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) { /* ignore */ }
  return []
}

/**
 * Add a ticker to the watchlist
 */
export function addToWatchlist(ticker) {
  const list = getWatchlist()
  const t = ticker.toUpperCase()
  if (!list.includes(t)) {
    list.push(t)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch (_) { /* ignore */ }
  }
  return list
}

/**
 * Remove a ticker from the watchlist
 */
export function removeFromWatchlist(ticker) {
  let list = getWatchlist()
  list = list.filter(t => t !== ticker.toUpperCase())
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch (_) { /* ignore */ }
  return list
}

/**
 * Check if a ticker is in the watchlist
 */
export function isInWatchlist(ticker) {
  return getWatchlist().includes(ticker.toUpperCase())
}

/**
 * Toggle a ticker in/out of the watchlist
 */
export function toggleWatchlist(ticker) {
  if (isInWatchlist(ticker)) {
    return { list: removeFromWatchlist(ticker), added: false }
  } else {
    return { list: addToWatchlist(ticker), added: true }
  }
}
