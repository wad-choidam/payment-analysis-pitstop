import { read, utils } from 'xlsx'

export interface ExcelParseResult {
  posLog: string;
  serviceType?: string; // 'BPOS' | 'CPOS' 등
}

/**
 * 결제 불일치 엑셀 파일에서 detailLog와 serviceType을 추출한다.
 *
 * 엑셀 구조:
 *   시트 "이벤트 로그"
 *   컬럼: regDateTime, eventName, serviceType, ..., raw (JSON)
 *   raw 안의 detailLog 필드가 포스 로그
 */
export function extractPosLogFromExcel(buffer: ArrayBuffer): ExcelParseResult {
  const wb = read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) return { posLog: '' }

  const rows = utils.sheet_to_json<Record<string, string>>(ws)
  const detailLogs: string[] = []
  let serviceType: string | undefined

  for (const row of rows) {
    if (!serviceType) {
      serviceType = row['serviceType'] ?? row['ServiceType']
    }

    const rawStr = row['raw'] ?? row['Raw'] ?? ''
    if (!rawStr) continue

    try {
      const parsed = JSON.parse(rawStr)
      let detailLog: string = parsed?.raw?.detailLog ?? parsed?.detailLog ?? ''
      if (detailLog) {
        // #HH:mm:ss 앞에 줄바꿈이 없으면 삽입 (파서가 줄 단위로 처리하므로)
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
  }
}

export function isExcelFile(file: File): boolean {
  return file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    || file.type === 'application/vnd.ms-excel'
}
