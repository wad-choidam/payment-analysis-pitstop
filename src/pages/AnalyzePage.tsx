import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { LogInputSection } from '../components/LogInput/LogInputSection'
import { ConclusionBanner } from '../components/ConclusionBanner'
import { AnalysisSummary } from '../components/AnalysisSummary'
import { PaymentAttemptsSection } from '../components/PaymentAttempts/PaymentAttemptsSection'
import { TimelineSection } from '../components/Timeline/TimelineSection'
import { LogTableSection } from '../components/LogTable/LogTableSection'
import { parsePosLog } from '../parser/posLogParser'
import { parseTerminalLog } from '../parser/terminalLogParser'
import { mergeLogEntries } from '../parser/logMerger'
import { analyzeDiscrepancy } from '../analyzer/discrepancyAnalyzer'
import type { AnalysisResult } from '../types'
import { SAMPLE_BPOS_LOG } from '../data/sampleLogs'

export function AnalyzePage() {
  const [posLog, setPosLog] = useState('')
  const [terminalLog, setTerminalLog] = useState('')
  const [serviceType, setServiceType] = useState<string | undefined>()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sampleLoaded, setSampleLoaded] = useState(false)

  const handleReset = useCallback(() => {
    setPosLog('')
    setTerminalLog('')
    setServiceType(undefined)
    setResult(null)
    setSampleLoaded(false)
  }, [])

  const handleAnalyze = useCallback(() => {
    setResult(null)
    setIsLoading(true)
    setSampleLoaded(false)

    setTimeout(() => {
      const posEntries = parsePosLog(posLog)
      const terminalEntries = parseTerminalLog(terminalLog)
      const merged = mergeLogEntries(posEntries, terminalEntries)
      const analysis = analyzeDiscrepancy(merged, { posTypeHint: serviceType })
      setResult(analysis)
      setIsLoading(false)
    }, 400)
  }, [posLog, terminalLog, serviceType])

  const handleLoadSample = useCallback(() => {
    setPosLog(SAMPLE_BPOS_LOG)
    setTerminalLog('')
    setServiceType('BPOS')
    setResult(null)
    setSampleLoaded(true)
  }, [])

  const isAnalyzable = posLog.trim().length > 0 || terminalLog.trim().length > 0

  return (
    <>
      {!isLoading && !result && (
        <>
          <Link
            to="/guide"
            className="flex items-center gap-2 border-b border-[#0f3460] px-6 py-3 text-sm text-gray-300 hover:text-[#00d2ff] hover:bg-[#162a50] transition-colors animate-guide-pulse"
          >
            <span>📖</span>
            <span>결제 불일치 분석이 처음이라면 <span className="underline font-bold text-[#00d2ff]">가이드</span>를 확인하세요</span>
          </Link>
          <div className="border-b border-[#0f3460] px-6 py-4 bg-gradient-to-r from-[#16213e] via-[#1a2d5c] to-[#16213e]">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                type="button"
                onClick={handleLoadSample}
                disabled={sampleLoaded}
                className="text-sm font-bold px-5 py-2 rounded-md bg-[#00d2ff] text-[#0a0a1a] hover:bg-[#00b8e6] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-[#00d2ff]/20 hover:shadow-[#00d2ff]/40 hover:scale-105 active:scale-100 shrink-0"
              >
                {sampleLoaded ? '✓ 예시 로그 불러옴' : '✨ 예시로 분석해보기 →'}
              </button>
              <div>
                <div className="text-sm font-bold text-white">처음이시라면 예시 로그로 체험해보세요</div>
                <div className="text-xs text-gray-400 mt-0.5">실제 분석 사례(미무 1274840)를 한 번에 불러옵니다</div>
              </div>
            </div>
          </div>
        </>
      )}

      <LogInputSection
        posLog={posLog}
        terminalLog={terminalLog}
        onPosLogChange={setPosLog}
        onTerminalLogChange={setTerminalLog}
        onServiceTypeDetected={setServiceType}
        onAnalyze={handleAnalyze}
        onReset={handleReset}
        isAnalyzable={isAnalyzable}
        sampleLoaded={sampleLoaded}
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
          <ConclusionBanner result={result} />
          <AnalysisSummary result={result} />
          <PaymentAttemptsSection result={result} />
          <TimelineSection result={result} />
          <LogTableSection result={result} />
        </>
      )}
    </>
  )
}
