import { useCallback, useRef, useState } from 'react'
import { extractPosLogFromExcel, isExcelFile } from '../../parser/excelLogParser'
import type { LogEntry } from '../../types'

/**
 * Android 엑셀에서 추출한 LogEntry[]를 iOS detailLog와 유사한 형식의 텍스트로 렌더링한다.
 * 각 줄: `#HH:mm:ss.mmm 이벤트명 | ptxId | res: 코드 | 메시지`
 */
function formatAndroidEntriesAsText(entries: LogEntry[]): string {
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

interface LogTextAreaProps {
  label: string
  value: string
  onChange: (value: string) => void
  onServiceTypeDetected?: (serviceType: string) => void
  onAndroidEntriesDetected?: (entries: LogEntry[]) => void
  placeholder?: string
  showFileUpload?: boolean
}

export function LogTextArea({ label, value, onChange, onServiceTypeDetected, onAndroidEntriesDetected, placeholder, showFileUpload = true }: LogTextAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const readFile = useCallback((file: File) => {
    if (isExcelFile(file)) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const buffer = ev.target?.result as ArrayBuffer
        const result = extractPosLogFromExcel(buffer)
        if (result.androidEntries && result.androidEntries.length > 0) {
          // 안드로이드: entries를 iOS 포스 로그와 유사한 한 줄 텍스트로 렌더링해 사용자에게 노출
          onChange(formatAndroidEntriesAsText(result.androidEntries))
          onAndroidEntriesDetected?.(result.androidEntries)
        } else {
          onChange(result.posLog)
          onAndroidEntriesDetected?.([])
        }
        if (result.serviceType && onServiceTypeDetected) {
          onServiceTypeDetected(result.serviceType)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        onChange(ev.target?.result as string)
        onAndroidEntriesDetected?.([])
      }
      reader.readAsText(file)
    }
  }, [onChange, onServiceTypeDetected, onAndroidEntriesDetected])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }, [readFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
  }, [readFile])

  return (
    <div
      className={`flex-1 bg-[#16213e] border rounded-lg p-4 transition-colors ${
        isDragging ? 'border-[#e94560] bg-[#1a2540]' : 'border-dashed border-[#0f3460]'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-sm font-bold">{label}</span>
        {showFileUpload && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#00d2ff] hover:text-[#00e5ff] cursor-pointer"
            >
              파일 선택
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.log,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? '텍스트를 붙여넣거나 파일을 드래그하세요...'}
        className="w-full bg-[#0a0a1a] rounded p-3 text-gray-300 text-xs font-mono min-h-[120px] resize-y border-none outline-none placeholder-gray-600"
      />
    </div>
  )
}
