import type { AnalysisResult } from '../types'
import { EventTooltip } from './EventTooltip'

interface AnalysisSummaryProps {
  result: AnalysisResult
}

const DISCREPANCY_DESCRIPTIONS: { keyword: string; description: string }[] = [
  { keyword: '타이머 만료', description: 'POS에서 승인 요청 후 3초 내 응답이 없어 접속을 종료. 단말기가 VAN과 단독 승인을 완료하면 결제 불일치 발생.' },
  { keyword: '단말기 수신 불가', description: '단말기가 이전 요청 처리 중이거나 결제 진입 불가 상태(9999). 단말기가 이후 단독으로 결제를 완료할 수 있음.' },
  { keyword: 'PtxID 불일치', description: '이전 결제 비정상 종료 후 직전 거래의 ptxId와 현재 ptxId가 달라 승인정보 동기화 실패.' },
  { keyword: 'EOT 비정상', description: '단말기에서 결제 성공했으나 POS와의 정상 종료 절차(EOT)가 완료되지 않음. 단말기 자체 영수증 출력.' },
  { keyword: '중단 실패', description: '취소 요청을 보냈으나 단말기가 이전 요청을 처리 중이라 취소가 거절됨. 단말기가 결제를 계속 진행할 수 있음.' },
  { keyword: '충전독', description: '영업 중 충전독 접촉/분리 시 통신 불량 발생하여 결제 불일치 가능.' },
  { keyword: '접속 타임아웃', description: 'POS에서 단말기로 연결을 시도했으나 응답이 없어 타임아웃 발생.' },
  { keyword: '접속 실패', description: 'POS에서 단말기로 연결을 시도했으나 실패. 네트워크 장애가 원인일 수 있음.' },
  { keyword: '중복 결제 의심', description: '직전 거래 조회 결과 중복결제가 의심되는 상태. 매장에서 임의등록 또는 결제 중단을 선택.' },
  { keyword: '사용자 취소', description: '매장에서 결제 진행 중 취소 버튼을 눌러 승인을 중단함.' },
  { keyword: '마지막 승인 응답실패', description: '직전거래 조회 후 마지막 승인 데이터 수신에 실패하여 접속을 해제.' },
  { keyword: '단말기 사용 불가', description: '단말기가 사용 불가 상태여서 결제 요청 자체가 스킵됨.' },
]

function getDiscrepancyDescription(type: string): string | null {
  for (const { keyword, description } of DISCREPANCY_DESCRIPTIONS) {
    if (type.includes(keyword)) return description
  }
  return null
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1 bg-[#16213e] rounded-lg p-3 text-center">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="font-bold text-lg mt-1" style={{ color }}>{value}</div>
    </div>
  )
}

export function AnalysisSummary({ result }: AnalysisSummaryProps) {
  const discrepancyColor = result.errorPoints.length > 0 ? '#e94560' : '#4ade80'

  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
        <span className="font-bold">분석 요약</span>
      </div>
      <div className="flex gap-3 flex-wrap">
        <SummaryCard label="POS 유형" value={result.posType} color="#00d2ff" />
        <SummaryCard label="단말기" value={result.terminal} color="#00d2ff" />
        <div className="flex-1 bg-[#16213e] rounded-lg p-3 text-center">
          <div className="text-gray-500 text-xs">불일치 유형</div>
          <div className="font-bold text-lg mt-1 flex items-center justify-center" style={{ color: discrepancyColor }}>
            {result.discrepancyType}
            {getDiscrepancyDescription(result.discrepancyType) && (
              <EventTooltip description={getDiscrepancyDescription(result.discrepancyType)!} />
            )}
          </div>
        </div>
        <SummaryCard label="결제 시도" value={`${result.attempts?.length ?? '-'}회`} color="#ffd700" />
        <SummaryCard
          label="VAN 실 승인"
          value={`${result.actualApprovalCount ?? '-'}건`}
          color={result.isDuplicatePaymentSuspected ? '#e94560' : '#4ade80'}
        />
        <SummaryCard
          label="ptxId"
          value={result.ptxId ? `${result.ptxId.slice(0, 18)}...` : '—'}
          color="#ffd700"
        />
      </div>
    </section>
  )
}
