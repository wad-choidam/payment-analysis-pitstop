import { LogTextArea } from './LogTextArea'

interface LogInputSectionProps {
  posLog: string
  terminalLog: string
  onPosLogChange: (value: string) => void
  onTerminalLogChange: (value: string) => void
  onServiceTypeDetected?: (serviceType: string) => void
  onAnalyze: () => void
  onReset: () => void
  isAnalyzable: boolean
  sampleLoaded?: boolean
}

export function LogInputSection({
  posLog,
  terminalLog,
  onPosLogChange,
  onTerminalLogChange,
  onServiceTypeDetected,
  onAnalyze,
  onReset,
  isAnalyzable,
  sampleLoaded,
}: LogInputSectionProps) {
  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
        <span className="font-bold">로그 입력</span>
        <span className="text-gray-500 text-sm ml-2">포스 로그와 단말기 로그를 입력하세요</span>
      </div>

      {sampleLoaded && (
        <div className="mb-4 bg-[#0a1a2e] border border-[#00d2ff] rounded-md p-3 flex items-start gap-3 animate-fade-in">
          <span className="text-lg">✨</span>
          <div className="flex-1 text-sm">
            <div className="text-[#00d2ff] font-bold mb-1">샘플 로그가 불러와졌습니다 — 미무 1274840</div>
            <div className="text-gray-400 text-xs">
              과거 ptxId가 섞인 직전거래 응답이 포함된 복잡한 케이스입니다. 아래 <span className="text-[#e94560] font-bold">분석 시작</span> 버튼을 눌러 결과를 확인해 보세요.
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-4">
        <LogTextArea
          label="📋 포스 로그 (POS Log)"
          value={posLog}
          onChange={onPosLogChange}
          onServiceTypeDetected={onServiceTypeDetected}
          placeholder="엑셀(.xlsx) 파일을 드래그하거나 텍스트를 붙여넣으세요..."
        />
        <LogTextArea
          label="📋 단말기 로그 (Terminal Log)"
          value={terminalLog}
          onChange={onTerminalLogChange}
          showFileUpload={false}
          placeholder="단말기 로그를 붙여넣으세요"
        />
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <div className="relative">
          {sampleLoaded && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#00d2ff] text-[#0a0a1a] text-xs font-bold px-3 py-1.5 rounded-md shadow-lg animate-bounce-soft pointer-events-none">
              👇 여기를 눌러 분석 시작
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[#00d2ff] rotate-45" />
            </div>
          )}
          <button
            type="button"
            onClick={onAnalyze}
            disabled={!isAnalyzable}
            className={`bg-[#e94560] text-white px-8 py-2 rounded-md font-bold text-sm hover:bg-[#d63d56] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer ${sampleLoaded ? 'animate-analyze-pulse ring-2 ring-[#00d2ff] ring-offset-2 ring-offset-[#1a1a2e]' : ''}`}
          >
            분석 시작
          </button>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!isAnalyzable}
          className="bg-transparent border border-gray-600 text-gray-400 px-6 py-2 rounded-md text-sm hover:border-gray-400 hover:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          초기화
        </button>
      </div>
    </section>
  )
}
