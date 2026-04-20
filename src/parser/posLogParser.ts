import type { LogEntry } from '../types'

interface PatternRule {
  pattern: RegExp;
  event: string | ((match: RegExpMatchArray) => string);
  status: LogEntry['status'];
  ptxId?: (match: RegExpMatchArray) => string | undefined;
}

const RULES: PatternRule[] = [
  // 연결
  {
    pattern: /\[전송\] 승인 접속 시도/,
    event: '단말기 연결 요청',
    status: 'info',
  },
  {
    pattern: /\[수신\] 단말기 접속 성공/,
    event: '연결 성공',
    status: 'success',
  },
  {
    pattern: /\[전송\] 단말기 접속 해제 시도/,
    event: '단말기 접속 해제 시도',
    status: 'warning',
  },
  {
    pattern: /\[수신\] 단말기 접속 해제 - (.+)/,
    event: (m) => `단말기 접속 해제 (${m[1]})`,
    status: 'failure',
  },
  {
    pattern: /\[수신\] 단말기 접속 해제/,
    event: '단말기 접속 해제',
    status: 'info',
  },

  // 직전거래 조회
  {
    pattern: /\[전송\] 직전 거래 데이터 요청/,
    event: '직전거래 조회 요청',
    status: 'info',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - ([A-Z]POS-[0-9a-f-]+), 결제 성공/,
    event: '직전거래 응답 (성공)',
    status: 'success',
    ptxId: (m) => m[1],
  },

  // 중복결제 확인
  {
    pattern: /중복결제 확인 결과 '중복결제 의심'/,
    event: '중복 결제 의심',
    status: 'warning',
  },
  {
    pattern: /중복결제 확인 결과 '알고있는 승인내역'/,
    event: '중복 결제 확인: 알고있는 승인내역',
    status: 'success',
  },
  {
    pattern: /중복결제 확인 결과 '승인금액 다름'/,
    event: '중복 결제 확인: 승인금액 다름',
    status: 'warning',
  },
  {
    pattern: /중복결제 확인 결과/,
    event: (m) => `중복 결제 확인: ${m[0]}`,
    status: 'warning',
  },
  {
    pattern: /중복결제 확인시 응답실패 - 그래도 결제 진행/,
    event: '중복결제 확인 응답실패 - 결제 계속 진행',
    status: 'warning',
  },
  {
    pattern: /중복결제 경고 팝업 '확인\(임의등록\)' 클릭/,
    event: '중복결제 경고 팝업 → 임의등록 선택',
    status: 'warning',
  },

  // 승인 요청
  {
    pattern: /\[전송\] 카드 결제승인 요청 전문 전송 - ([A-Z]POS-[0-9a-f-]+)/,
    event: '승인 요청',
    status: 'info',
    ptxId: (m) => m[1],
  },

  // 승인 중단
  {
    pattern: /\[전송\] 승인 중단 요청 전문 전송/,
    event: '승인 중단 요청 전송',
    status: 'warning',
  },
  {
    pattern: /승인 중단 요청 실패 - 이전요청에 대한 응답 대기중/,
    event: '승인 중단 실패 (응답 대기중)',
    status: 'failure',
  },
  {
    pattern: /승인 중단 요청$/,
    event: '승인 중단 요청',
    status: 'warning',
  },
  {
    pattern: /\[수신\] 승인 중단 성공/,
    event: '중단 성공',
    status: 'success',
  },
  {
    pattern: /\[수신\] 승인 중단 실패\s*\(([^)]+)\)/,
    event: (m) => `중단 실패 (${m[1]})`,
    status: 'failure',
  },

  // 승인 결과
  {
    pattern: /\[수신\] 승인 전문 수신 - , 사용자 취소/,
    event: '사용자 취소',
    status: 'warning',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - , 단말기가 수신 가능한 상태가 아님/,
    event: '단말기 수신 불가',
    status: 'failure',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - .+성공/,
    event: '승인 성공',
    status: 'success',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - , $/,
    event: '승인 응답 (빈 응답)',
    status: 'failure',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - ,\s*$/,
    event: '승인 응답 (빈 응답)',
    status: 'failure',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - .+실패/,
    event: '승인 실패',
    status: 'failure',
  },
  {
    pattern: /\[전송\] 단말기 정상 승인 수신 응답 전송/,
    event: '승인 수신 확인 응답',
    status: 'success',
  },

  // 타이머
  {
    pattern: /\[동작\] 타이머 마지막승인요청 - 3초 미응답/,
    event: '타이머 만료 (직전거래 3초 미응답)',
    status: 'failure',
  },
  {
    pattern: /\[동작\] 타이머 3초 미응답으로 접속 종료/,
    event: '타이머 만료 (3초 미응답 접속 종료)',
    status: 'failure',
  },
  {
    pattern: /타이머 3초 미응답으로 접속 종료/,
    event: '타이머 만료',
    status: 'failure',
  },
  {
    pattern: /마지막 승인데이터 요청에 대한 응답실패 - 접속 해제/,
    event: '마지막 승인 응답실패 → 접속 해제',
    status: 'failure',
  },

  // 승인정보 동기화
  {
    pattern: /\[전송\] 승인정보 동기화 접속 시도/,
    event: '승인정보 동기화 접속 시도',
    status: 'info',
  },
  {
    pattern: /승인정보 동기화 접속 성공 및 PtxID 비교 ([A-Z]POS-[0-9a-f-]+) ([A-Z]POS-[0-9a-f-]+)/,
    event: (m) => `승인정보 동기화: ptxId 비교 (${m[1].slice(0, 12)}... vs ${m[2].slice(0, 12)}...)`,
    status: 'warning',
  },
  {
    pattern: /승인정보 동기화 실패 \(PtxID 불일치\)/,
    event: '승인정보 동기화 실패 (PtxID 불일치)',
    status: 'failure',
  },

  // 최종결론
  {
    pattern: /최종결론: (.+)/,
    event: (m) => `최종결론: ${m[1].replace(/["',].*$/, '').trim()}`,
    status: 'info',
  },

  // 승인 실패 (단독)
  {
    pattern: /^승인 실패$/,
    event: '승인 실패',
    status: 'failure',
  },
]

// 실제 로그: #HH:mm:ss.SSS 또는 #{HH:mm:ss}
const TIME_PATTERN = /#\{?(\d{2}:\d{2}:\d{2})[.\d]*\}?\s*(.*)/

export function parsePosLog(raw: string): LogEntry[] {
  if (!raw.trim()) return []

  // detailLog JSON 내부의 로그도 처리할 수 있도록 전처리
  const normalized = raw
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, ' ')

  const lines = normalized.split('\n').filter(l => l.trim())
  const entries: LogEntry[] = []

  for (const line of lines) {
    const timeMatch = line.match(TIME_PATTERN)
    if (!timeMatch) continue

    const timestamp = timeMatch[1]
    const content = timeMatch[2].trim()

    if (!content) continue

    // 타이머 설정/종료 내부 로그는 스킵 (노이즈)
    if (/^\[시도\] 타이머 (설정|종료)/.test(content)) continue
    if (/^\[확인\] 타이머 설정/.test(content)) continue
    if (/^\[동작\] 타이머 (설정|종료) - (마지막승인요청|승인 및 취소 승인)$/.test(content)) continue
    if (/^타이머 종료 - 결제 승인 접속시도 전 리셋$/.test(content)) continue
    if (/^타이머 종료 시도 - 타이머 없음/.test(content)) continue
    if (/^\[시도\] 타이머 실행$/.test(content)) continue

    let matched = false
    for (const rule of RULES) {
      const m = content.match(rule.pattern)
      if (m) {
        const event = typeof rule.event === 'function' ? rule.event(m) : rule.event
        entries.push({
          timestamp,
          source: 'POS',
          event,
          rawLog: line.trim(),
          status: rule.status,
          ptxId: rule.ptxId?.(m),
        })
        matched = true
        break
      }
    }

    if (!matched) {
      entries.push({
        timestamp,
        source: 'POS',
        event: content,
        rawLog: line.trim(),
        status: 'info',
      })
    }
  }

  return entries
}
