/**
 * 에러/경고 이벤트에 대한 상세 설명 매핑.
 * 이벤트 텍스트에 포함된 키워드로 매칭한다.
 */
const DESCRIPTIONS: { keyword: string; description: string }[] = [
  // 단말기 수신 불가
  { keyword: '단말기 수신 불가', description: '단말기가 이전 요청을 처리 중이거나 결제 진입이 불가한 상태. POS는 실패로 처리하지만 단말기가 이후 단독으로 결제를 완료할 수 있음.' },
  // 타이머 만료
  { keyword: '타이머 만료', description: 'POS에서 승인 요청 후 3초 내 응답이 없어 접속을 종료함. 이 사이에 단말기가 VAN과 단독 승인을 완료하면 결제 불일치 발생.' },
  // PtxID 불일치
  { keyword: '동기화 실패', description: '직전 거래의 ptxId와 현재 ptxId가 달라 승인정보 동기화에 실패. 이전 결제가 비정상 종료된 후 재시도할 때 발생.' },
  // EOT
  { keyword: 'EOT 비정상', description: '단말기에서 결제는 완료했으나 POS와의 정상 종료 절차(EOT)가 이루어지지 않음. 단말기 자체 영수증이 출력됨.' },
  // 중복 결제 의심
  { keyword: '중복 결제 의심', description: '직전 거래 조회 결과 중복결제가 의심되는 상태. 매장에서 임의등록 또는 결제 중단을 선택해야 함.' },
  // 임의등록
  { keyword: '임의등록', description: '매장에서 중복결제 경고 팝업에 "확인(임의등록)"을 선택하여 수동으로 결제 처리함.' },
  // 사용자 취소
  { keyword: '사용자 취소', description: '매장에서 결제 진행 중 취소 버튼을 눌러 승인을 중단함.' },
  // 승인 중단 실패
  { keyword: '중단 실패', description: '취소 요청을 보냈으나 단말기가 이전 요청을 처리 중이라 취소가 거절됨. 단말기가 결제를 계속 진행할 수 있음.' },
  // IC카드 리딩 실패
  { keyword: 'IC카드 리딩 실패', description: 'IC칩 읽기 실패. MSR 모드로 전환하거나 카드를 다시 접촉하여 재시도. 보통 여러 번 실패 후 성공하며 중복결제와 무관.' },
  // 프린터 오류
  { keyword: '프린터 오류', description: '단말기 프린터 오류. 매장에서 결제가 안 된 것으로 오인하여 재시도할 수 있으므로 주의.' },
  // VAN 통신 타임아웃
  { keyword: 'SocketTimeoutException', description: 'VAN사와의 네트워크 통신이 타임아웃됨. 매장 네트워크 장애가 원인이며 결제 자체가 실패함.' },
  // 강제 취소 타임아웃
  { keyword: '강제 취소 타임아웃', description: 'VAN 통신이 불가한 상태에서 강제 취소 요청도 타임아웃됨. 네트워크 장애가 지속 중.' },
  // 접속 해제
  { keyword: '접속 해제', description: 'POS와 단말기 간 연결이 종료됨.' },
  // 마지막 승인 응답실패
  { keyword: '마지막 승인 응답실패', description: '직전거래 조회 후 마지막 승인 데이터 수신에 실패하여 접속을 해제함.' },
  // 트랜잭션 스킵
  { keyword: '트랜잭션 스킵', description: '단말기가 사용 불가 상태여서 결제 요청 자체가 스킵됨.' },
  // 충전독
  { keyword: '충전독 분리', description: '영업 중 충전독에서 분리되어 통신 불량 발생. 결제 불일치의 원인이 될 수 있음.' },
  // 카드 리딩 취소
  { keyword: '카드 리딩 취소', description: '매장에서 카드 읽기를 취소함.' },
  // 승인 실패 응답 (generic)
  { keyword: '승인 실패 응답', description: '단말기에서 승인 실패 응답을 보냄. 응답 코드에 따라 원인이 다름.' },

  // === info 이벤트 설명 ===
  // 직전거래 조회
  { keyword: '직전거래 조회', description: '중복 결제 방지를 위해 단말기의 마지막 거래 ptxId를 조회하는 과정. 이전 거래와 현재 거래의 ptxId를 비교하여 중복 여부를 판단.' },
  { keyword: '직전거래 응답', description: '단말기가 보관 중인 마지막 거래 정보 응답. 이 ptxId와 현재 요청의 ptxId를 비교하여 중복결제를 체크함.' },
  // 연결
  { keyword: '단말기 연결 요청', description: 'POS에서 단말기로 결제 처리를 위한 연결을 시작하는 단계.' },
  { keyword: 'POS 연결 요청 수신', description: '단말기가 POS의 연결 요청을 수신한 시점. 새로운 결제 시도의 시작.' },
  // 승인 요청
  { keyword: '승인 요청', description: 'POS에서 단말기에 카드 결제 승인을 요청. 이후 단말기가 VAN사와 통신하여 실제 승인을 처리함.' },
  // VAN 통신
  { keyword: 'VAN사에 승인 요청', description: '단말기가 VAN(결제 대행사)에 카드 승인을 요청. 이 시점부터 실제 결제가 진행됨.' },
  { keyword: 'VAN사 승인 응답', description: 'VAN사로부터 승인 결과를 수신. 이후 단말기가 POS에 결과를 전달.' },
  { keyword: 'VAN사에 직전거래 조회', description: '단말기가 VAN사에 직전 거래 내역을 조회하여 중복결제 여부를 확인.' },
  // 승인정보 동기화
  { keyword: '승인정보 동기화 접속', description: '이전 결제가 비정상 종료된 후, POS가 단말기의 승인 정보를 동기화하기 위해 재접속하는 과정.' },
  // 카드 리딩
  { keyword: '카드 리딩 시작', description: '단말기에서 카드 읽기를 시작. IC(접촉), CT_CTLS(비접촉), MSR(마그네틱) 모드가 있음.' },
  { keyword: '카드 리딩 성공', description: '카드 정보 읽기 성공. 이후 VAN사에 승인 요청이 진행됨.' },
  { keyword: '카드 리딩 요청', description: '안드로이드(APOS) 포스가 단말기에 카드 리딩을 요청한 시점. 이후 카드 데이터 응답으로 결과가 전달됨.' },
  // 승인 실패 (안드로이드/공통)
  { keyword: '승인 실패', description: '단말기에서 승인 실패 응답이 전달됨. 괄호 안 메시지(resultMessage)에 구체적 원인이 표시됨.' },
  // 중복결제 확인
  { keyword: '알고있는 승인내역', description: '직전거래 조회 결과 이미 POS가 인지하고 있는 결제 건으로 확인됨. 정상 상태.' },
  { keyword: '승인금액 다름', description: '직전 거래와 현재 요청의 승인금액이 달라 다른 결제 건으로 판단됨.' },
  // 취소
  { keyword: '취소 요청', description: '사용자 또는 POS가 이전 승인을 취소 요청.' },
  { keyword: '취소 성공', description: 'VAN 취소 승인 완료.' },
  // 간편결제 / 바코드
  { keyword: '간편결제', description: '간편결제 수단으로 시도. AOS 특정 매장에서 발생.' },
  { keyword: '바코드 스캔', description: '간편결제용 바코드 스캔 이벤트.' },
]

export function getEventDescription(event: string): string | null {
  for (const { keyword, description } of DESCRIPTIONS) {
    if (event.includes(keyword)) return description
  }
  return null
}
