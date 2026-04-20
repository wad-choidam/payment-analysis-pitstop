# 결제 불일치 분석 도구 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** POS ↔ 단말기 결제 불일치 로그를 붙여넣으면 자동 파싱/분석하여 타임라인과 테이블로 시각화하는 React SPA를 만든다.

**Architecture:** Vite + React 18 + TypeScript SPA. 로그 파싱/분석은 순수 함수로 분리하여 테스트. UI 컴포넌트는 분석 결과를 받아 렌더링만 담당.

**Tech Stack:** React 18, TypeScript, Vite, TailwindCSS, Vitest, pnpm

---

### Task 1: 프로젝트 초기 설정

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Vite + React + TypeScript 프로젝트 생성**

```bash
cd /Users/choidam/Desktop/payment-analysis-pitstop
pnpm create vite . --template react-ts
```

선택 시 현재 디렉토리가 비어있지 않다면 기존 파일 유지 옵션 선택.

- [ ] **Step 2: 의존성 설치**

```bash
pnpm install
```

- [ ] **Step 3: TailwindCSS 설치 및 설정**

```bash
pnpm add -D tailwindcss @tailwindcss/vite
```

`src/index.css`를 다음으로 교체:

```css
@import "tailwindcss";
```

`vite.config.ts`를 다음으로 교체:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

- [ ] **Step 4: Vitest 설치**

```bash
pnpm add -D vitest
```

`vite.config.ts`에 test 설정 추가:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  test: {
    globals: true,
    environment: 'node',
  },
})
```

`tsconfig.app.json`의 `compilerOptions`에 추가:

```json
"types": ["vitest/globals"]
```

- [ ] **Step 5: 앱 스켈레톤 작성**

`src/App.tsx`:

```tsx
function App() {
  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <header className="bg-[#16213e] border-b border-[#0f3460] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <span className="text-[#e94560] font-bold text-lg">결제 불일치 분석</span>
        </div>
        <span className="text-gray-500 text-sm">POS Payment Discrepancy Analyzer</span>
      </header>
      <main className="p-6">
        <p className="text-gray-400">로그를 입력하세요.</p>
      </main>
    </div>
  )
}

export default App
```

- [ ] **Step 6: dev 서버로 확인**

```bash
pnpm dev
```

Expected: 브라우저에서 다크 배경 + 헤더가 표시됨

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "chore: init Vite + React + TypeScript + TailwindCSS + Vitest"
```

---

### Task 2: 타입 정의

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 공유 타입 파일 작성**

`src/types/index.ts`:

```ts
export type LogSource = 'POS' | 'TERMINAL';

export type LogStatus = 'success' | 'failure' | 'warning' | 'info';

export type PosType = 'BPOS' | 'CPOS' | 'UNKNOWN';

export type TerminalType = 'Eximbay' | 'KIS' | 'KOCES' | 'UNKNOWN';

export interface LogEntry {
  timestamp: string;
  source: LogSource;
  event: string;
  rawLog: string;
  status: LogStatus;
  ptxId?: string;
}

export interface AnalysisResult {
  posType: PosType;
  terminal: TerminalType;
  discrepancyType: string;
  ptxId: string;
  entries: LogEntry[];
  errorPoints: number[];
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/types/index.ts
git commit -m "feat: add shared type definitions"
```

---

### Task 3: 포스 로그 파서

**Files:**
- Create: `src/parser/posLogParser.ts`, `src/parser/__tests__/posLogParser.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`src/parser/__tests__/posLogParser.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parsePosLog } from '../posLogParser'

const SAMPLE_POS_LOG = `#{14:32:01} [전송] 승인 접속 시도
#{14:32:01} [수신] 단말기 접속 성공
#{14:32:02} [전송] 직전 거래 데이터 요청
#{14:32:03} [수신] 승인 전문 수신 - CPOS-6ecdadc1-bdf8-428e-b083-7b0136c2220d, 결제 성공
#{14:32:03} 중복결제 확인 결과 '승인금액 다름'
#{14:32:05} [전송] 카드 결제승인 요청 전문 전송 - CPOS-1b81a584-1c73-437d-ae69-1167036f71fd
#{14:32:15} [수신] 승인 중단 실패 (9991_결제 진행 중) 타이머 종료
#{14:32:18} 타이머 3초 미응답으로 접속 종료
#{14:32:19} [전송] 직전 거래 데이터 요청 (사용자취소 후 승인전문 수신)`

describe('parsePosLog', () => {
  it('parses entries from POS log text', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries.length).toBe(9)
  })

  it('extracts timestamps correctly', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[0].timestamp).toBe('14:32:01')
    expect(entries[5].timestamp).toBe('14:32:05')
  })

  it('sets source to POS for all entries', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    entries.forEach(e => expect(e.source).toBe('POS'))
  })

  it('detects connection request event', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[0].event).toBe('단말기 연결 요청')
    expect(entries[0].status).toBe('info')
  })

  it('detects connection success event', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[1].event).toBe('연결 성공')
    expect(entries[1].status).toBe('success')
  })

  it('detects previous transaction inquiry', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[2].event).toBe('직전거래 조회 요청')
  })

  it('extracts ptxId from approval response', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[3].ptxId).toBe('CPOS-6ecdadc1-bdf8-428e-b083-7b0136c2220d')
    expect(entries[3].status).toBe('success')
  })

  it('detects duplicate payment check', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[4].event).toContain('중복 결제')
    expect(entries[4].status).toBe('warning')
  })

  it('extracts ptxId from approval request', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[5].event).toBe('승인 요청')
    expect(entries[5].ptxId).toBe('CPOS-1b81a584-1c73-437d-ae69-1167036f71fd')
  })

  it('detects cancel failure', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[6].event).toContain('중단 실패')
    expect(entries[6].status).toBe('failure')
  })

  it('detects timer expiry', () => {
    const entries = parsePosLog(SAMPLE_POS_LOG)
    expect(entries[7].event).toBe('타이머 만료')
    expect(entries[7].status).toBe('failure')
  })

  it('returns empty array for empty input', () => {
    expect(parsePosLog('')).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm vitest run src/parser/__tests__/posLogParser.test.ts
```

Expected: FAIL — `parsePosLog` 모듈 없음

- [ ] **Step 3: 파서 구현**

`src/parser/posLogParser.ts`:

```ts
import type { LogEntry } from '../types'

interface PatternRule {
  pattern: RegExp;
  event: string | ((match: RegExpMatchArray) => string);
  status: LogEntry['status'];
  ptxId?: (match: RegExpMatchArray) => string | undefined;
}

const RULES: PatternRule[] = [
  {
    pattern: /\[전송\] 승인 접속 시도/,
    event: '단말기 연결 요청',
    status: 'info',
  },
  {
    pattern: /\[수신\] 단말기 접속 성공/,
    event: '연결 성공',
    status: 'success',
  },
  {
    pattern: /\[전송\] 직전 거래 데이터 요청/,
    event: '직전거래 조회 요청',
    status: 'info',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - ([A-Z]POS-[0-9a-f-]+), 결제 성공/,
    event: '직전거래 응답 (성공)',
    status: 'success',
    ptxId: (m) => m[1],
  },
  {
    pattern: /중복결제 확인 결과/,
    event: (m) => `중복 결제 의심: ${m[0]}`,
    status: 'warning',
  },
  {
    pattern: /\[전송\] 카드 결제승인 요청 전문 전송 - ([A-Z]POS-[0-9a-f-]+)/,
    event: '승인 요청',
    status: 'info',
    ptxId: (m) => m[1],
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - .+성공/,
    event: '승인 성공',
    status: 'success',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - .+실패/,
    event: '승인 실패',
    status: 'failure',
  },
  {
    pattern: /\[수신\] 승인 중단 성공/,
    event: '중단 성공',
    status: 'success',
  },
  {
    pattern: /\[수신\] 승인 중단 실패\s*\(([^)]+)\)/,
    event: (m) => `중단 실패 (${m[1]})`,
    status: 'failure',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - , 사용자 취소/,
    event: '사용자 취소',
    status: 'warning',
  },
  {
    pattern: /\[수신\] 승인 전문 수신 - , 단말기가 수신 가능한 상태가 아님/,
    event: '단말기 수신 불가',
    status: 'failure',
  },
  {
    pattern: /타이머 3초 미응답으로 접속 종료/,
    event: '타이머 만료',
    status: 'failure',
  },
  {
    pattern: /\[전송\] 단말기 정상 승인 수신 응답 전송/,
    event: '승인 수신 확인 응답',
    status: 'success',
  },
]

const TIME_PATTERN = /#\{(\d{2}:\d{2}:\d{2})\}\s*(.*)/

export function parsePosLog(raw: string): LogEntry[] {
  if (!raw.trim()) return []

  const lines = raw.split('\n').filter(l => l.trim())
  const entries: LogEntry[] = []

  for (const line of lines) {
    const timeMatch = line.match(TIME_PATTERN)
    if (!timeMatch) continue

    const timestamp = timeMatch[1]
    const content = timeMatch[2]

    let matched = false
    for (const rule of RULES) {
      const m = content.match(rule.pattern)
      if (m) {
        const event = typeof rule.event === 'function' ? rule.event(m) : rule.event
        entries.push({
          timestamp,
          source: 'POS',
          event,
          rawLog: line.trim(),
          status: rule.status,
          ptxId: rule.ptxId?.(m),
        })
        matched = true
        break
      }
    }

    if (!matched) {
      entries.push({
        timestamp,
        source: 'POS',
        event: content.trim(),
        rawLog: line.trim(),
        status: 'info',
      })
    }
  }

  return entries
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm vitest run src/parser/__tests__/posLogParser.test.ts
```

Expected: 전체 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/parser/posLogParser.ts src/parser/__tests__/posLogParser.test.ts
git commit -m "feat: add POS log parser with tests"
```

---

### Task 4: 단말기 로그 파서

**Files:**
- Create: `src/parser/terminalLogParser.ts`, `src/parser/__tests__/terminalLogParser.test.ts`

- [ ] **Step 1: 테스트 파일 작성**

`src/parser/__tests__/terminalLogParser.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseTerminalLog } from '../terminalLogParser'

const SAMPLE_TERMINAL_LOG = `2024-05-15 14:32:01.123 AgentSocketServer: CLIENT IP/192.168.123.112
2024-05-15 14:32:02.456 <REQUEST>: [POS -> T650P] INQUIRY_LATEST_TRANSACTION(990001)
2024-05-15 14:32:05.789 [POS -> T650P]: [CARD_APPROVAL] CPOS-1b81a584-1c73-437d-ae69-1167036f71fd
2024-05-15 14:32:15.012 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 0000
2024-05-15 14:32:20.345 ChargingStatusReceiver: charging dock connected`

describe('parseTerminalLog', () => {
  it('parses entries from terminal log text', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries.length).toBe(5)
  })

  it('extracts timestamps as HH:mm:ss', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[0].timestamp).toBe('14:32:01')
    expect(entries[2].timestamp).toBe('14:32:05')
  })

  it('sets source to TERMINAL for all entries', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    entries.forEach(e => expect(e.source).toBe('TERMINAL'))
  })

  it('detects client connection event', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[0].event).toContain('POS 연결 요청')
    expect(entries[0].status).toBe('info')
  })

  it('detects previous transaction inquiry', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[1].event).toBe('직전거래 조회 수신')
  })

  it('detects card approval request and extracts ptxId', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[2].event).toBe('승인 요청 수신')
    expect(entries[2].ptxId).toBe('CPOS-1b81a584-1c73-437d-ae69-1167036f71fd')
  })

  it('detects approval success response (0000)', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[3].event).toBe('승인 성공 응답')
    expect(entries[3].status).toBe('success')
  })

  it('detects charging dock event as warning', () => {
    const entries = parseTerminalLog(SAMPLE_TERMINAL_LOG)
    expect(entries[4].event).toContain('충전독')
    expect(entries[4].status).toBe('warning')
  })

  it('returns empty array for empty input', () => {
    expect(parseTerminalLog('')).toEqual([])
  })

  it('detects 9999 as terminal unavailable', () => {
    const log = '2024-05-15 14:32:15.012 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 9999'
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('단말기 수신 불가 응답')
    expect(entries[0].status).toBe('failure')
  })

  it('detects non-0000 response as failure', () => {
    const log = '2024-05-15 14:32:15.012 <RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) | res: 1234'
    const entries = parseTerminalLog(log)
    expect(entries[0].event).toBe('승인 실패 응답 (1234)')
    expect(entries[0].status).toBe('failure')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
pnpm vitest run src/parser/__tests__/terminalLogParser.test.ts
```

Expected: FAIL — 모듈 없음

- [ ] **Step 3: 파서 구현**

`src/parser/terminalLogParser.ts`:

```ts
import type { LogEntry } from '../types'

interface TerminalRule {
  pattern: RegExp;
  event: string | ((match: RegExpMatchArray) => string);
  status: LogEntry['status'];
  ptxId?: (match: RegExpMatchArray) => string | undefined;
}

const RULES: TerminalRule[] = [
  {
    pattern: /AgentSocketServer: CLIENT IP\/([\d.]+)/,
    event: (m) => `POS 연결 요청 수신 (${m[1]})`,
    status: 'info',
  },
  {
    pattern: /<REQUEST>: \[POS -> T650P\] INQUIRY_LATEST_TRANSACTION\(990001\)/,
    event: '직전거래 조회 수신',
    status: 'info',
  },
  {
    pattern: /\[POS -> T650P\]: \[CARD_APPROVAL\] ([A-Z]POS-[0-9a-f-]+)/,
    event: '승인 요청 수신',
    status: 'info',
    ptxId: (m) => m[1],
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: CARD_APPROVAL\(\d+\) \| res: 0000/,
    event: '승인 성공 응답',
    status: 'success',
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: CARD_APPROVAL\(\d+\) \| res: 9999/,
    event: '단말기 수신 불가 응답',
    status: 'failure',
  },
  {
    pattern: /<RESPONSE>: \[T650P -> POS\] req: .*\| res: (\d{4})/,
    event: (m) => `승인 실패 응답 (${m[1]})`,
    status: 'failure',
  },
  {
    pattern: /ChargingStatusReceiver/,
    event: '충전독 이벤트 (불일치 원인 가능)',
    status: 'warning',
  },
]

const TIME_PATTERN = /(\d{4}-\d{2}-\d{2}\s+)?(\d{2}:\d{2}:\d{2})[\d.]*\s+(.*)/

export function parseTerminalLog(raw: string): LogEntry[] {
  if (!raw.trim()) return []

  const lines = raw.split('\n').filter(l => l.trim())
  const entries: LogEntry[] = []

  for (const line of lines) {
    const timeMatch = line.match(TIME_PATTERN)
    if (!timeMatch) continue

    const timestamp = timeMatch[2]
    const content = timeMatch[3]

    let matched = false
    for (const rule of RULES) {
      const m = content.match(rule.pattern)
      if (m) {
        const event = typeof rule.event === 'function' ? rule.event(m) : rule.event
        entries.push({
          timestamp,
          source: 'TERMINAL',
          event,
          rawLog: line.trim(),
          status: rule.status,
          ptxId: rule.ptxId?.(m),
        })
        matched = true
        break
      }
    }

    if (!matched) {
      entries.push({
        timestamp,
        source: 'TERMINAL',
        event: content.trim(),
        rawLog: line.trim(),
        status: 'info',
      })
    }
  }

  return entries
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm vitest run src/parser/__tests__/terminalLogParser.test.ts
```

Expected: 전체 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/parser/terminalLogParser.ts src/parser/__tests__/terminalLogParser.test.ts
git commit -m "feat: add terminal log parser with tests"
```

---

### Task 5: 로그 병합 및 불일치 분석

**Files:**
- Create: `src/parser/logMerger.ts`, `src/analyzer/discrepancyAnalyzer.ts`, `src/parser/__tests__/logMerger.test.ts`, `src/analyzer/__tests__/discrepancyAnalyzer.test.ts`

- [ ] **Step 1: logMerger 테스트 작성**

`src/parser/__tests__/logMerger.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mergeLogEntries } from '../logMerger'
import type { LogEntry } from '../../types'

describe('mergeLogEntries', () => {
  it('merges and sorts entries by timestamp', () => {
    const posEntries: LogEntry[] = [
      { timestamp: '14:32:01', source: 'POS', event: 'A', rawLog: '', status: 'info' },
      { timestamp: '14:32:05', source: 'POS', event: 'C', rawLog: '', status: 'info' },
    ]
    const terminalEntries: LogEntry[] = [
      { timestamp: '14:32:03', source: 'TERMINAL', event: 'B', rawLog: '', status: 'info' },
    ]
    const merged = mergeLogEntries(posEntries, terminalEntries)
    expect(merged.map(e => e.event)).toEqual(['A', 'B', 'C'])
  })

  it('handles empty arrays', () => {
    expect(mergeLogEntries([], [])).toEqual([])
  })

  it('preserves order for same timestamp (POS first)', () => {
    const pos: LogEntry[] = [
      { timestamp: '14:32:01', source: 'POS', event: 'POS event', rawLog: '', status: 'info' },
    ]
    const terminal: LogEntry[] = [
      { timestamp: '14:32:01', source: 'TERMINAL', event: 'Terminal event', rawLog: '', status: 'info' },
    ]
    const merged = mergeLogEntries(pos, terminal)
    expect(merged[0].source).toBe('POS')
    expect(merged[1].source).toBe('TERMINAL')
  })
})
```

- [ ] **Step 2: logMerger 테스트 실패 확인**

```bash
pnpm vitest run src/parser/__tests__/logMerger.test.ts
```

Expected: FAIL

- [ ] **Step 3: logMerger 구현**

`src/parser/logMerger.ts`:

```ts
import type { LogEntry } from '../types'

export function mergeLogEntries(posEntries: LogEntry[], terminalEntries: LogEntry[]): LogEntry[] {
  const all = [...posEntries, ...terminalEntries]

  return all.sort((a, b) => {
    const cmp = a.timestamp.localeCompare(b.timestamp)
    if (cmp !== 0) return cmp
    // Same timestamp: POS before TERMINAL
    if (a.source === 'POS' && b.source === 'TERMINAL') return -1
    if (a.source === 'TERMINAL' && b.source === 'POS') return 1
    return 0
  })
}
```

- [ ] **Step 4: logMerger 테스트 통과 확인**

```bash
pnpm vitest run src/parser/__tests__/logMerger.test.ts
```

Expected: PASS

- [ ] **Step 5: discrepancyAnalyzer 테스트 작성**

`src/analyzer/__tests__/discrepancyAnalyzer.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { analyzeDiscrepancy } from '../discrepancyAnalyzer'
import type { LogEntry } from '../../types'

describe('analyzeDiscrepancy', () => {
  it('detects CPOS type from ptxId', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:05', source: 'POS', event: '승인 요청', rawLog: '', status: 'info', ptxId: 'CPOS-abc-123' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.posType).toBe('CPOS')
    expect(result.ptxId).toBe('CPOS-abc-123')
  })

  it('detects BPOS type from ptxId', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:05', source: 'POS', event: '승인 요청', rawLog: '', status: 'info', ptxId: 'BPOS-def-456' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.posType).toBe('BPOS')
  })

  it('detects Eximbay terminal from log patterns', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:01', source: 'TERMINAL', event: '직전거래 조회 수신', rawLog: '<REQUEST>: [POS -> T650P]', status: 'info' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.terminal).toBe('Eximbay')
  })

  it('identifies error points', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:01', source: 'POS', event: '연결 성공', rawLog: '', status: 'success' },
      { timestamp: '14:32:05', source: 'POS', event: '타이머 만료', rawLog: '', status: 'failure' },
      { timestamp: '14:32:06', source: 'POS', event: '직전거래 조회 요청', rawLog: '', status: 'info' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.errorPoints).toEqual([1])
  })

  it('detects timer expiry discrepancy type', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:15', source: 'POS', event: '타이머 만료', rawLog: '', status: 'failure' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.discrepancyType).toBe('타이머 만료')
  })

  it('detects connection loss discrepancy type', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:15', source: 'POS', event: '중단 실패 (9991_결제 진행 중)', rawLog: '', status: 'failure' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.discrepancyType).toBe('연결 끊김')
  })

  it('detects charging dock discrepancy type', () => {
    const entries: LogEntry[] = [
      { timestamp: '14:32:20', source: 'TERMINAL', event: '충전독 이벤트 (불일치 원인 가능)', rawLog: '', status: 'warning' },
    ]
    const result = analyzeDiscrepancy(entries)
    expect(result.discrepancyType).toBe('충전독 접촉')
  })

  it('returns UNKNOWN for no entries', () => {
    const result = analyzeDiscrepancy([])
    expect(result.posType).toBe('UNKNOWN')
    expect(result.terminal).toBe('UNKNOWN')
    expect(result.discrepancyType).toBe('알 수 없음')
  })
})
```

- [ ] **Step 6: discrepancyAnalyzer 테스트 실패 확인**

```bash
pnpm vitest run src/analyzer/__tests__/discrepancyAnalyzer.test.ts
```

Expected: FAIL

- [ ] **Step 7: discrepancyAnalyzer 구현**

`src/analyzer/discrepancyAnalyzer.ts`:

```ts
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
```

- [ ] **Step 8: 전체 테스트 통과 확인**

```bash
pnpm vitest run
```

Expected: 모든 테스트 PASS

- [ ] **Step 9: 커밋**

```bash
git add src/parser/logMerger.ts src/parser/__tests__/logMerger.test.ts src/analyzer/discrepancyAnalyzer.ts src/analyzer/__tests__/discrepancyAnalyzer.test.ts
git commit -m "feat: add log merger and discrepancy analyzer with tests"
```

---

### Task 6: 로그 입력 섹션 UI

**Files:**
- Create: `src/components/LogInput/LogInputSection.tsx`, `src/components/LogInput/LogTextArea.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: LogTextArea 컴포넌트 작성**

`src/components/LogInput/LogTextArea.tsx`:

```tsx
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
```

- [ ] **Step 2: LogInputSection 컴포넌트 작성**

`src/components/LogInput/LogInputSection.tsx`:

```tsx
import { LogTextArea } from './LogTextArea'

interface LogInputSectionProps {
  posLog: string
  terminalLog: string
  onPosLogChange: (value: string) => void
  onTerminalLogChange: (value: string) => void
  onAnalyze: () => void
  isAnalyzable: boolean
}

export function LogInputSection({
  posLog,
  terminalLog,
  onPosLogChange,
  onTerminalLogChange,
  onAnalyze,
  isAnalyzable,
}: LogInputSectionProps) {
  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
        <span className="font-bold">로그 입력</span>
        <span className="text-gray-500 text-sm ml-2">포스 로그와 단말기 로그를 입력하세요</span>
      </div>
      <div className="flex gap-4">
        <LogTextArea
          label="📋 포스 로그 (POS Log)"
          value={posLog}
          onChange={onPosLogChange}
        />
        <LogTextArea
          label="📋 단말기 로그 (Terminal Log)"
          value={terminalLog}
          onChange={onTerminalLogChange}
        />
      </div>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!isAnalyzable}
          className="bg-[#e94560] text-white px-8 py-2 rounded-md font-bold text-sm hover:bg-[#d63d56] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          분석 시작
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: App.tsx에 통합**

`src/App.tsx`:

```tsx
import { useState } from 'react'
import { LogInputSection } from './components/LogInput/LogInputSection'
import { parsePosLog } from './parser/posLogParser'
import { parseTerminalLog } from './parser/terminalLogParser'
import { mergeLogEntries } from './parser/logMerger'
import { analyzeDiscrepancy } from './analyzer/discrepancyAnalyzer'
import type { AnalysisResult } from './types'

function App() {
  const [posLog, setPosLog] = useState('')
  const [terminalLog, setTerminalLog] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleAnalyze = () => {
    const posEntries = parsePosLog(posLog)
    const terminalEntries = parseTerminalLog(terminalLog)
    const merged = mergeLogEntries(posEntries, terminalEntries)
    const analysis = analyzeDiscrepancy(merged)
    setResult(analysis)
  }

  const isAnalyzable = posLog.trim().length > 0 || terminalLog.trim().length > 0

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      <header className="bg-[#16213e] border-b border-[#0f3460] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔍</span>
          <span className="text-[#e94560] font-bold text-lg">결제 불일치 분석</span>
        </div>
        <span className="text-gray-500 text-sm">POS Payment Discrepancy Analyzer</span>
      </header>

      <LogInputSection
        posLog={posLog}
        terminalLog={terminalLog}
        onPosLogChange={setPosLog}
        onTerminalLogChange={setTerminalLog}
        onAnalyze={handleAnalyze}
        isAnalyzable={isAnalyzable}
      />

      {result && (
        <div className="p-6 text-gray-400 text-sm">
          분석 완료: {result.entries.length}개 로그 항목, {result.errorPoints.length}개 오류 지점
        </div>
      )}
    </div>
  )
}

export default App
```

- [ ] **Step 4: dev 서버로 확인**

```bash
pnpm dev
```

Expected: 로그 입력 영역 2개 + 분석 시작 버튼 표시, 텍스트 입력 및 파일 드래그 작동

- [ ] **Step 5: 커밋**

```bash
git add src/components/LogInput/LogTextArea.tsx src/components/LogInput/LogInputSection.tsx src/App.tsx
git commit -m "feat: add log input section UI with paste and drag-drop"
```

---

### Task 7: 분석 요약 카드 UI

**Files:**
- Create: `src/components/AnalysisSummary.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: AnalysisSummary 컴포넌트 작성**

`src/components/AnalysisSummary.tsx`:

```tsx
import type { AnalysisResult } from '../types'

interface AnalysisSummaryProps {
  result: AnalysisResult
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex-1 bg-[#16213e] rounded-lg p-3 text-center">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="font-bold text-lg mt-1" style={{ color }}>{value}</div>
    </div>
  )
}

export function AnalysisSummary({ result }: AnalysisSummaryProps) {
  const discrepancyColor = result.errorPoints.length > 0 ? '#e94560' : '#4ade80'

  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
        <span className="font-bold">분석 요약</span>
      </div>
      <div className="flex gap-3">
        <SummaryCard label="POS 유형" value={result.posType} color="#00d2ff" />
        <SummaryCard label="단말기" value={result.terminal} color="#00d2ff" />
        <SummaryCard label="불일치 유형" value={result.discrepancyType} color={discrepancyColor} />
        <SummaryCard
          label="ptxId"
          value={result.ptxId ? `${result.ptxId.slice(0, 18)}...` : '—'}
          color="#ffd700"
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 2: App.tsx에 AnalysisSummary 추가**

`src/App.tsx`에서 `{result && (` 블록을 다음으로 교체:

```tsx
      {result && (
        <>
          <AnalysisSummary result={result} />
          <div className="p-6 text-gray-400 text-sm">
            분석 완료: {result.entries.length}개 로그 항목, {result.errorPoints.length}개 오류 지점
          </div>
        </>
      )}
```

import 추가:

```tsx
import { AnalysisSummary } from './components/AnalysisSummary'
```

- [ ] **Step 3: dev 서버로 확인**

```bash
pnpm dev
```

Expected: 분석 시작 후 요약 카드 4개 표시

- [ ] **Step 4: 커밋**

```bash
git add src/components/AnalysisSummary.tsx src/App.tsx
git commit -m "feat: add analysis summary cards UI"
```

---

### Task 8: 타임라인 흐름도 UI

**Files:**
- Create: `src/components/Timeline/TimelineSection.tsx`, `src/components/Timeline/TimelineEvent.tsx`, `src/components/Timeline/TimelineError.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: TimelineEvent 컴포넌트 작성**

`src/components/Timeline/TimelineEvent.tsx`:

```tsx
import type { LogEntry } from '../../types'

interface TimelineEventProps {
  entry: LogEntry
}

export function TimelineEvent({ entry }: TimelineEventProps) {
  const isPosToTerminal = entry.source === 'POS'
  const statusColors = {
    success: { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-400' },
    failure: { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400' },
    warning: { bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-400' },
    info: { bg: 'bg-slate-800/50', border: 'border-slate-600', text: 'text-slate-300' },
  }
  const colors = statusColors[entry.status]

  if (isPosToTerminal) {
    return (
      <div className="flex items-center mb-2">
        <div className="w-20 text-right text-gray-500 text-xs font-mono shrink-0">{entry.timestamp}</div>
        <div className="flex-1 flex items-center mx-3">
          <div className="flex-1 h-0.5 bg-gradient-to-r from-[#00d2ff] to-[#ffd700]" />
          <span className="text-green-400 text-xs mx-1">→</span>
        </div>
        <div className={`${colors.bg} border ${colors.border} rounded px-2 py-1 text-xs ${colors.text} shrink-0 max-w-[200px] truncate`}>
          {entry.event}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center mb-2">
      <div className={`${colors.bg} border ${colors.border} rounded px-2 py-1 text-xs ${colors.text} shrink-0 max-w-[200px] truncate`}>
        {entry.event}
      </div>
      <div className="flex-1 flex items-center mx-3">
        <span className="text-green-400 text-xs mx-1">←</span>
        <div className="flex-1 h-0.5 bg-gradient-to-l from-[#00d2ff] to-[#ffd700]" />
      </div>
      <div className="w-20 text-left text-gray-500 text-xs font-mono shrink-0">{entry.timestamp}</div>
    </div>
  )
}
```

- [ ] **Step 2: TimelineError 컴포넌트 작성**

`src/components/Timeline/TimelineError.tsx`:

```tsx
import type { LogEntry } from '../../types'

interface TimelineErrorProps {
  entry: LogEntry
}

export function TimelineError({ entry }: TimelineErrorProps) {
  return (
    <div className="my-3 p-2 bg-red-900/20 border border-[#e94560] rounded-md text-center">
      <span className="text-[#e94560] text-sm font-bold">⚠️ {entry.event} — {entry.timestamp}</span>
    </div>
  )
}
```

- [ ] **Step 3: TimelineSection 컴포넌트 작성**

`src/components/Timeline/TimelineSection.tsx`:

```tsx
import type { AnalysisResult } from '../../types'
import { TimelineEvent } from './TimelineEvent'
import { TimelineError } from './TimelineError'

interface TimelineSectionProps {
  result: AnalysisResult
}

export function TimelineSection({ result }: TimelineSectionProps) {
  const errorSet = new Set(result.errorPoints)

  return (
    <section className="border-b border-[#0f3460] p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
        <span className="font-bold">타임라인 흐름도</span>
        <span className="text-gray-500 text-sm ml-2">POS ↔ 단말기 통신 흐름</span>
      </div>

      <div className="px-10">
        <div className="flex justify-between mb-4">
          <div className="text-center text-[#00d2ff] font-bold text-sm w-24">POS</div>
          <div className="text-center text-[#ffd700] font-bold text-sm w-24">단말기</div>
        </div>

        {result.entries.map((entry, index) => (
          errorSet.has(index)
            ? <TimelineError key={index} entry={entry} />
            : <TimelineEvent key={index} entry={entry} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: App.tsx에 TimelineSection 추가**

`src/App.tsx`에서 `{result && (` 블록을 다음으로 교체:

```tsx
      {result && (
        <>
          <AnalysisSummary result={result} />
          <TimelineSection result={result} />
          <div className="p-6 text-gray-400 text-sm">
            분석 완료: {result.entries.length}개 로그 항목
          </div>
        </>
      )}
```

import 추가:

```tsx
import { TimelineSection } from './components/Timeline/TimelineSection'
```

- [ ] **Step 5: dev 서버로 확인**

```bash
pnpm dev
```

Expected: 분석 후 POS ↔ 단말기 타임라인 흐름도 표시, 에러 지점 빨간 배너

- [ ] **Step 6: 커밋**

```bash
git add src/components/Timeline/TimelineEvent.tsx src/components/Timeline/TimelineError.tsx src/components/Timeline/TimelineSection.tsx src/App.tsx
git commit -m "feat: add timeline visualization for POS-terminal communication"
```

---

### Task 9: 상세 로그 테이블 UI

**Files:**
- Create: `src/components/LogTable/LogTableSection.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: LogTableSection 컴포넌트 작성**

`src/components/LogTable/LogTableSection.tsx`:

```tsx
import type { AnalysisResult } from '../../types'

interface LogTableSectionProps {
  result: AnalysisResult
}

const STATUS_INDICATOR: Record<string, { color: string; label: string }> = {
  success: { color: '#4ade80', label: '성공' },
  failure: { color: '#e94560', label: '실패' },
  warning: { color: '#ffd700', label: '경고' },
  info: { color: '#94a3b8', label: '정보' },
}

export function LogTableSection({ result }: LogTableSectionProps) {
  const errorSet = new Set(result.errorPoints)

  return (
    <section className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-[#e94560] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">4</span>
        <span className="font-bold">상세 로그 테이블</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#16213e]">
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460] w-20">시간</th>
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460] w-20">출처</th>
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460]">이벤트</th>
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460] w-16">상태</th>
              <th className="p-2 text-left text-gray-400 border-b border-[#0f3460] w-40">ptxId</th>
            </tr>
          </thead>
          <tbody>
            {result.entries.map((entry, index) => {
              const isError = errorSet.has(index)
              const status = STATUS_INDICATOR[entry.status]
              const rowBg = isError
                ? 'bg-red-900/20'
                : index % 2 === 0
                  ? 'bg-[#0d1a0d]/30'
                  : ''

              return (
                <tr key={index} className={rowBg} title={entry.rawLog}>
                  <td className="p-1.5 px-2 text-gray-500 font-mono">{entry.timestamp}</td>
                  <td className="p-1.5 px-2" style={{ color: entry.source === 'POS' ? '#00d2ff' : '#ffd700' }}>
                    {entry.source === 'POS' ? 'POS' : '단말기'}
                  </td>
                  <td className={`p-1.5 px-2 ${isError ? 'text-[#e94560] font-bold' : 'text-gray-300'}`}>
                    {isError && '⚠️ '}{entry.event}
                  </td>
                  <td className="p-1.5 px-2">
                    <span style={{ color: status.color }}>●</span>{' '}
                    <span className="text-gray-400">{status.label}</span>
                  </td>
                  <td className="p-1.5 px-2 text-[#ffd700] font-mono text-[10px]">
                    {entry.ptxId ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: App.tsx에 LogTableSection 추가**

`src/App.tsx`에서 `{result && (` 블록을 다음으로 교체:

```tsx
      {result && (
        <>
          <AnalysisSummary result={result} />
          <TimelineSection result={result} />
          <LogTableSection result={result} />
        </>
      )}
```

import 추가:

```tsx
import { LogTableSection } from './components/LogTable/LogTableSection'
```

- [ ] **Step 3: dev 서버로 확인**

```bash
pnpm dev
```

Expected: 분석 후 4개 섹션 모두 표시 — 로그 입력, 요약 카드, 타임라인, 상세 테이블

- [ ] **Step 4: 전체 테스트 통과 확인**

```bash
pnpm vitest run
```

Expected: 모든 테스트 PASS

- [ ] **Step 5: 커밋**

```bash
git add src/components/LogTable/LogTableSection.tsx src/App.tsx
git commit -m "feat: add log detail table with color-coded status"
```

---

### Task 10: 최종 통합 및 정리

**Files:**
- Modify: `src/App.tsx`, `README.md`

- [ ] **Step 1: README 업데이트**

`README.md`:

```md
# 결제 불일치 분석 도구

POS(BPOS/CPOS) ↔ Eximbay 단말기 간 결제 불일치 발생 시, 포스 로그와 단말기 로그를 입력하면 자동으로 파싱/분석하여 타임라인 흐름도와 상세 테이블로 시각화하는 웹 도구입니다.

## 실행

```bash
pnpm install
pnpm dev
```

## 테스트

```bash
pnpm vitest run
```

## 사용법

1. 포스 로그와 단말기 로그를 각각 입력 (붙여넣기 또는 파일 드래그)
2. "분석 시작" 버튼 클릭
3. 분석 요약, 타임라인, 상세 테이블 확인
```

- [ ] **Step 2: .gitignore 정리**

`.gitignore`에 다음 내용이 있는지 확인하고 없으면 추가:

```
node_modules
dist
.superpowers/
```

- [ ] **Step 3: 전체 테스트 최종 확인**

```bash
pnpm vitest run
```

Expected: 전체 PASS

- [ ] **Step 4: dev 서버 최종 확인**

```bash
pnpm dev
```

Expected: 전체 4개 섹션 동작 확인

- [ ] **Step 5: 커밋**

```bash
git add README.md .gitignore
git commit -m "docs: update README with usage instructions"
```
