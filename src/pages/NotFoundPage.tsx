import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="max-w-2xl mx-auto py-20 px-6 text-center">
      <div className="text-6xl mb-4">🧭</div>
      <h1 className="text-2xl font-bold mb-3">페이지를 찾을 수 없습니다</h1>
      <p className="text-gray-400 text-sm mb-8">
        요청하신 경로가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          to="/"
          className="text-sm px-4 py-2 rounded-md bg-[#00d2ff] text-[#0a0a1a] font-bold hover:bg-[#00b8e6] transition-colors"
        >
          분석 도구로 이동
        </Link>
        <Link
          to="/guide"
          className="text-sm px-4 py-2 rounded-md border border-[#0f3460] text-gray-300 hover:border-[#00d2ff] hover:text-[#00d2ff] transition-colors"
        >
          가이드 보기
        </Link>
      </div>
    </div>
  )
}
