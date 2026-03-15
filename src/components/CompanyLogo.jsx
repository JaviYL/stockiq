import { useState } from 'react'
import { Building2 } from 'lucide-react'

/**
 * Displays a company logo from FMP's image-stock API.
 * Falls back to a ticker initial on error.
 *
 * FMP provides logos at: https://financialmodelingprep.com/image-stock/{TICKER}.png
 * These work for most US/EU listed companies.
 */
export default function CompanyLogo({ ticker, image, size = 24, className = '' }) {
  const [error, setError] = useState(false)

  // Build image URL: use provided image or FMP default
  const src = image || `https://financialmodelingprep.com/image-stock/${ticker?.toUpperCase()}.png`

  if (error || !ticker) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-tertiary)] font-bold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {ticker ? ticker.charAt(0) : <Building2 style={{ width: size * 0.5, height: size * 0.5 }} />}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={`${ticker} logo`}
      onError={() => setError(true)}
      className={`rounded-md object-contain bg-white ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
