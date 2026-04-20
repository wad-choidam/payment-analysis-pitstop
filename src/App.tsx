import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { AnalyzePage } from './pages/AnalyzePage'
import { GuidePage } from './pages/GuidePage'

function App() {
  const location = useLocation()
  const isGuide = location.pathname === '/guide'

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <header className="bg-[#16213e] border-b border-[#0f3460] px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <span className="text-xl">🔍</span>
          <span className="text-[#e94560] font-bold text-lg">결제 불일치 분석</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to={isGuide ? '/' : '/guide'}
            className="text-sm px-3 py-1.5 rounded-md border border-[#0f3460] text-gray-300 hover:border-[#00d2ff] hover:text-[#00d2ff] transition-colors"
          >
            {isGuide ? '분석 도구' : '📖 가이드'}
          </Link>
          <span className="text-gray-500 text-sm hidden sm:inline">POS Payment Discrepancy Analyzer</span>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<AnalyzePage />} />
        <Route path="/guide" element={<GuidePage />} />
      </Routes>
    </div>
  )
}

export default App
