import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { AnalyzePage } from './pages/AnalyzePage'
import { GuidePage } from './pages/GuidePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const location = useLocation()
  const isGuide = location.pathname === '/guide'

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <header className="bg-[#16213e] border-b border-[#0f3460] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-xl">🔍</span>
            <span className="text-[#e94560] font-bold text-lg">결제 불일치 분석</span>
          </Link>
          <div className="relative group">
            <Link
              to={isGuide ? '/' : '/guide'}
              className="inline-block text-sm font-bold px-4 py-1.5 rounded-md bg-[#00d2ff] text-[#0a0a1a] hover:bg-[#00b8e6] transition-all cursor-pointer shadow-md shadow-[#00d2ff]/20 hover:shadow-[#00d2ff]/40 hover:scale-105 active:scale-100"
            >
              {isGuide ? '← 분석 도구' : '📖 가이드'}
            </Link>
            {!isGuide && (
              <div className="absolute top-full left-0 mt-2 whitespace-nowrap bg-[#1a2540] border border-[#0f3460] rounded-md px-3 py-2 text-xs text-gray-300 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                결제 불일치 분석이 처음이라면 가이드를 확인하세요
                <span className="absolute left-6 -top-1 w-2 h-2 bg-[#1a2540] border-l border-t border-[#0f3460] rotate-45" />
              </div>
            )}
          </div>
        </div>
        <span className="text-gray-500 text-sm hidden sm:inline">POS Payment Discrepancy Analyzer</span>
      </header>

      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AnalyzePage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </div>
  )
}

export default App
