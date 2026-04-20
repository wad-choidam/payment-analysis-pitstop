import type { LogEntry } from '../types'

interface TerminalRule {
  pattern: RegExp;
  event: string | ((match: RegExpMatchArray) => string);
  status: LogEntry['status'];
  ptxId?: (match: RegExpMatchArray) => string | undefined;
}

const RULES: TerminalRule[] = [
  // 연결
  {
    pattern: /AgentSocketServer: CLIENT IP\/([\d.]+)/,
    event: (m) => `POS 연결 요청 수신 (${m[1]})`,
    status: 'info',
  },
  {
    pattern: /Server: Server Start \| IP: ([\d.]+)/,
    event: (m) => `단말기 서버 시작 (${m[1]})`,
    status: 'info',
  },

  // 직전거래 조회
  {
    pattern: /<REQUEST>: \[POS -> T650P\] INQUIRY_LATEST_TRANSACTION\(990001\)/,
    event: '직전거래 조회 수신',
    status: 'info',
  },

  // 카드 승인 요청 (ptxId 추출)
  {
    pattern: /\[CARD_APPROVAL\] ([A-Z]POS-[0-9a-f-]+)/,
    event: '승인 요청 수신',
    status: 'info',
    ptxId: (m) => m[1],
  },
  {
    pattern: /<REQUEST>: \[POS -> T650P\] CARD_APPROVAL\(\d+\)/,
    event: '카드 승인 요청 수신',
    status: 'info',
  },

  // VAN 통신
  {
    pattern: /<REQUEST>: \[T650P -> VAN\] CARD_APPROVAL/,
    event: 'VAN사에 승인 요청',
    status: 'info',
  },
  {
    pattern: /<RESPONSE>: \[VAN -> T650P\] CARD_APPROVAL/,
    event: 'VAN사 승인 응답',
    status: 'info',
  },
  {
    pattern: /<REQUEST>: \[T650P -> VAN\] SEARCH_LATEST_TX/,
    event: 'VAN사에 직전거래 조회',
    status: 'info',
  },
  {
    pattern: /<RESPONSE>: \[VAN -> T650P\] SEARCH_LATEST_TX/,
    event: 'VAN사 직전거래 응답',
    status: 'info',
  },

  // POS 응답 (순서 중요: 0000 → 9999 → 기타)
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: CARD_APPROVAL\(\d+\) \| res: 0000/,
    event: '승인 성공 응답',
    status: 'success',
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: CARD_APPROVAL\(\d+\) \| res: 9999/,
    event: '단말기 수신 불가 응답 (9999)',
    status: 'failure',
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: CARD_APPROVAL\(\d+\) \| res: (\d{4})/,
    event: (m) => `승인 실패 응답 (${m[1]})`,
    status: 'failure',
  },

  // 응답 수신 확인
  {
    pattern: /<REQUEST>: \[POS -> T650P\] AGENT_CHECK_RESPONSE_RECEIVE\(980001\)/,
    event: 'POS 응답 수신 확인 요청',
    status: 'info',
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: AGENT_CHECK_RESPONSE_RECEIVE\(980001\) \| res: 0000/,
    event: 'POS 응답 수신 확인 완료',
    status: 'success',
  },

  // 인쇄
  {
    pattern: /<REQUEST>: \[POS -> T650P\] AGENT_PRINT\(900091\)/,
    event: '영수증 인쇄 요청',
    status: 'info',
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: AGENT_PRINT\(900091\) \| res: 0000/,
    event: '영수증 인쇄 완료',
    status: 'success',
  },

  // 카드 리더
  {
    pattern: /CardReaderPresenter: READ START \| mode: (\w+)/,
    event: (m) => `카드 리딩 시작 (${m[1]})`,
    status: 'info',
  },
  {
    pattern: /CardReaderPresenter: CT Scan Success/,
    event: '카드 리딩 성공',
    status: 'success',
  },
  {
    pattern: /CardReaderActivity: \[\*\] Block BackPressed \| payment ongoing/,
    event: '뒤로가기 차단 (결제 진행중)',
    status: 'warning',
  },

  // 결제 처리
  {
    pattern: /CardController: \[\*\] CARD PAYMENT \| ptxid: ([A-Z]POS-[0-9a-f-]+)/,
    event: '카드 결제 처리',
    status: 'info',
    ptxId: (m) => m[1],
  },
  {
    pattern: /CardController: CARD PAYMENT COMPLETE/,
    event: '카드 결제 완료',
    status: 'success',
  },

  // 트랜잭션 스킵
  {
    pattern: /AgentController: \[\*\] \[CARD_APPROVAL\] Transaction Skipped! NOT AVAILABLE/,
    event: '트랜잭션 스킵 (단말기 사용 불가)',
    status: 'failure',
  },

  // 업로드
  {
    pattern: /CatchPosAPI::\[Success\] Upload Transaction/,
    event: 'POS 서버 업로드 성공',
    status: 'success',
  },
  {
    pattern: /CatchPosAPI: Request Upload/,
    event: 'POS 서버 업로드 요청',
    status: 'info',
  },

  // EOT (End of Transaction)
  {
    pattern: /ResultActivity: \[!\] EOT ABNORMAL/,
    event: 'EOT 비정상 종료 (결제 불일치 가능)',
    status: 'failure',
  },
  {
    pattern: /ResultActivity: EOT::Receive eot request/,
    event: 'EOT 정상 수신',
    status: 'success',
  },

  // 충전독
  {
    pattern: /ChargingStatusReceiver: ACTION_POWER_DISCONNECTED/,
    event: '충전독 분리 (불일치 원인 가능)',
    status: 'warning',
  },
  {
    pattern: /ChargingStatusReceiver: ACTION_POWER_CONNECTED/,
    event: '충전독 연결',
    status: 'warning',
  },
  {
    pattern: /ChargingStatusReceiver/,
    event: '충전독 이벤트 (불일치 원인 가능)',
    status: 'warning',
  },

  // 앱 상태
  {
    pattern: /PDM: CLEAR ALL/,
    event: '단말기 데이터 초기화',
    status: 'info',
  },
]

const TIME_PATTERN = /(?:\[\d+\.\d+\.\d+\]\s+)?(\d{4}-\d{2}-\d{2}\s+)?(\d{2}:\d{2}:\d{2})[\d.:]*\s+(.*)/

// 노이즈 패턴 — 분석에 불필요한 로그
const NOISE_PATTERNS = [
  /^EximPay:/,
  /^FBU:/,
  /^CardReaderActivity: (onCreate|onResume|onPause|onDestroy|REQUIRE SIGN DATA)$/,
  /^PaymentActivity: (onCreate|onPause|onDestroy)$/,
  /^ResultActivity: (onResume|onDestroy)$/,
  /^CardReaderPresenter: READ START/,  // 별도 룰로 처리
  /^SdiContact:/,
  /^TransactionManager:/,
  /^CardController\/CARD_PAYMENT: CLEAR CARD DATA/,
  /^AgentController: Export/,
  /^AgentController: command: SYN-ACK/,
  /^KrwPriceActivity:/,
  /^SearchLatestActivity:/,
  /^SearchLatestPresenter:/,
  /^ip:/,
  /^trsAmt:/,
  /^updateRequired:/,
  /^={3,}/,
]

export function parseTerminalLog(raw: string): LogEntry[] {
  if (!raw.trim()) return []

  const lines = raw.split('\n').filter(l => l.trim())
  const entries: LogEntry[] = []

  // CARD_APPROVAL ptxId가 별도 줄에 있는 경우를 미리 수집
  const ptxIdPattern = /\[CARD_APPROVAL\]\s+([A-Z]POS-[0-9a-f-]+)/
  const standalonePtxIds: string[] = []
  for (const line of lines) {
    const m = line.match(ptxIdPattern)
    if (m && !line.match(TIME_PATTERN)) {
      standalonePtxIds.push(m[1])
    }
  }
  let ptxIdIndex = 0

  for (const line of lines) {
    const timeMatch = line.match(TIME_PATTERN)
    if (!timeMatch) continue

    const timestamp = timeMatch[2]
    const content = timeMatch[3].trim()

    if (!content) continue

    // 노이즈 필터링
    if (NOISE_PATTERNS.some(p => p.test(content))) continue

    let matched = false
    for (const rule of RULES) {
      const m = content.match(rule.pattern)
      if (m) {
        const event = typeof rule.event === 'function' ? rule.event(m) : rule.event
        let ptxId = rule.ptxId?.(m)
        // 카드 승인 요청인데 ptxId가 없으면 standalone에서 가져옴
        if (!ptxId && event === '카드 승인 요청 수신' && ptxIdIndex < standalonePtxIds.length) {
          ptxId = standalonePtxIds[ptxIdIndex++]
        }
        entries.push({
          timestamp,
          source: 'TERMINAL',
          event,
          rawLog: line.trim(),
          status: rule.status,
          ptxId,
        })
        matched = true
        break
      }
    }

    if (!matched) {
      entries.push({
        timestamp,
        source: 'TERMINAL',
        event: content,
        rawLog: line.trim(),
        status: 'info',
      })
    }
  }

  return entries
}
