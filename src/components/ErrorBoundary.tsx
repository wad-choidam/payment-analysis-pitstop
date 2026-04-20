import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="max-w-2xl mx-auto py-16 px-6">
        <div className="bg-[#16213e] border border-[#e94560] rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h1 className="text-xl font-bold text-[#e94560] mb-1">화면 렌더링 중 오류가 발생했습니다</h1>
              <p className="text-gray-400 text-sm">로그 형식이 예상과 달라 분석 중 문제가 생겼을 수 있습니다. 아래에서 에러 내용을 확인하고 다시 시도해 주세요.</p>
            </div>
          </div>

          <details className="bg-[#0a0a1a] border border-[#0f3460] rounded-md p-3 mb-4">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-[#00d2ff]">에러 상세 보기</summary>
            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono mt-2 max-h-64 overflow-auto">
              {error.name}: {error.message}
              {error.stack ? `\n\n${error.stack}` : ''}
            </pre>
          </details>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="text-sm px-4 py-2 rounded-md bg-[#00d2ff] text-[#0a0a1a] font-bold hover:bg-[#00b8e6] transition-colors cursor-pointer"
            >
              다시 시도
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="text-sm px-4 py-2 rounded-md border border-[#0f3460] text-gray-300 hover:border-[#00d2ff] hover:text-[#00d2ff] transition-colors cursor-pointer"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      </div>
    )
  }
}
