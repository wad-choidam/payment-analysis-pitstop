import { useCallback, useRef, useState } from 'react'

interface LogTextAreaProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function LogTextArea({ label, value, onChange, placeholder }: LogTextAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        onChange(ev.target?.result as string)
      }
      reader.readAsText(file)
    }
  }, [onChange])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        onChange(ev.target?.result as string)
      }
      reader.readAsText(file)
    }
  }, [onChange])

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
          accept=".txt,.log"
          onChange={handleFileSelect}
          className="hidden"
        />
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
