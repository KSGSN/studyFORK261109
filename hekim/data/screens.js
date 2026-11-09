/* 원본 엑셀 행과 메뉴 계층을 유지합니다. ID는 이 프로토타입에서 정의했습니다. */
window.YEOJEONG_SCREENS = [
  {
    "id": "HOME-01",
    "lv1": "메인",
    "lv2": "",
    "lv3": "",
    "title": "메인",
    "description": "- 서비스 메인 \n- 화면여행지 검색\n- 추천 여행지 및 인기 여행지 노출\n- 주요 메뉴 이동 기능 제공",
    "implemented": true,
    "sourceRow": 4
  },
  {
    "id": "AUTH-01",
    "lv1": "로그인",
    "lv2": "로그인",
    "lv3": "",
    "title": "로그인",
    "description": "- 아이디 및 비밀번호 입력을 통한 로그인\n- 로그인 상태 유지\n- 회원가입 및 비밀번호 찾기 화면 이동",
    "implemented": false,
    "sourceRow": 5
  },
  {
    "id": "AUTH-02",
    "lv1": "로그인",
    "lv2": "아이디/비밀번호 찾기",
    "lv3": "",
    "title": "아이디/비밀번호 찾기",
    "description": "- 가입 정보 확인을 통한 아이디 찾기 및 이메일 인증을 통한 비밀번호 재설정 기능 제공",
    "implemented": false,
    "sourceRow": 6
  },
  {
    "id": "JOIN-01",
    "lv1": "회원가입",
    "lv2": "약관동의",
    "lv3": "",
    "title": "약관동의",
    "description": "- 서비스 이용약관 및 개인정보 처리 관련 동의 항목 제공\n- 필수 약관 동의 후 다음 단계 이동",
    "implemented": false,
    "sourceRow": 7
  },
  {
    "id": "JOIN-02",
    "lv1": "회원가입",
    "lv2": "정보입력",
    "lv3": "",
    "title": "정보입력",
    "description": "- 아이디, 이메일, 비밀번호, 이름, 닉네임 등 회원정보 입력\n- 유효성 검사 및 회원가입 처리",
    "implemented": false,
    "sourceRow": 8
  },
  {
    "id": "TRV-01",
    "lv1": "여행지 찾기",
    "lv2": "목록",
    "lv3": "",
    "title": "목록",
    "description": "- 여행지 목록 조회\n- 지역·카테고리별 필터링\n- 키워드 검색\n- 여행지 찜하기 및 상세 화면 이동",
    "implemented": false,
    "sourceRow": 9
  },
  {
    "id": "TRV-02",
    "lv1": "여행지 찾기",
    "lv2": "상세",
    "lv3": "여행지 상세",
    "title": "여행지 상세",
    "description": "- 선택한 여행지의 이미지, 위치, 소개, 주요 관광정보 제공\n- 찜하기 및 추천 일정 목록 조회 기능",
    "implemented": false,
    "sourceRow": 10
  },
  {
    "id": "TRV-03",
    "lv1": "여행지 찾기",
    "lv2": "상세",
    "lv3": "추천 일정 목록",
    "title": "추천 일정 목록",
    "description": "- 해당 여행지와 연관된 추천 여행 일정 목록 제공\n- 여행 기간 및 일정별 주요 방문 장소 확인",
    "implemented": false,
    "sourceRow": 11
  },
  {
    "id": "TRV-04",
    "lv1": "여행지 찾기",
    "lv2": "상세",
    "lv3": "추천 일정 상세",
    "title": "추천 일정 상세",
    "description": "- 추천 일정의 날짜별 방문 장소, 이동 순서 및 상세정보 제공\n- 추천 일정을 내 여행에 담기 기능 제공",
    "implemented": false,
    "sourceRow": 12
  },
  {
    "id": "MYTR-01",
    "lv1": "나의 여행",
    "lv2": "목록",
    "lv3": "",
    "title": "목록",
    "description": "- 사용자가 등록한 여행 목록 조회\n- 여행 기간·지역·상태 확인\n- 여행 상세 조회 및 삭제 기능 제공",
    "implemented": false,
    "sourceRow": 13
  },
  {
    "id": "MYTR-02",
    "lv1": "나의 여행",
    "lv2": "등록",
    "lv3": "",
    "title": "등록",
    "description": "- 여행 제목, 여행 지역, 시작일·종료일 등 기본정보 입력을 통한 신규 여행 등록",
    "implemented": false,
    "sourceRow": 14
  },
  {
    "id": "MYTR-03",
    "lv1": "나의 여행",
    "lv2": "상세",
    "lv3": "상세",
    "title": "상세",
    "description": "- 등록한 여행의 기본정보 및 날짜별 일정 조회\n- 여행 정보 수정·삭제 및 일정 편집 화면 이동",
    "implemented": false,
    "sourceRow": 15
  },
  {
    "id": "MYTR-04",
    "lv1": "나의 여행",
    "lv2": "상세",
    "lv3": "일정 편집",
    "title": "일정 편집",
    "description": "- 날짜별 방문 장소 추가·수정·삭제, 일정 순서 변경 기능\n- 일정 메모 입력 및 저장 기능 제공",
    "implemented": false,
    "sourceRow": 16
  },
  {
    "id": "MYP-01",
    "lv1": "마이페이지",
    "lv2": "내 정보",
    "lv3": "",
    "title": "내 정보",
    "description": "- 회원정보 조회 및 수정\n- 비밀번호 변경 기능\n- 로그아웃 및 회원 탈퇴 기능 제공",
    "implemented": false,
    "sourceRow": 17
  },
  {
    "id": "MYP-02",
    "lv1": "마이페이지",
    "lv2": "찜한 여행지",
    "lv3": "목록",
    "title": "목록",
    "description": "- 사용자가 찜한 여행지 목록 조회\n- 찜 해제 및 여행지 상세 화면 이동 기능",
    "implemented": false,
    "sourceRow": 18
  },
  {
    "id": "SUP-01",
    "lv1": "고객지원",
    "lv2": "공지사항",
    "lv3": "목록",
    "title": "목록",
    "description": "- 공지사항 목록 조회\n- 검색필터를 통한 공지사항 검색 기능 제공\n- 리스트 클릭 시 상세 화면 이동",
    "implemented": false,
    "sourceRow": 19
  },
  {
    "id": "SUP-02",
    "lv1": "고객지원",
    "lv2": "공지사항",
    "lv3": "상세",
    "title": "상세",
    "description": "- 선택한 공지사항의 제목, 등록일, 본문 및 첨부파일 조회\n- 목록으로 돌아가기 버튼",
    "implemented": false,
    "sourceRow": 20
  },
  {
    "id": "SUP-03",
    "lv1": "고객지원",
    "lv2": "자주 묻는 질문",
    "lv3": "FAQ 목록",
    "title": "FAQ 목록",
    "description": "- 자주 묻는 질문 목록 조회\n- 카테고리별 필터링 및 질문 클릭 시 답변 펼침·접기 기능 제공",
    "implemented": false,
    "sourceRow": 21
  },
  {
    "id": "SUP-04",
    "lv1": "고객지원",
    "lv2": "문의하기",
    "lv3": "문의 등록",
    "title": "문의 등록",
    "description": "- 문의 유형, 제목, 내용 및 첨부파일 입력을 통한 1:1 문의 등록",
    "implemented": false,
    "sourceRow": 22
  },
  {
    "id": "SUP-05",
    "lv1": "고객지원",
    "lv2": "문의하기",
    "lv3": "문의 상세",
    "title": "문의 상세",
    "description": "- 본인이 등록한 문의의 내용 및 답변 상태 조회\n- 관리자 답변 확인\n- 답변 전 문의 수정·삭제 기능 제공",
    "implemented": false,
    "sourceRow": 23
  }
];
