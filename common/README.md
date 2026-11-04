# 스터디 공통 목업 도구

제공된 공통 목업의 CSS·Description 편집기·번호 핀·알럿/컨펌 UI를 기본으로 사용합니다.
초기 프로젝트는 `mjha`이며 저장소는 `with-demo/study`입니다.

## 현재 상태
- root `index.html`에서 `mjha/index.html`로 이동합니다.
- `mjha`은 빈 시작 화면과 화면검색으로 구성되어 있습니다.
- 공통 UI는 연결되어 있으며 Description은 기본 닫힘입니다.
- study 전용 ChatGPT Sites 로그인·저장 서버를 사용합니다. Cloudflare 신규 가입은 필요 없습니다.
- `html/`과 `study/`의 서버·DB·GitHub 인증 설정은 완전히 분리합니다. G-FAIR 서버의 주소·데이터·비밀값을 공유하지 않습니다.
- 전용 서버 배포와 study 전용 GitHub App 등록·외부 API 접근 설정 완료 후 실제 로그인을 활성화합니다. 등록 전에는 로그인 가능 상태로 안내하지 않습니다.
- `mjha`, `shyu`, `yjgeum`, `jshwan`, `hekim`을 서버에 각각 등록하고 데이터는 프로젝트+화면 ID로 분리합니다.
- GitHub App이 `with-demo/study`에 설치되어 있고, 로그인 계정이 study 공동작업자 초대를 수락해야 설명을 작성할 수 있습니다.
- 현재 UI는 Description 작성·수정·핀 위치 저장을 제공합니다. 댓글 작성 입력란은 아직 제공하지 않습니다.
- 이전 세팅의 브라우저 저장 방식이나 JSON 백업 기능은 추가하지 않았습니다.

## 팀원 추가
자신의 폴더를 만들고 루트 `index.html`에 링크를 추가합니다.
`body data-project`를 고유 ID로 지정하고 화면에는 고유 ID를 등록합니다.
`mjha/index.html`과 `mjha/include/app.js`의 빈 구조를 참고하세요.
공통 도구는 `../common/`에서 불러오며 자기 폴더에 복제하지 않습니다.

## study 전용 서버 연결
서버: `https://study-description-collaboration.meung00.chatgpt.site`
주소는 `common/config.js` 한 곳에서 관리합니다.
서버의 `server/projects.mjs`에 팀원별 프로젝트 ID·`with-demo/study` 저장소·각 폴더의 고정 복귀 URL을 등록합니다.
로그인 후에는 로그인한 팀원 폴더의 원래 화면으로 돌아옵니다.
설명은 프로젝트+화면 ID로 구분하고 서버에서 study 공동작업자 권한과 revision을 검증합니다.
study 서버의 등록부에는 G-FAIR 프로젝트를 등록하지 않습니다.

## 로그인 확인
- 상단의 GitHub 공동작업자 로그인 버튼으로 로그인합니다. 사이트 하단의 서비스 목업 로그인과는 별개입니다.
- GitHub 권한 오류가 나오면 저장소 소유자의 GitHub Settings → Applications → Installed GitHub Apps에서 **study 전용** App의 저장소 접근 대상에 `study`가 포함되어 있는지 확인합니다. G-FAIR용 App을 공유하지 않습니다.
- 초대 대기 중인 계정은 초대를 수락한 다음 다시 로그인합니다.
- 설명을 저장한 뒤 새로고침하여 유지되는지 확인합니다.

## 팀원별 실습 폴더
- `mjha/`: mjha 실습 공간
- `shyu/`: shyu 실습 공간
- `yjgeum/`: yjgeum 실습 공간
- `jshwan/`: jshwan 실습 공간
- `hekim/`: hekim 실습 공간
