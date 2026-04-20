# 결제 불일치 분석 도구 — 설계 스펙

## 개요

POS(BPOS/CPOS) ↔ Eximbay 단말기 간 결제 불일치 발생 시, 포스 로그와 단말기 로그를 입력하면 자동으로 파싱/분석하여 타임라인 흐름도와 상세 테이블로 시각화하는 프론트엔드 전용 웹 도구.

## 사용자

- 클라이언트 개발파트 (BPOS/CPOS 개발자)
- 백엔드/운영팀

## 기술 스택

- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **패키지 관리**: pnpm
- **스타일링**: TailwindCSS
- **아키텍처**: Single Page App (프론트엔드 Only, 백엔드 없음)

## 페이지 구성 (Single Page, 4 섹션)

### 섹션 1: 로그 입력

- 포스 로그, 단말기 로그를 좌우 나란히 입력
- 입력 방식: 텍스트 붙여넣기 + 파일 드래그&드롭 + 파일 선택
- "분석 시작" 버튼 클릭 시 파싱 실행
- 입력 영역은 monospace 폰트, 다크 테마

### 섹션 2: 분석 요약 카드

분석 결과를 요약 카드 4개로 표시:
- **POS 유형**: BPOS / CPOS (txId 패턴으로 자동 감지)
- **단말기**: Eximbay / KIS / KOCES
- **불일치 유형**: 연결 끊김 / 중복 결제 / 타이머 만료 / 기타
- **ptxId**: 해당 거래의 고유 ID

### 섹션 3: 타임라인 흐름도

- POS(좌측) ↔ 단말기(우측) 간 통신을 시간순 시퀀스 다이어그램으로 표시
- 각 단계: 연결 요청 → 연결 성공 → 직전거래 조회 → 승인 요청 → 결과
- 정상 단계는 초록색, 문제 발생 지점은 빨간색 강조 (경고 배너)
- 각 이벤트에 타임스탬프 표시

### 섹션 4: 상세 로그 테이블

- 포스 로그 + 단말기 로그를 시간순으로 병합 정렬
- 컬럼: 시간 | 출처(POS/단말기) | 이벤트 | 상태 | ptxId
- 색상 코딩: 성공(초록), 실패(빨강), 경고(노랑)
- 실패/불일치 행은 배경색으로 강조

## 로그 파싱 규칙

### 포스 로그 (POS Log)

detailLog 부분에서 `#{TIME}` 기준으로 이벤트를 분리. 주요 패턴:

| 패턴 | 이벤트 |
|------|--------|
| `[전송] 승인 접속 시도` | 단말기 연결 요청 |
| `[수신] 단말기 접속 성공` | 연결 성공 |
| `[전송] 직전 거래 데이터 요청` | 직전거래 조회 요청 |
| `[수신] 승인 전문 수신 - {ptxId}, 결제 성공` | 직전거래 응답 (성공) |
| `중복결제 확인 결과` | 중복 결제 의심 체크 |
| `[전송] 카드 결제승인 요청 전문 전송 - {ptxId}` | 승인 요청 |
| `[수신] 승인 전문 수신 - , ? 성공` | 승인 성공 |
| `[수신] 승인 전문 수신 - , ? 실패사유` | 승인 실패 |
| `[수신] 승인 중단 성공` | 중단 성공 |
| `[수신] 승인 중단 실패` | 중단 실패 |
| `타이머 3초 미응답으로 접속 종료` | 타이머 만료 |

### POS 유형 감지

- txId에 `BPOS-`가 포함되면 BPOS
- txId에 `CPOS-`가 포함되면 CPOS
- `clientVersion` 필드가 있으면 CPOS

### 단말기 로그 (Terminal Log)

`AgentSocketServer: CLIENT IP`를 기준으로 세션 시작을 구분. 주요 패턴:

| 패턴 | 이벤트 |
|------|--------|
| `AgentSocketServer: CLIENT IP` | POS 연결 요청 수신 |
| `<REQUEST>: [POS -> T650P] INQUIRY_LATEST_TRANSACTION(990001)` | 직전거래 조회 수신 |
| `[POS -> T650P]: [CARD_APPROVAL] {ptxId}` | 승인 요청 수신 |
| `<RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) \| res: 0000` | 승인 성공 응답 |
| `<RESPONSE>: [T650P -> POS] req: CARD_APPROVAL(010010) \| res: 9999` | 수신 불가 응답 |
| `<RESPONSE>: [T650P -> POS] req: ... \| res: {0000이 아닌}` | 승인 실패 응답 |
| `ChargingStatusReceiver` | 충전독 이벤트 (불일치 원인 가능) |

## 컴포넌트 구조

```
src/
  App.tsx                    # 메인 레이아웃
  components/
    Header.tsx               # 앱 헤더
    LogInput/
      LogInputSection.tsx    # 섹션 1 컨테이너
      LogTextArea.tsx        # 텍스트 입력 + 파일 드래그&드롭
    AnalysisSummary.tsx      # 섹션 2 요약 카드
    Timeline/
      TimelineSection.tsx    # 섹션 3 컨테이너
      TimelineEvent.tsx      # 개별 타임라인 이벤트
      TimelineError.tsx      # 에러 지점 강조 배너
    LogTable/
      LogTableSection.tsx    # 섹션 4 컨테이너
      LogTableRow.tsx        # 개별 테이블 행
  parser/
    posLogParser.ts          # 포스 로그 파싱 로직
    terminalLogParser.ts     # 단말기 로그 파싱 로직
    logMerger.ts             # 두 로그를 시간순 병합
  analyzer/
    discrepancyAnalyzer.ts   # 불일치 유형 판별 로직
  types/
    index.ts                 # 공유 타입 정의
```

## 데이터 흐름

```
로그 텍스트 입력
  → posLogParser / terminalLogParser (파싱)
  → logMerger (시간순 병합)
  → discrepancyAnalyzer (불일치 유형 판별)
  → React state 업데이트
  → AnalysisSummary + Timeline + LogTable 렌더링
```

## 주요 타입

```typescript
interface LogEntry {
  timestamp: string;        // HH:mm:ss 형식
  source: 'POS' | 'TERMINAL';
  event: string;            // 이벤트 설명
  rawLog: string;           // 원본 로그 텍스트
  status: 'success' | 'failure' | 'warning' | 'info';
  ptxId?: string;           // BPOS-UUID 또는 CPOS-UUID
}

interface AnalysisResult {
  posType: 'BPOS' | 'CPOS' | 'UNKNOWN';
  terminal: 'Eximbay' | 'KIS' | 'KOCES' | 'UNKNOWN';
  discrepancyType: string;
  ptxId: string;
  entries: LogEntry[];       // 시간순 정렬된 전체 로그
  errorPoints: number[];     // 문제 발생 지점 인덱스
}
```

## 디자인

- 다크 테마 (네이비/다크블루 배경)
- TailwindCSS 사용
- 반응형 불필요 (데스크탑 전용 내부 도구)
- 색상 체계: 성공 #4ade80, 실패 #e94560, 경고 #ffd700, POS #00d2ff, 단말기 #ffd700
