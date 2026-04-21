function SectionTitle({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">{number}</span>
      <span className="font-bold text-lg">{title}</span>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[#16213e] border border-[#0f3460] rounded-lg p-4 ${className}`}>{children}</div>
}

/* ─── 1. 통신 흐름 ─── */
const FLOW_STEPS = [
  { from: 'POS', to: '단말기', label: '연결 요청', arrow: '→', subArrow: '', subTo: '' },
  { from: 'POS', to: '단말기', label: '연결 성공', arrow: '←', subArrow: '', subTo: '' },
  { from: 'POS', to: '단말기', label: '직전 거래 데이터 요청 (중복 결제 체크용)', arrow: '→', subArrow: '', subTo: '' },
  { from: 'POS', to: '단말기', label: '직전 거래 데이터 응답', arrow: '←', subArrow: '', subTo: '' },
  { from: 'POS', to: '', label: '중복 결제 확인 (ptxId 비교)', arrow: '', subArrow: '', subTo: '' },
  { from: 'POS', to: '단말기', label: '카드 결제 승인 요청', arrow: '→', subArrow: '', subTo: '' },
  { from: '', to: '단말기', label: '승인 요청', arrow: '', subArrow: '→', subTo: 'VAN' },
  { from: '', to: '단말기', label: '승인 응답', arrow: '', subArrow: '←', subTo: 'VAN' },
  { from: 'POS', to: '단말기', label: '승인 결과 응답', arrow: '←', subArrow: '', subTo: '' },
]

function CommunicationFlow() {
  return (
    <div className="flex flex-col gap-1.5">
      {FLOW_STEPS.map((step, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-5 h-5 rounded-full bg-[#0f3460] text-gray-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
          <span className="text-[#00d2ff] w-14 text-center shrink-0">{step.from}</span>
          <span className="text-gray-500 w-4 text-center">{step.arrow}</span>
          <span className="text-[#ffd700] w-14 text-center shrink-0">{step.to}</span>
          <span className="text-gray-500 w-4 text-center shrink-0">{step.subArrow}</span>
          <span className="text-[#a78bfa] w-10 text-center shrink-0">{step.subTo}</span>
          <span className="text-gray-300">{step.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── 2. 불일치 유형 ─── */
const DISCREPANCY_TYPES: { title: string; severity: 'high' | 'medium' | 'low'; description: string; logHint: string }[] = [
  { title: '타이머 만료', severity: 'high', description: 'POS에서 승인 요청 후 3초 내 응답이 없어 접속을 종료. 단말기가 VAN과 단독 승인을 완료하면 불일치 발생.', logHint: '타이머 3초 미응답으로 접속 종료' },
  { title: '단말기 수신 불가 (9999)', severity: 'high', description: '단말기가 이전 요청 처리 중이거나 결제 진입 불가 상태. POS는 실패로 처리하지만 단말기가 단독 결제를 진행할 수 있음.', logHint: 'res: 9999, Transaction Skipped! NOT AVAILABLE' },
  { title: 'PtxID 불일치 (동기화 실패)', severity: 'high', description: '이전 결제가 비정상 종료된 후 직전 거래의 ptxId와 현재 ptxId가 달라 동기화 실패.', logHint: '승인정보 동기화 실패 (PtxID 불일치)' },
  { title: 'EOT 비정상', severity: 'high', description: '단말기에서 결제 성공했으나 POS와의 정상 종료 절차(EOT)가 완료되지 않음. 단말기 자체 영수증 출력.', logHint: 'ResultActivity: [!] EOT ABNORMAL | Print itself' },
  { title: 'VAN 통신 타임아웃', severity: 'high', description: 'VAN사와의 네트워크 통신이 타임아웃. 매장 네트워크 장애가 원인이며 결제 자체가 실패.', logHint: 'SocketTimeoutException' },
  { title: '강제 취소 타임아웃 (9989)', severity: 'high', description: 'VAN 통신 불가 상태에서 강제 취소 요청도 타임아웃. 네트워크 장애 지속 중.', logHint: 'res: 9989, CARD_FORCE_CANCEL' },
  { title: '프린터 오류 (9959)', severity: 'medium', description: '단말기 프린터 오류. 매장에서 결제가 안 된 것으로 오인하여 재시도할 수 있음.', logHint: 'res: 9959' },
  { title: '충전독 접촉/분리', severity: 'medium', description: '영업 중 충전독에 접촉/분리 시 통신 불량 발생하여 결제 불일치 가능.', logHint: 'ChargingStatusReceiver: ACTION_POWER_DISCONNECTED' },
  { title: 'IC카드 리딩 실패 (CX01/CX06)', severity: 'low', description: 'IC칩 읽기 실패. MSR 모드로 전환하거나 재시도. 보통 여러 번 실패 후 성공하며 중복결제와 무관.', logHint: 'FAIL | ICC CARD READ | code: CX01 또는 CX06' },
]

const SEVERITY_COLORS = {
  high: { bg: 'border-l-[#e94560]', badge: 'bg-[#e94560]', label: '높음' },
  medium: { bg: 'border-l-[#ffd700]', badge: 'bg-[#ffd700] text-black', label: '보통' },
  low: { bg: 'border-l-[#4ade80]', badge: 'bg-[#4ade80] text-black', label: '낮음' },
}

function DiscrepancyCard({ type }: { type: typeof DISCREPANCY_TYPES[number] }) {
  const severity = SEVERITY_COLORS[type.severity]
  return (
    <div className={`bg-[#16213e] border border-[#0f3460] border-l-4 ${severity.bg} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-white text-sm">{type.title}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${severity.badge}`}>{severity.label}</span>
      </div>
      <p className="text-gray-400 text-xs mb-2">{type.description}</p>
      <code className="text-[#00d2ff] bg-[#0a0a1a] px-2 py-1 rounded text-[10px] block">{type.logHint}</code>
    </div>
  )
}

/* ─── 3. 응답코드 ─── */
const RESPONSE_CODES: { code: string; meaning: string; severity: string; color: string }[] = [
  { code: '0000', meaning: '정상 승인', severity: '성공', color: '#4ade80' },
  { code: '9999', meaning: '단말기 수신 불가 / 이전 요청 처리 중', severity: '실패', color: '#e94560' },
  { code: '9989', meaning: '강제 취소 타임아웃 (VAN 통신 불가)', severity: '실패', color: '#e94560' },
  { code: 'CE106', meaning: '승인정보 동기화 실패 (PtxID 불일치)', severity: '불일치', color: '#f97316' },
  { code: 'CE107', meaning: '기타 포스 결제데이터 불일치', severity: '불일치', color: '#f97316' },
  { code: '9959', meaning: '프린터 오류', severity: '경고', color: '#ffd700' },
  { code: 'CX01', meaning: 'IC카드 리딩 실패', severity: '경고', color: '#ffd700' },
  { code: 'CX06', meaning: 'IC카드 리딩 실패 (삼성페이 등)', severity: '경고', color: '#ffd700' },
]

/* ─── 4. 결론 판단 ─── */
const CONCLUSION_RULES: { approvals: string; conclusion: string; color: string }[] = [
  { approvals: '0건', conclusion: '중복 결제 아님 (승인 자체가 안 됨)', color: '#4ade80' },
  { approvals: '1건', conclusion: '중복 결제 아님 (정상)', color: '#4ade80' },
  { approvals: '2건 이상', conclusion: '중복 결제 의심 — UBMS 확인 필요', color: '#e94560' },
]

/* ─── 5. 이벤트 사전 ─── */
const EVENT_CATEGORIES: { category: string; items: { keyword: string; description: string }[] }[] = [
  {
    category: '에러/장애',
    items: [
      { keyword: '단말기 수신 불가 (9999)', description: '단말기가 이전 요청을 처리 중이거나 결제 진입이 불가한 상태.' },
      { keyword: '타이머 만료', description: 'POS에서 승인 요청 후 3초 내 응답이 없어 접속 종료.' },
      { keyword: 'PtxID 불일치 (동기화 실패)', description: '직전 거래와 현재 거래의 ptxId가 달라 동기화 실패.' },
      { keyword: 'EOT 비정상 종료', description: '정상 종료 절차 없이 단말기가 자체 영수증 출력.' },
      { keyword: 'VAN 통신 타임아웃', description: 'VAN사와의 네트워크 통신 타임아웃.' },
      { keyword: '강제 취소 타임아웃 (9989)', description: 'VAN 통신 불가 상태에서 강제 취소도 실패.' },
      { keyword: '승인 중단 실패', description: '취소 요청을 보냈으나 단말기가 거절.' },
      { keyword: 'IC카드 리딩 실패 (CX01/CX06)', description: 'IC칩 읽기 실패. MSR 모드 전환으로 재시도.' },
      { keyword: '프린터 오류 (9959)', description: '단말기 프린터 오류.' },
    ],
  },
  {
    category: '결제 흐름',
    items: [
      { keyword: '단말기 연결 요청', description: 'POS에서 단말기로 결제 연결 시작.' },
      { keyword: '직전거래 조회', description: '중복 결제 방지를 위해 단말기의 마지막 거래 ptxId 조회.' },
      { keyword: '승인 요청', description: 'POS에서 단말기에 카드 결제 승인 요청.' },
      { keyword: 'VAN사에 승인 요청', description: '단말기가 VAN에 카드 승인 요청. 실제 결제가 시작되는 시점.' },
      { keyword: 'VAN사 승인 응답', description: 'VAN사로부터 승인 결과 수신.' },
      { keyword: '카드 리딩 시작', description: '단말기에서 카드 읽기 시작. IC/비접촉/MSR 모드.' },
      { keyword: '카드 리딩 성공', description: '카드 정보 읽기 성공. VAN 승인 요청 진행.' },
    ],
  },
  {
    category: '중복결제 관련',
    items: [
      { keyword: '중복 결제 의심', description: '직전 거래 조회 결과 중복결제가 의심되는 상태.' },
      { keyword: '임의등록', description: '매장에서 중복결제 경고 팝업에 "확인(임의등록)" 선택.' },
      { keyword: '알고있는 승인내역', description: '이미 POS가 인지하고 있는 결제 건. 정상.' },
      { keyword: '승인금액 다름', description: '직전 거래와 금액이 달라 다른 결제 건으로 판단.' },
      { keyword: '사용자 취소', description: '매장에서 결제 중 취소 버튼을 눌러 승인 중단.' },
    ],
  },
]

/* ─── 6. 용어 ─── */
const GLOSSARY: { term: string; description: string }[] = [
  { term: 'ptxId (eximbayPtxId)', description: 'Eximbay 단말기 거래 고유 ID. BPOS-/CPOS-/APOS- UUID 형식.' },
  { term: 'VAN', description: '결제 대행사. 단말기가 VAN과 직접 통신하여 카드 승인을 처리.' },
  { term: 'EOT', description: 'End of Transaction. 거래 종료 절차. 비정상이면 단말기가 자체 영수증 출력.' },
  { term: '직전 거래 조회', description: '중복 결제 방지를 위해 이전 거래의 ptxId를 조회하는 과정.' },
  { term: '임의등록', description: '중복 결제 의심 팝업에서 매장이 수동으로 결제를 확정 처리하는 것.' },
  { term: 'UBMS', description: '결제내역 관리 시스템. 중복결제 의심 시 금액/카드번호/결제자를 확인하는 데 사용.' },
  { term: 'Eximbay', description: '결제 단말기 제조사. T650P 모델을 사용. 직전 거래 조회 및 중복 결제 체크 기능 지원.' },
  { term: 'BPOS / CPOS (iOS)', description: 'iOS 기반 POS 시스템. 엑셀의 detailLog(텍스트 로그) 필드에 상세 로그가 기록됨.' },
  { term: 'APOS (Android)', description: '안드로이드 기반 POS 시스템. 엑셀 각 행이 하나의 이벤트로 구조화되어 있고, raw.response에 resultCode/resultMessage가 담김.' },
  { term: '결제 시도 그룹화', description: '로그를 N차 결제 시도로 묶어 분석. iOS는 "단말기 연결 요청", 안드로이드는 두 번째 "카드 결제 승인 클릭"이 새 시도 시작점.' },
]


/* ─── 메인 ─── */
export function GuidePage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">결제 불일치 분석 가이드</h1>
        <p className="text-gray-400 text-sm">BPOS/CPOS(iOS), APOS(Android) ↔ Eximbay 단말기 간 결제 불일치 발생 시 원인을 파악하기 위한 참고 자료입니다.</p>
      </div>

      {/* 1. 통신 흐름 */}
      <section className="mb-10">
        <SectionTitle number={1} title="POS ↔ 단말기 통신 흐름" />
        <Card>
          <CommunicationFlow />
        </Card>
      </section>

      {/* 2. 불일치 유형 */}
      <section className="mb-10">
        <SectionTitle number={2} title="주요 불일치 유형" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DISCREPANCY_TYPES.map((type) => (
            <DiscrepancyCard key={type.title} type={type} />
          ))}
        </div>
      </section>

      {/* 3. 응답코드 */}
      <section className="mb-10">
        <SectionTitle number={3} title="응답코드 참조" />
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#0f3460]">
                <th className="text-left p-2 text-gray-400 w-20">코드</th>
                <th className="text-left p-2 text-gray-400">의미</th>
                <th className="text-left p-2 text-gray-400 w-16">심각도</th>
              </tr>
            </thead>
            <tbody>
              {RESPONSE_CODES.map((rc) => (
                <tr key={rc.code} className="border-b border-[#0f3460]/50">
                  <td className="p-2 font-mono font-bold" style={{ color: rc.color }}>{rc.code}</td>
                  <td className="p-2 text-gray-300">{rc.meaning}</td>
                  <td className="p-2 text-xs" style={{ color: rc.color }}>{rc.severity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      {/* 4. 결론 판단 */}
      <section className="mb-10">
        <SectionTitle number={4} title="결론 판단 기준" />
        <Card>
          <p className="text-gray-400 text-xs mb-3">VAN 실 승인 수(0000 응답 건수)를 기반으로 중복결제 여부를 판정합니다.</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#0f3460]">
                <th className="text-left p-2 text-gray-400 w-24">실 승인</th>
                <th className="text-left p-2 text-gray-400">결론</th>
              </tr>
            </thead>
            <tbody>
              {CONCLUSION_RULES.map((rule) => (
                <tr key={rule.approvals} className="border-b border-[#0f3460]/50">
                  <td className="p-2 font-bold" style={{ color: rule.color }}>{rule.approvals}</td>
                  <td className="p-2 text-gray-300">{rule.conclusion}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-gray-500 text-xs mt-3">48건의 실제 분석 사례 중 90% 이상이 "중복 결제 아님"으로 결론.</p>
        </Card>
      </section>

      {/* 5. 이벤트 사전 */}
      <section className="mb-10">
        <SectionTitle number={5} title="이벤트 설명 사전" />
        <div className="flex flex-col gap-4">
          {EVENT_CATEGORIES.map((cat) => (
            <Card key={cat.category}>
              <h3 className="text-[#00d2ff] font-bold text-sm mb-3">{cat.category}</h3>
              <div className="flex flex-col gap-2">
                {cat.items.map((item) => (
                  <div key={item.keyword} className="flex items-start gap-2 text-xs">
                    <span className="text-white font-bold shrink-0 w-52">{item.keyword}</span>
                    <span className="text-gray-400">{item.description}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. 용어 */}
      <section className="mb-10">
        <SectionTitle number={6} title="핵심 용어" />
        <Card>
          <div className="flex flex-col gap-2">
            {GLOSSARY.map((g) => (
              <div key={g.term} className="flex gap-3 text-sm border-b border-[#0f3460]/30 pb-2 last:border-0">
                <span className="text-[#ffd700] font-bold shrink-0 w-44">{g.term}</span>
                <span className="text-gray-400">{g.description}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

    </div>
  )
}
