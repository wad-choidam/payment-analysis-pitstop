import { useCallback, useState } from 'react'
import { LogInputSection } from './components/LogInput/LogInputSection'
import { AnalysisSummary } from './components/AnalysisSummary'
import { TimelineSection } from './components/Timeline/TimelineSection'
import { LogTableSection } from './components/LogTable/LogTableSection'
import { parsePosLog } from './parser/posLogParser'
import { parseTerminalLog } from './parser/terminalLogParser'
import { mergeLogEntries } from './parser/logMerger'
import { analyzeDiscrepancy } from './analyzer/discrepancyAnalyzer'
import type { AnalysisResult } from './types'

function App() {
  const [posLog, setPosLog] = useState('')
  const [terminalLog, setTerminalLog] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = useCallback(() => {
    setResult(null)
    setIsLoading(true)

    setTimeout(() => {
      const posEntries = parsePosLog(posLog)
      const terminalEntries = parseTerminalLog(terminalLog)
      const merged = mergeLogEntries(posEntries, terminalEntries)
      const analysis = analyzeDiscrepancy(merged)
      setResult(analysis)
      setIsLoading(false)
    }, 400)
  }, [posLog, terminalLog])

  const isAnalyzable = posLog.trim().length > 0 || terminalLog.trim().length > 0

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <header className="bg-[#16213e] border-b border-[#0f3460] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <span className="text-[#e94560] font-bold text-lg">결제 불일치 분석</span>
        </div>
        <span className="text-gray-500 text-sm">POS Payment Discrepancy Analyzer</span>
      </header>

      <LogInputSection
        posLog={posLog}
        terminalLog={terminalLog}
        onPosLogChange={setPosLog}
        onTerminalLogChange={setTerminalLog}
        onAnalyze={handleAnalyze}
        isAnalyzable={isAnalyzable}
      />

      {isLoading && (
        <section className="border-b border-[#0f3460] p-6">
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="w-5 h-5 border-2 border-[#e94560] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm">로그 분석 중...</span>
          </div>
        </section>
      )}

      {!isLoading && result && result.entries.length === 0 && (
        <section className="border-b border-[#0f3460] p-6">
          <div className="bg-[#16213e] border border-[#0f3460] rounded-lg p-8 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <div className="text-[#ffd700] font-bold text-lg mb-2">분석할 수 있는 로그를 찾지 못했습니다</div>
            <div className="text-gray-400 text-sm">
              포스 로그는 <code className="text-[#00d2ff] bg-[#0a0a1a] px-1.5 py-0.5 rounded text-xs">{"#{HH:mm:ss}"}</code> 형식,
              단말기 로그는 <code className="text-[#00d2ff] bg-[#0a0a1a] px-1.5 py-0.5 rounded text-xs">YYYY-MM-DD HH:mm:ss</code> 형식의 타임스탬프가 포함되어야 합니다.
            </div>
            <div className="text-gray-500 text-xs mt-3">올바른 로그 데이터를 입력한 후 다시 시도해주세요.</div>
          </div>
        </section>
      )}

      {!isLoading && result && result.entries.length > 0 && (
        <>
          <AnalysisSummary result={result} />
          <TimelineSection result={result} />
          <LogTableSection result={result} />
        </>
      )}
    </div>
  )
}

export default App
