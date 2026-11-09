/* hekim의 첫 진입·새로고침은 항상 번호 숨김으로 시작합니다.
   공통 도구가 초기 상태를 읽기 전에 이 프로젝트의 설정만 초기화합니다. */
(() => {
  try {
    sessionStorage.setItem('mockup.description.numbers.hekim','false');
  } catch {
    // 브라우저 저장이 차단된 경우에도 서비스 화면 로딩은 계속합니다.
  }
})();
