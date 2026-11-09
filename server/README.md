# 공동작업 서버

Node.js 24 이상과 내장 SQLite를 사용합니다. 외부 패키지 설치는 필요 없습니다. 기존 프런트엔드의 `/api/collab`, `/api/github/start`와 호환됩니다.

## 로컬 확인

```sh
cd server
npm test
npm start
```

`GET /health`가 `ok: true`를 반환합니다. 자격 증명 없이도 공개 설명 조회가 가능하지만 `githubConfigured: false`이고 로그인·쓰기는 차단됩니다. `.env`는 자동으로 읽지 않습니다. 로컬 파일을 사용하는 경우 `node --env-file=.env index.mjs`로 실행하세요. 실제 OAuth 로그인을 로컬에서 하려면 HTTPS 서버 주소와 등록된 복귀 사이트가 필요합니다.

## Render 배포 순서

1. 변경 파일을 GitHub 저장소에 올립니다.
2. Render에서 New → Web Service → 이 저장소를 연결합니다.
3. Root Directory: `server`, Runtime: Node, Build Command: `node --version`, Start Command: `npm start`. Node 24 이상을 선택하세요.
4. **영구 디스크를 지원하는 유료 인스턴스**에 디스크를 연결하고 mount path를 `/var/data`로 지정합니다. 이 서버는 단일 인스턴스로 실행하세요. 임시 디스크만 쓰면 재배포 때 데이터가 사라집니다.
5. 환경변수 `PUBLIC_URL`을 배포 서버의 HTTPS 주소로 지정합니다(끝 `/` 제외). `DB_PATH=/var/data/study.sqlite`로 지정합니다.
6. GitHub Settings → Developer settings → OAuth Apps → New OAuth App을 엽니다. Homepage URL은 `https://ksgsn.github.io/studyFORK261109/`, Authorization callback URL은 `https://배포서버주소/api/github/callback`입니다.
7. 발급된 `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`을 Render의 비밀 환경변수로 등록하고 재배포합니다. 비밀값을 소스·채팅·Pages에 넣지 마세요.
8. `projects.mjs`의 저장소와 5개 프로젝트 복귀 주소를 확인합니다. 다른 프로젝트 서버와 자격 증명을 공유하지 마세요.
9. `common/config.js`의 `server`를 새 서버 주소로, `repository`를 `KSGSN/studyFORK261109`로 바꾸고 Pages에 배포합니다. 현재 값은 기존 서버 연결 보존을 위해 자동 변경하지 않았습니다.
10. `/health`에서 `githubConfigured: true` 확인 → Pages에서 공동작업자 로그인 → 설명 생성 → 새로고침 → 수정·핀 이동·삭제를 확인합니다. 쓰기 권한 없는 계정의 거절도 확인하세요.

## 권한과 데이터

이 **새 구현은 OAuth App 방식**입니다. 기존 서버 문서의 GitHub App 설치 방식과 다릅니다. GitHub `repo` scope로 비공개 저장소를 포함한 쓰기 권한을 확인하므로 승인 범위를 검토하세요. 조직 정책에 따라 별도 OAuth 승인이 필요할 수 있습니다. GitHub 사용자와 저장소의 `push`/`maintain`/`admin` 권한을 세션을 사용하는 요청마다 다시 확인하며 권한 확인 실패 시 쓰기를 거절합니다.

설명 조회는 공개입니다. 민감한 정보를 저장하지 마세요. 로그인 state 10분, 일회성 교환 코드 2분, 세션 8시간으로 제한합니다. 브라우저에는 GitHub 토큰 대신 서버 세션 토큰만 전달하고 프런트엔드의 SHA-256 challenge와 verifier를 검증합니다. 복귀 주소는 서버 등록부만 사용하고 CORS도 해당 origin으로 제한합니다. GitHub 토큰은 서버 SQLite에 보관하므로 디스크 접근 권한을 제한하고 암호화·백업·보존 정책을 호스팅 설정에서 관리하세요. DB 백업은 SQLite backup 도구 또는 서버 정지 후 수행하세요(WAL 파일 포함).

현재 UI에서 사용하는 설명·화면 개요·알럿/컨펌 CRUD, 핀 이동, revision 충돌 검사, 기획비고 목록을 구현했습니다. 댓글 작성 UI는 기존 사이트에도 없으며 이 서버에도 댓글 API는 포함하지 않습니다. 공용 인터넷 운영 전에는 호스팅의 요청 속도 제한을 설정하세요.

`npm test`는 모의 GitHub 응답을 사용합니다. 실제 OAuth 인증·조직 정책·외부 배포·재배포 후 디스크 유지 여부는 실제 환경에서 추가 확인해야 합니다.
