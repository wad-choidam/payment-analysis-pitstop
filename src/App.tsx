import { useState } from 'react'
import { LogInputSection } from './components/LogInput/LogInputSection'
import { AnalysisSummary } from './components/AnalysisSummary'
import { TimelineSection } from './components/Timeline/TimelineSection'
import { parsePosLog } from './parser/posLogParser'
import { parseTerminalLog } from './parser/terminalLogParser'
import { mergeLogEntries } from './parser/logMerger'
import { analyzeDiscrepancy } from './analyzer/discrepancyAnalyzer'
import type { AnalysisResult } from './types'

function App() {
  const [posLog, setPosLog] = useState('')
  const [terminalLog, setTerminalLog] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = () => {
    const posEntries = parsePosLog(posLog)
    const terminalEntries = parseTerminalLog(terminalLog)
    const merged = mergeLogEntries(posEntries, terminalEntries)
    const analysis = analyzeDiscrepancy(merged)
    setResult(analysis)
  }

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

      {result && (
        <>
          <AnalysisSummary result={result} />
          <TimelineSection result={result} />
          <div className="p-6 text-gray-400 text-sm">
            분석 완료: {result.entries.length}개 로그 항목
          </div>
        </>
      )}
    </div>
  )
}

export default App
