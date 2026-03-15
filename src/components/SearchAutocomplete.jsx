import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { searchCompanies } from '../services/fmpApi'
import { useLanguage } from '../context/LanguageContext'

export default function SearchAutocomplete({ onSelect, placeholder, large = false, className = '' }) {
  const { lang } = useLanguage()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([])
      setOpen(false)
      return
    }

    setLoading(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchCompanies(query.trim())
        setResults(data.slice(0, 8))
        setOpen(true)
        setSelectedIdx(-1)
      } catch (err) {
        console.error('Search error:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (item) => {
    onSelect(item.ticker)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedIdx >= 0 && results[selectedIdx]) {
      handleSelect(results[selectedIdx])
    } else if (query.trim()) {
      onSelect(query.trim().toUpperCase())
      setQuery('')
      setResults([])
      setOpen(false)
    }
  }

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const sizeClasses = large
    ? 'pl-14 pr-12 py-4 text-lg rounded-xl'
    : 'pl-10 pr-10 py-2.5 text-sm rounded-lg'

  const iconSize = large ? 'w-5 h-5' : 'w-4 h-4'
  const iconLeft = large ? 'left-5' : 'left-3'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className={`absolute ${iconLeft} top-1/2 -translate-y-1/2 ${iconSize} text-[var(--text-tertiary)]`} />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`w-full ${sizeClasses} bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all ${className}`}
        />
        {loading && (
          <Loader2 className={`absolute right-3 top-1/2 -translate-y-1/2 ${iconSize} text-blue-500 animate-spin`} />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false) }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]`}
          >
            <X className={iconSize} />
          </button>
        )}
      </form>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden max-h-80 overflow-y-auto">
          {results.map((item, idx) => (
            <button
              key={item.ticker + idx}
              onClick={() => handleSelect(item)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                idx === selectedIdx
                  ? 'bg-blue-500/10 text-blue-400'
                  : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
              } ${idx > 0 ? 'border-t border-[var(--border)]/50' : ''}`}
            >
              <span className="flex-shrink-0 w-16 font-bold text-sm text-blue-400">{item.ticker}</span>
              <span className="flex-1 truncate text-sm">{item.name}</span>
              <span className="flex-shrink-0 text-xs text-[var(--text-tertiary)]">{item.exchange}</span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim().length >= 1 && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-xl p-4 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            {lang === 'es' ? 'No se encontraron resultados' : 'No results found'}
          </p>
        </div>
      )}
    </div>
  )
}
