import { useCallback, useEffect, useRef, useState } from 'react'
import { extractPosLogFromExcel, isExcelFile } from '../../parser/excelLogParser'
import { formatAndroidEntriesAsText } from '../../parser/androidExcelParser'
import type { LogEntry } from '../../types'

interface LogTextAreaProps {
  label: string
  value: string
  onChange: (value: string) => void
  onServiceTypeDetected?: (serviceType: string) => void
  onAndroidEntriesDetected?: (entries: LogEntry[]) => void
  onParseError?: (message: string) => void
  onParseWarning?: (message: string) => void
  placeholder?: string
  showFileUpload?: boolean
  readOnly?: boolean
  headerSlot?: React.ReactNode
}

export function LogTextArea({ label, value, onChange, onServiceTypeDetected, onAndroidEntriesDetected, onParseError, onParseWarning, placeholder, showFileUpload = true, readOnly = false, headerSlot }: LogTextAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingFileName, setProcessingFileName] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 사용자가 초기화해서 textarea가 비면 파일명 표시도 해제
  useEffect(() => {
    if (!value) setUploadedFileName(null)
  }, [value])

  const readFile = useCallback((file: File) => {
    setIsProcessing(true)
    setProcessingFileName(file.name)
    const finish = () => {
      setIsProcessing(false)
      setProcessingFileName(null)
    }

    if (isExcelFile(file)) {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        try {
          const buffer = ev.target?.result as ArrayBuffer
          const result = await extractPosLogFromExcel(buffer)
          if (result.error) {
            onParseError?.(result.error)
            return
          }
          if (result.androidEntries && result.androidEntries.length > 0) {
            onChange(formatAndroidEntriesAsText(result.androidEntries))
            onAndroidEntriesDetected?.(result.androidEntries)
          } else {
            onChange(result.posLog)
            onAndroidEntriesDetected?.([])
          }
          if (result.serviceType && onServiceTypeDetected) {
            onServiceTypeDetected(result.serviceType)
          }
          if (result.warning) {
            onParseWarning?.(result.warning)
          }
          setUploadedFileName(file.name)
        } finally {
          finish()
        }
      }
      reader.onerror = () => {
        onParseError?.('파일을 읽는 중 오류가 발생했습니다.')
        finish()
      }
      reader.readAsArrayBuffer(file)
    } else {
      const reader = new FileReader()
      reader.onload = (ev) => {
        onChange(ev.target?.result as string)
        onAndroidEntriesDetected?.([])
        setUploadedFileName(file.name)
        finish()
      }
      reader.onerror = () => {
        onParseError?.('파일을 읽는 중 오류가 발생했습니다.')
        finish()
      }
      reader.readAsText(file)
    }
  }, [onChange, onServiceTypeDetected, onAndroidEntriesDetected, onParseError, onParseWarning])

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
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-gray-400 text-sm font-bold shrink-0">{label}</span>
        {uploadedFileName && (
          <span
            className="text-xs text-gray-500 truncate animate-fade-in"
            title={uploadedFileName}
          >
            📄 {uploadedFileName}
          </span>
        )}
        {showFileUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.log,.xlsx,.xls"
            onChange={handleFileSelect}
            onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
            className="hidden"
          />
        )}
      </div>
      {headerSlot && <div className="mb-2 animate-fade-in">{headerSlot}</div>}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={readOnly ? '' : (placeholder ?? '텍스트를 붙여넣거나 파일을 드래그하세요...')}
          disabled={isProcessing}
          readOnly={readOnly}
          className="w-full bg-[#0a0a1a] rounded p-3 text-gray-300 text-xs font-mono min-h-[120px] resize-y border-none outline-none placeholder-gray-600 disabled:opacity-60 read-only:cursor-default"
        />
        {showFileUpload && !value && !isProcessing && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={`${label} 파일 선택`}
            className={`absolute inset-0 flex flex-col items-center justify-center gap-1 rounded transition-all cursor-pointer pointer-events-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00d2ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16213e] ${
              isDragging
                ? 'bg-[#e94560]/10 text-[#e94560]'
                : 'text-gray-500 hover:text-[#00d2ff] hover:bg-[#00d2ff]/5'
            }`}
          >
            <span className="text-3xl">{isDragging ? '⬇️' : '📥'}</span>
            <span className="text-xs font-bold">
              {isDragging ? '여기에 놓으세요' : '엑셀 파일을 드롭하거나 클릭'}
            </span>
            <span className="text-[10px] text-gray-600">.xlsx · .xls · .txt</span>
          </button>
        )}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a1a]/70 rounded backdrop-blur-[1px]">
            <div className="flex items-center gap-2.5 bg-[#16213e] border border-[#00d2ff] rounded-md px-4 py-2.5 shadow-lg">
              <div className="w-4 h-4 border-2 border-[#00d2ff] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[#00d2ff] font-bold">
                파일 읽는 중...
                {processingFileName && <span className="text-gray-400 font-normal ml-2">{processingFileName}</span>}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
