import type { AnalysisResult, PaymentAttempt } from '../../types'

interface PaymentAttemptsSectionProps {
  result: AnalysisResult
}

function StatusDot({ result }: { result: PaymentAttempt['result'] }) {
  const colors: Record<PaymentAttempt['result'], string> = {
    success: '#4ade80',
    failure: '#e94560',
    cancelled: '#fbbf24',
    timeout: '#f97316',
    unknown: '#6b7280',
  }
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
      style={{ background: colors[result] }}
    />
  )
}

function resultLabel(result: PaymentAttempt['result']): string {
  const labels: Record<PaymentAttempt['result'], string> = {
    success: '성공',
    failure: '실패',
    cancelled: '취소',
    timeout: '타임아웃',
    unknown: '불명',
  }
  return labels[result]
}

function AttemptCard({ attempt }: { attempt: PaymentAttempt }) {
  const isSuccess = attempt.result === 'success'
  const borderColor = isSuccess ? '#4ade80' : attempt.result === 'cancelled' ? '#fbbf24' : '#e94560'

  return (
    <div
      className="bg-[#16213e] rounded-lg p-4"
      style={{ borderLeft: `3px solid ${borderColor}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[#00d2ff] font-bold text-sm">
            {attempt.attemptNumber}차 결제 시도
          </span>
          <span className="text-gray-500 text-xs">
            {attempt.startTimestamp} ~ {attempt.endTimestamp}
          </span>
        </div>
        <div className="flex items-center text-sm">
          <StatusDot result={attempt.result} />
          <span style={{ color: isSuccess ? '#4ade80' : '#e94560' }}>
            {resultLabel(attempt.result)}
          </span>
        </div>
      </div>

      <div className="text-gray-300 text-sm mb-2">{attempt.resultDetail}</div>

      <div className="flex gap-4 text-xs text-gray-500">
        <span>
          VAN 승인 전송: {attempt.vanApprovalSent
            ? <span className="text-[#4ade80]">O</span>
            : <span className="text-gray-600">X</span>}
        </span>
        <span>
          VAN 승인 성공: {attempt.vanApprovalSuccess
            ? <span className="text-[#4ade80]">O (0000)</span>
            : <span className="text-gray-600">X</span>}
        </span>
        <span>
          POS 수신: {attempt.posReceivedSuccess
            ? <span className="text-[#4ade80]">O</span>
            : <span className="text-gray-600">X</span>}
        </span>
      </div>
    </div>
  )
}

export function PaymentAttemptsSection({ result }: PaymentAttemptsSectionProps) {
  if (!result.attempts || result.attempts.length === 0) return null

  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
        <span className="font-bold">결제 시도 분석</span>
        <span className="text-gray-500 text-sm ml-2">N차 결제 시도별 결과</span>
      </div>
      <div className="flex flex-col gap-2">
        {result.attempts.map(attempt => (
          <AttemptCard key={attempt.attemptNumber} attempt={attempt} />
        ))}
      </div>
    </section>
  )
}
