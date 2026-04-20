function App() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <header className="bg-[#16213e] border-b border-[#0f3460] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <span className="text-[#e94560] font-bold text-lg">결제 불일치 분석</span>
        </div>
        <span className="text-gray-500 text-sm">POS Payment Discrepancy Analyzer</span>
      </header>
      <main className="p-6">
        <p className="text-gray-400">로그를 입력하세요.</p>
      </main>
    </div>
  )
}

export default App
