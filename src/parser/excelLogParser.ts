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
  /** 파싱 실패/구조 불일치/빈 데이터 시 사용자에게 노출할 한글 에러 메시지. 성공 시 undefined. */
  error?: string;
  /** 파싱은 성공했지만 사용자가 인지할 필요가 있는 이슈 (예: 시트가 여러 개) */
  warning?: string;
}

/**
 * 결제 불일치 엑셀 파일에서 플랫폼에 따라 로그를 추출한다.
 *
 * iOS (osType=IOS): raw.detailLog 텍스트를 posLog로 반환. 이후 posLogParser로 파싱.
 * 안드로이드 (osType=AOS): 각 행이 하나의 이벤트이므로 그대로 LogEntry[]로 변환해 androidEntries로 반환.
 *
 * 실패 경로 (error 필드로 반환):
 * - 엑셀 파일 자체를 읽을 수 없는 경우
 * - 시트가 없는 경우
 * - 분석 가능한 로그 데이터가 한 건도 없는 경우
 */
export async function extractPosLogFromExcel(buffer: ArrayBuffer): Promise<ExcelParseResult> {
  // xlsx 라이브러리는 200KB+로 무거워 파일 업로드 시점에만 동적 로드 (초기 번들 크기 절감)
  let xlsx: typeof import('xlsx')
  try {
    xlsx = await import('xlsx')
  } catch {
    return { posLog: '', error: '엑셀 파서 로드에 실패했습니다. 네트워크 상태를 확인한 후 다시 시도해 주세요.' }
  }

  let wb
  try {
    wb = xlsx.read(buffer, { type: 'array' })
  } catch {
    return { posLog: '', error: '엑셀 파일을 읽을 수 없습니다. 파일이 손상되었거나 지원되지 않는 형식일 수 있습니다.' }
  }

  const firstSheetName = wb.SheetNames[0]
  const ws = firstSheetName ? wb.Sheets[firstSheetName] : undefined
  if (!ws) return { posLog: '', error: '엑셀 파일에서 시트를 찾을 수 없습니다.' }

  const multiSheetWarning = wb.SheetNames.length > 1
    ? `시트가 ${wb.SheetNames.length}개 있어 첫 번째 시트("${firstSheetName}")만 사용했습니다. 다른 시트: ${wb.SheetNames.slice(1).map(n => `"${n}"`).join(', ')}`
    : undefined

  const rows = xlsx.utils.sheet_to_json<Record<string, string>>(ws)
  if (rows.length === 0) return { posLog: '', error: '엑셀 시트에 데이터가 없습니다.' }

  let serviceType: string | undefined
  let osType: string | undefined

  for (const row of rows) {
    if (!serviceType) serviceType = row['serviceType'] ?? row['ServiceType']
    if (!osType) osType = row['osType'] ?? row['OsType']
    if (serviceType && osType) break
  }

  if (osType === 'AOS') {
    const androidEntries = parseAndroidExcelRows(rows as AndroidExcelRow[])
    if (androidEntries.length === 0) {
      return { posLog: '', serviceType: 'APOS', osType, error: '안드로이드 이벤트 로그를 추출하지 못했습니다. 엑셀 구조가 예상과 다를 수 있습니다.' }
    }
    return { posLog: '', serviceType: 'APOS', osType, androidEntries, warning: multiSheetWarning }
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
      // JSON 파싱 실패 시 스킵 — 개별 행만 무시
    }
  }

  if (detailLogs.length === 0) {
    return {
      posLog: '',
      serviceType,
      osType,
      error: 'iOS 포스 로그(detailLog)를 찾을 수 없습니다. 예상 엑셀 구조가 아닐 수 있습니다.',
    }
  }

  return {
    posLog: detailLogs.join('\n'),
    serviceType,
    osType,
    warning: multiSheetWarning,
  }
}

export function isExcelFile(file: File): boolean {
  return file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || file.type === 'application/vnd.ms-excel'
}
