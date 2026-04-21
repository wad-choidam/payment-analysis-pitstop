import type { LogEntry, LogStatus } from '../types'

/**
 * 안드로이드(APOS) 결제 불일치 엑셀 한 행의 구조.
 * raw 필드 안의 중첩 JSON에 실제 응답(response), data2(이벤트명), data3(ptxId) 등이 들어있다.
 */
export interface AndroidExcelRow {
  regDateTime?: string
  eventName?: string
  serviceType?: string
  deviceUuid?: string
  osType?: string
  eventDateTime?: string
  data1?: string
  data2?: string
  data3?: string
  raw?: string
}

interface AndroidRawInner {
  data1?: string
  data2?: string
  data3?: string
  response?: string
}

interface AndroidResponse {
  resultCode?: string
  resultMessage?: string
  data?: {
    ptxid?: string
    approvalAmt?: number
    approvalNo?: string
    transactionDate?: string
    transactionNo?: string
    [k: string]: unknown
  }
}

/**
 * 안드로이드 이벤트는 iOS와 달리 엑셀 각 행이 구조화된 이벤트다.
 * 포스 측 동작이므로 source='POS'로 통일한다.
 * data2(이벤트명), data3(ptxId), raw.response(resultCode/resultMessage)로 LogEntry를 만든다.
 */
export function parseAndroidExcelRows(rows: AndroidExcelRow[]): LogEntry[] {
  const entries: LogEntry[] = []
  for (const row of rows) {
    const inner = parseInnerRaw(row.raw)
    const data2 = inner?.data2 ?? row.data2 ?? ''
    const data3 = inner?.data3 ?? row.data3 ?? ''
    const responseStr = inner?.response
    const parsedResponse = parseResponse(responseStr)

    const ptxIdFromData3 = data3 && data3 !== 'NULL' && data3 !== '' ? data3 : undefined
    const ptxIdFromResponse = parsedResponse?.data?.ptxid
    const ptxId = ptxIdFromData3 ?? ptxIdFromResponse

    const { event, status } = mapEvent(data2, parsedResponse)
    const timestamp = toShortTimestamp(row.eventDateTime ?? row.regDateTime ?? '')

    entries.push({
      timestamp,
      source: 'POS',
      event,
      rawLog: buildRawLog(timestamp, data2, ptxId, parsedResponse),
      status,
      ptxId,
      resultCode: parsedResponse?.resultCode,
      resultMessage: parsedResponse?.resultMessage?.trim(),
    })
  }
  return entries
}

function parseInnerRaw(rawStr: string | undefined): AndroidRawInner | undefined {
  if (!rawStr) return undefined
  try {
    const parsed = JSON.parse(rawStr)
    const inner = parsed?.raw
    if (inner && typeof inner === 'object') return inner as AndroidRawInner
  } catch {
    // ignore
  }
  return undefined
}

function parseResponse(responseStr: string | undefined): AndroidResponse | undefined {
  if (!responseStr) return undefined
  try {
    return JSON.parse(responseStr) as AndroidResponse
  } catch {
    return undefined
  }
}

/**
 * data2(이벤트명) + 응답의 resultCode에 따라 이벤트명과 상태를 결정한다.
 * 응답이 있는 이벤트는 resultCode=0000을 성공, 9999를 단말기 수신 불가(failure), 그 외는 failure로 판정.
 */
function mapEvent(data2: string, response: AndroidResponse | undefined): { event: string; status: LogStatus } {
  const trimmed = data2.trim()
  const resultCode = response?.resultCode
  const resultMessage = response?.resultMessage?.trim()

  switch (trimmed) {
    case '카드 결제 승인 클릭':
      return { event: '승인 요청', status: 'info' }
    case '카드 리딩 요청':
      return { event: '카드 리딩 요청', status: 'info' }
    case '카드 데이터 응답':
      return classifyCardResponse(resultCode, resultMessage)
    case '이전 카드 데이터 클릭':
      return { event: '직전거래 조회 클릭', status: 'info' }
    case '이전 카드 데이터 요청':
      return { event: '직전거래 조회 요청', status: 'info' }
    case '이전 카드 데이터 응답':
      return classifyPreviousResponse(resultCode, resultMessage)
    default:
      return { event: trimmed || '알 수 없는 이벤트', status: 'info' }
  }
}

function classifyCardResponse(code: string | undefined, message: string | undefined): { event: string; status: LogStatus } {
  if (code === '0000') return { event: '승인 성공', status: 'success' }
  if (code === '9999') return { event: '단말기 수신 불가 (9999)', status: 'failure' }
  if (message?.includes('사용자 취소')) return { event: '사용자 취소', status: 'warning' }
  if (message?.includes('타이머') || message?.toLowerCase().includes('timeout')) return { event: '타이머 만료', status: 'failure' }
  if (message) return { event: `승인 실패 (${message})`, status: 'failure' }
  return { event: '승인 실패', status: 'failure' }
}

function classifyPreviousResponse(code: string | undefined, message: string | undefined): { event: string; status: LogStatus } {
  if (code === '0000') return { event: '직전거래 응답 (성공)', status: 'success' }
  if (code === '9999') return { event: '직전거래 응답 (단말기 수신 불가)', status: 'warning' }
  if (message) return { event: `직전거래 응답 실패 (${message})`, status: 'warning' }
  return { event: '직전거래 응답 실패', status: 'warning' }
}

/**
 * "2026-01-30T13:50:16.296192+09:00[Asia/Seoul]" → "13:50:16.296"
 */
function toShortTimestamp(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/)
  if (!m) return ''
  const [, h, min, sec, ms] = m
  return ms ? `${h}:${min}:${sec}.${ms.padEnd(3, '0')}` : `${h}:${min}:${sec}`
}

function buildRawLog(timestamp: string, data2: string, ptxId: string | undefined, response: AndroidResponse | undefined): string {
  const parts = [timestamp, data2]
  if (ptxId) parts.push(ptxId)
  if (response?.resultCode) parts.push(`res: ${response.resultCode}`)
  if (response?.resultMessage) parts.push(response.resultMessage.trim())
  return parts.join(' | ')
}

/**
 * Android 엑셀에서 추출한 LogEntry[]를 iOS detailLog와 유사한 형식의 텍스트로 렌더링한다.
 * 사용자가 텍스트 영역에서 어떤 이벤트가 들어왔는지 한눈에 볼 수 있도록 한다.
 */
export function formatAndroidEntriesAsText(entries: LogEntry[]): string {
  return entries
    .map((e) => {
      const parts: string[] = [`#${e.timestamp}`, e.event]
      if (e.ptxId) parts.push(e.ptxId)
      if (e.resultCode) parts.push(`res: ${e.resultCode}`)
      if (e.resultMessage) parts.push(e.resultMessage)
      return parts.join(' | ')
    })
    .join('\n')
}
