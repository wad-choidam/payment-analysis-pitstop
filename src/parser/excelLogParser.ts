import { read, utils } from 'xlsx'
import type { LogEntry } from '../types'
import { parseAndroidExcelRows, type AndroidExcelRow } from './androidExcelParser'

export interface ExcelParseResult {
  /** iOS(BPOS/CPOS)에서 추출된 포스 로그 텍스트. AOS면 빈 문자열. */
  posLog: string;
  /** serviceType 필드 값 ('BPOS' | 'CPOS' 등) */
  serviceType?: string;
  /** osType 필드 값 ('IOS' | 'AOS' 등) */
  osType?: string;
  /** AOS일 때 구조화된 이벤트 엔트리. iOS면 undefined. */
  androidEntries?: LogEntry[];
}

/**
 * 결제 불일치 엑셀 파일에서 플랫폼에 따라 로그를 추출한다.
 *
 * iOS (osType=IOS): raw.detailLog 텍스트를 posLog로 반환. 이후 posLogParser로 파싱.
 * 안드로이드 (osType=AOS): 각 행이 하나의 이벤트이므로 그대로 LogEntry[]로 변환해 androidEntries로 반환.
 */
export function extractPosLogFromExcel(buffer: ArrayBuffer): ExcelParseResult {
  const wb = read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return { posLog: '' }

  const rows = utils.sheet_to_json<Record<string, string>>(ws)
  let serviceType: string | undefined
  let osType: string | undefined

  for (const row of rows) {
    if (!serviceType) serviceType = row['serviceType'] ?? row['ServiceType']
    if (!osType) osType = row['osType'] ?? row['OsType']
    if (serviceType && osType) break
  }

  if (osType === 'AOS') {
    const androidEntries = parseAndroidExcelRows(rows as AndroidExcelRow[])
    return { posLog: '', serviceType: 'APOS', osType, androidEntries }
  }

  const detailLogs: string[] = []
  for (const row of rows) {
    const rawStr = row['raw'] ?? row['Raw'] ?? ''
    if (!rawStr) continue
    try {
      const parsed = JSON.parse(rawStr)
      let detailLog: string = parsed?.raw?.detailLog ?? parsed?.detailLog ?? ''
      if (detailLog) {
        detailLog = detailLog.replace(/#(\d{2}:\d{2}:\d{2})/g, '\n#$1')
        detailLogs.push(detailLog)
      }
    } catch {
      // JSON 파싱 실패 시 스킵
    }
  }

  return {
    posLog: detailLogs.join('\n'),
    serviceType,
    osType,
  }
}

export function isExcelFile(file: File): boolean {
  return file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || file.type === 'application/vnd.ms-excel'
}
