import { LogTextArea } from './LogTextArea'

interface LogInputSectionProps {
  posLog: string
  terminalLog: string
  onPosLogChange: (value: string) => void
  onTerminalLogChange: (value: string) => void
  onAnalyze: () => void
  onReset: () => void
  isAnalyzable: boolean
}

export function LogInputSection({
  posLog,
  terminalLog,
  onPosLogChange,
  onTerminalLogChange,
  onAnalyze,
  onReset,
  isAnalyzable,
}: LogInputSectionProps) {
  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
        <span className="font-bold">로그 입력</span>
        <span className="text-gray-500 text-sm ml-2">포스 로그와 단말기 로그를 입력하세요</span>
      </div>
      <div className="flex gap-4">
        <LogTextArea
          label="📋 포스 로그 (POS Log)"
          value={posLog}
          onChange={onPosLogChange}
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
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!isAnalyzable}
          className="bg-[#e94560] text-white px-8 py-2 rounded-md font-bold text-sm hover:bg-[#d63d56] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          분석 시작
        </button>
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
