import { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import { isMockMode } from './services/mockDataService'
import Home from './pages/Home'
import Stock from './pages/Stock'
import Calculator from './pages/Calculator'
import Watchlist from './pages/Watchlist'
import Comparator from './pages/Comparator'
import Screener from './pages/Screener'
import WhatIf from './pages/WhatIf'
import Portfolio from './pages/Portfolio'
import EarningsCalendar from './pages/EarningsCalendar'
import IndexExplorer from './pages/IndexExplorer'
import Profile from './pages/Profile'

const POPULAR_TICKERS = ['AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'META', 'TSLA']

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleSearch = (ticker) => {
    const t = ticker.toUpperCase().trim()
    if (t) {
      navigate(`/stock/${t}`)
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSearch={handleSearch} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        {isMockMode() && (
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-500/15 border-b border-amber-500/20 text-amber-400 text-xs font-medium">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>MODO DEMO — Datos simulados, sin consumo de API</span>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home onSearch={handleSearch} popularTickers={POPULAR_TICKERS} />} />
            <Route path="/stock/:ticker" element={<Stock />} />
            <Route path="/calculator" element={<Calculator />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/comparator" element={<Comparator />} />
            <Route path="/screener" element={<Screener />} />
            <Route path="/whatif" element={<WhatIf />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/earnings" element={<EarningsCalendar />} />
            <Route path="/indices" element={<IndexExplorer />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
