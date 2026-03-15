import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CurrencyContext = createContext()

const STORAGE_KEY = 'stockiq-currency'
const RATE_CACHE_KEY = 'stockiq-exchange-rate'
const RATE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Fetches EUR/USD rate from a free API.
 * Falls back to a reasonable default if offline.
 */
async function fetchExchangeRate() {
  // Check cache first
  try {
    const cached = localStorage.getItem(RATE_CACHE_KEY)
    if (cached) {
      const { rate, ts } = JSON.parse(cached)
      if (Date.now() - ts < RATE_TTL) return rate
    }
  } catch {}

  // Try fetching from exchangerate.host (free, no key needed)
  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=EUR')
    if (res.ok) {
      const data = await res.json()
      if (data.rates?.EUR) {
        const rate = data.rates.EUR
        localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }))
        return rate
      }
    }
  } catch {}

  // Fallback: try FMP forex endpoint
  try {
    const apiKey = import.meta.env.VITE_FMP_API_KEY
    if (apiKey) {
      const res = await fetch(`https://financialmodelingprep.com/stable/fx?apikey=${apiKey}`)
      if (res.ok) {
        const data = await res.json()
        const pair = data.find(p => p.ticker === 'EUR/USD')
        if (pair?.bid) {
          const rate = 1 / pair.bid // USD→EUR
          localStorage.setItem(RATE_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }))
          return rate
        }
      }
    }
  } catch {}

  // Last resort fallback
  return 0.92
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'USD'
    }
    return 'USD'
  })
  const [usdToEur, setUsdToEur] = useState(0.92)
  const [rateLoaded, setRateLoaded] = useState(false)

  useEffect(() => {
    fetchExchangeRate().then(rate => {
      setUsdToEur(rate)
      setRateLoaded(true)
    })
  }, [])

  const setCurrency = useCallback((c) => {
    setCurrencyState(c)
    localStorage.setItem(STORAGE_KEY, c)
  }, [])

  /**
   * Convert a USD value to the user's selected currency.
   * All data from FMP comes in USD; this converts to EUR if needed.
   */
  const convert = useCallback((usdValue) => {
    if (usdValue == null || isNaN(usdValue)) return usdValue
    if (currency === 'EUR') return usdValue * usdToEur
    return usdValue
  }, [currency, usdToEur])

  /**
   * Format a value with the correct currency symbol.
   */
  const fmt = useCallback((value, opts = {}) => {
    if (value == null || isNaN(value)) return 'N/A'
    const { decimals = 2, compact = false } = opts
    const locale = 'es-ES'
    const symbol = currency === 'EUR' ? '€' : '$'

    if (compact) {
      const abs = Math.abs(value)
      if (abs >= 1e12) return `${symbol}${(value / 1e12).toLocaleString(locale, { maximumFractionDigits: 1 })}T`
      if (abs >= 1e9) return `${symbol}${(value / 1e9).toLocaleString(locale, { maximumFractionDigits: 1 })}B`
      if (abs >= 1e6) return `${symbol}${(value / 1e6).toLocaleString(locale, { maximumFractionDigits: 1 })}M`
      if (abs >= 1e3) return `${symbol}${(value / 1e3).toLocaleString(locale, { maximumFractionDigits: 1 })}K`
    }

    return `${symbol}${value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  }, [currency])

  /**
   * Convert and format in one step.
   */
  const convertAndFmt = useCallback((usdValue, opts = {}) => {
    return fmt(convert(usdValue), opts)
  }, [convert, fmt])

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      usdToEur,
      rateLoaded,
      convert,
      fmt,
      convertAndFmt,
      symbol: currency === 'EUR' ? '€' : '$',
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)
