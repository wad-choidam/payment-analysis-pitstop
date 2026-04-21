# 결제 불일치 분석 도구

POS ↔ Eximbay 단말기 간 결제 불일치 발생 시, 로그를 입력하면 자동으로 파싱·분석하여 결론·타임라인·상세 테이블로 시각화하는 웹 도구입니다.

**지원 POS**

| POS | OS | ptxId 접두사 | 입력 형식 |
|---|---|---|---|
| BPOS | iOS | `BPOS-` | 엑셀(`raw.detailLog` 텍스트) 또는 텍스트 붙여넣기 |
| CPOS | iOS | `CPOS-` | 엑셀(`raw.detailLog` 텍스트) 또는 텍스트 붙여넣기 |
| APOS | Android | `APOS-` | 엑셀(각 행이 구조화된 이벤트) |

배포: <https://payment-analysis-pitstop.vercel.app/>

## 실행

```bash
pnpm install
pnpm dev
```

## 테스트 / 빌드

```bash
pnpm vitest run    # 단위 테스트 (현재 101개)
pnpm build         # 타입 검사 + 프로덕션 빌드
```

## 페이지 구성

| 경로 | 설명 |
|------|------|
| `/` | 결제 불일치 로그 분석 도구 |
| `/guide` | 결제 불일치 가이드 (불일치 유형, 응답코드, 통신 흐름, 용어 등) |

헤더 좌측의 "📖 가이드" / "← 분석 도구" 버튼으로 페이지 간 이동.

## 사용법

1. **포스 로그 입력** — 좌측 입력창에 엑셀(`.xlsx`) 파일을 드래그앤드롭하거나 "파일 선택" 클릭
   - 업로드 시 `osType`을 자동 감지해 iOS / Android 분기 처리
   - 업로드 직후 플랫폼 뱃지(🍎 iOS / 🤖 Android)가 표시되어 어느 플랫폼으로 해석되는지 즉시 확인 가능
   - 손상된 파일 / 예상치 못한 구조는 화면 하단 토스트로 에러 안내
2. **단말기 로그 입력 (선택)** — 우측 입력창에 텍스트 붙여넣기. iOS만 별도 단말기 로그가 필요하며, Android는 엑셀 한 개로 충분
3. **분석 시작** 버튼 클릭
4. **결과 확인** — 결론 배너, 분석 요약, 결제 시도별 판정, 타임라인, 상세 로그 테이블 순서로 표시
   - "분석 결과 더보기"로 복사할 텍스트 미리보기 + "분석 결과 복사" 버튼

처음 사용한다면 헤더 가이드 버튼이나 초기 화면의 "🍎 iOS 예시" / "🤖 Android 예시" 버튼으로 실제 사례를 한 번에 불러와 흐름을 체험할 수 있습니다.

## 핵심 분석 로직

- **시도 그룹화**: iOS는 `단말기 연결 요청`, Android는 두 번째 `승인 요청` 이벤트를 새 시도의 시작점으로 인식
- **실 승인 판정**: `승인 요청` 이후의 `승인 성공` / `직전거래 응답 (성공)` 이벤트로 판정. 단, 직전거래 응답은 **ptxId가 현재 승인 요청의 ptxId와 일치할 때만** 실 승인으로 카운트 (과거 거래의 지연 응답이나 취소 후 재조회된 응답이 오판되는 문제 방지)
- **결론**: VAN 실 승인 건수 0~1건 = 중복 결제 아님, 2건 이상 = 중복 결제 의심 → UBMS 확인 필요 (복수 승인 시 ptxId별 확인 안내 표시)

## 디렉토리 구조

```
src/
  analyzer/         # 시도 그룹화·결론 생성·불일치 유형 판정
  parser/           # iOS POS·단말기·Android 엑셀·로그 병합 파서
  components/       # UI 컴포넌트 (PlatformBadge, ConclusionBanner, LogInput, Timeline 등)
  pages/            # AnalyzePage, GuidePage, NotFoundPage
  data/             # 샘플 로그 (BPOS/APOS)
  types/            # 공용 타입 (LogEntry, PaymentAttempt, AnalysisResult)
```

## 배포

`main` 브랜치에 push하면 Vercel이 자동으로 Production 배포. 다른 브랜치는 Preview 배포만 생성됩니다.

## 문서

- [결제 불일치 분석 가이드](docs/ANALYSIS_GUIDE.md) — 분석 흐름, 불일치 유형, 응답코드, 결제 시도 그룹화, 결론 판단 기준, iOS/Android 실제 사례 패턴 분류 등
