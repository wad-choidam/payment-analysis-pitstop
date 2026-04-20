import type { AnalysisResult, LogEntry, PosType, TerminalType } from '../types'

function detectPosType(entries: LogEntry[]): PosType {
  for (const entry of entries) {
    if (entry.ptxId?.startsWith('BPOS-')) return 'BPOS'
    if (entry.ptxId?.startsWith('CPOS-')) return 'CPOS'
  }
  return 'UNKNOWN'
}

function detectTerminal(entries: LogEntry[]): TerminalType {
  for (const entry of entries) {
    if (entry.rawLog.includes('T650P') || entry.source === 'TERMINAL') return 'Eximbay'
  }
  return 'UNKNOWN'
}

function detectDiscrepancyType(entries: LogEntry[]): string {
  for (const entry of entries) {
    if (entry.event.includes('타이머 만료')) return '타이머 만료'
    if (entry.event.includes('중단 실패')) return '연결 끊김'
    if (entry.event.includes('단말기 수신 불가')) return '단말기 수신 불가'
    if (entry.event.includes('충전독')) return '충전독 접촉'
    if (entry.event.includes('중복 결제')) return '중복 결제 의심'
  }
  return '알 수 없음'
}

function findPtxId(entries: LogEntry[]): string {
  for (const entry of entries) {
    if (entry.ptxId) return entry.ptxId
  }
  return ''
}

function findErrorPoints(entries: LogEntry[]): number[] {
  return entries
    .map((entry, index) => entry.status === 'failure' ? index : -1)
    .filter(i => i !== -1)
}

export function analyzeDiscrepancy(entries: LogEntry[]): AnalysisResult {
  return {
    posType: detectPosType(entries),
    terminal: detectTerminal(entries),
    discrepancyType: detectDiscrepancyType(entries),
    ptxId: findPtxId(entries),
    entries,
    errorPoints: findErrorPoints(entries),
  }
}
