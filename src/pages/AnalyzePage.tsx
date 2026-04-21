import { useCallback, useState } from 'react'
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
import type { AnalysisResult, LogEntry } from '../types'
import { SAMPLE_BPOS_LOG, SAMPLE_APOS_ROWS } from '../data/sampleLogs'
import { parseAndroidExcelRows, formatAndroidEntriesAsText } from '../parser/androidExcelParser'

export function AnalyzePage() {
  const [posLog, setPosLog] = useState('')
  const [terminalLog, setTerminalLog] = useState('')
  const [serviceType, setServiceType] = useState<string | undefined>()
  const [androidEntries, setAndroidEntries] = useState<LogEntry[]>([])
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sampleLoaded, setSampleLoaded] = useState<'bpos' | 'apos' | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleReset = useCallback(() => {
    setPosLog('')
    setTerminalLog('')
    setServiceType(undefined)
    setAndroidEntries([])
    setResult(null)
    setSampleLoaded(null)
    setParseError(null)
  }, [])

  const handleParseError = useCallback((message: string) => {
    setParseError(message)
    setTimeout(() => setParseError(null), 6000)
  }, [])

  const handleAnalyze = useCallback(() => {
    setResult(null)
    setIsLoading(true)
    setSampleLoaded(null)

    setTimeout(() => {
      let analysisEntries: LogEntry[]
      if (androidEntries.length > 0) {
        analysisEntries = androidEntries
      } else {
        const posEntries = parsePosLog(posLog)
        const terminalEntries = parseTerminalLog(terminalLog)
        analysisEntries = mergeLogEntries(posEntries, terminalEntries)
      }
      const analysis = analyzeDiscrepancy(analysisEntries, { posTypeHint: serviceType })
      setResult(analysis)
      setIsLoading(false)
    }, 400)
  }, [posLog, terminalLog, serviceType, androidEntries])

  const handleLoadSampleBpos = useCallback(() => {
    setPosLog(SAMPLE_BPOS_LOG)
    setTerminalLog('')
    setServiceType('BPOS')
    setAndroidEntries([])
    setResult(null)
    setSampleLoaded('bpos')
  }, [])

  const handleLoadSampleApos = useCallback(() => {
    const entries = parseAndroidExcelRows(SAMPLE_APOS_ROWS)
    setPosLog(formatAndroidEntriesAsText(entries))
    setTerminalLog('')
    setServiceType('APOS')
    setAndroidEntries(entries)
    setResult(null)
    setSampleLoaded('apos')
  }, [])

  const isAnalyzable = posLog.trim().length > 0 || terminalLog.trim().length > 0 || androidEntries.length > 0

  return (
    <>
      {!isLoading && !result && (
        <div className="border-b border-[#0f3460] px-6 py-4 bg-gradient-to-r from-[#16213e] via-[#1a2d5c] to-[#16213e]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleLoadSampleBpos}
                disabled={sampleLoaded === 'bpos'}
                className="text-sm font-bold px-4 py-2 rounded-md bg-[#00d2ff] text-[#0a0a1a] hover:bg-[#00b8e6] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-[#00d2ff]/20 hover:shadow-[#00d2ff]/40 hover:scale-105 active:scale-100"
              >
                {sampleLoaded === 'bpos' ? '✓ iOS 예시 불러옴' : '🍎 iOS 예시'}
              </button>
              <button
                type="button"
                onClick={handleLoadSampleApos}
                disabled={sampleLoaded === 'apos'}
                className="text-sm font-bold px-4 py-2 rounded-md bg-[#a78bfa] text-[#0a0a1a] hover:bg-[#9370f0] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg shadow-[#a78bfa]/20 hover:shadow-[#a78bfa]/40 hover:scale-105 active:scale-100"
              >
                {sampleLoaded === 'apos' ? '✓ Android 예시 불러옴' : '🤖 Android 예시'}
              </button>
            </div>
            <div>
              <div className="text-sm font-bold text-white">처음이시라면 예시 로그로 체험해보세요</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {sampleLoaded === 'bpos' && '미무 1274840 (BPOS, 5회 시도) 로그를 불러왔습니다.'}
                {sampleLoaded === 'apos' && '킴보 1513721 (APOS, 2회 시도) 로그를 불러왔습니다.'}
                {!sampleLoaded && '실제 분석 사례를 한 번에 불러옵니다 (iOS 5회 시도 / Android 2회 시도)'}
              </div>
            </div>
          </div>
        </div>
      )}

      <LogInputSection
        posLog={posLog}
        terminalLog={terminalLog}
        serviceType={serviceType}
        onPosLogChange={setPosLog}
        onTerminalLogChange={setTerminalLog}
        onServiceTypeDetected={setServiceType}
        onAndroidEntriesDetected={setAndroidEntries}
        onParseError={handleParseError}
        onAnalyze={handleAnalyze}
        onReset={handleReset}
        isAnalyzable={isAnalyzable}
        sampleLoaded={sampleLoaded}
      />

      {parseError && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 max-w-md bg-[#2a1621] border border-[#e94560] text-[#ff8fa5] px-4 py-3 rounded-lg shadow-lg text-sm z-50 animate-fade-in-up"
          role="alert"
        >
          <div className="flex items-start gap-2">
            <span>⚠️</span>
            <div className="flex-1">
              <div className="font-bold text-[#e94560] mb-0.5">파일 처리 실패</div>
              <div className="text-gray-300">{parseError}</div>
            </div>
            <button
              type="button"
              onClick={() => setParseError(null)}
              className="text-gray-500 hover:text-gray-300 cursor-pointer"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
