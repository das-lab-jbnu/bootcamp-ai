# Bootcamp AI Website

전북대학교 방산 AI 인재양성 부트캠프 웹사이트와 신청 시스템입니다. GitHub Pages 정적 프론트엔드와 Google Apps Script Web App 백엔드를 같은 Git 저장소에서 관리합니다.

## Project Structure

```text
project-root/
├─ about/
├─ apply/
│  ├─ index.html
│  └─ status.html
├─ assets/
│  ├─ css/
│  └─ js/
│     ├─ apply.js
│     ├─ config.js
│     ├─ status.js
│     └─ ...
├─ google-apps-script/
│  ├─ appsscript.json
│  ├─ Code.gs
│  ├─ api.gs
│  ├─ config.gs
│  ├─ email.gs
│  ├─ sheets.gs
│  └─ utils.gs
├─ .clasp.json
├─ package.json
└─ README.md
```

## Frontend

- GitHub Pages에서 동작하는 정적 HTML/CSS/Vanilla JS 구조입니다.
- 신청 페이지: `apply/index.html`
- 신청 조회/수정 페이지: `apply/status.html`
- Apps Script endpoint는 `assets/js/config.js`에서 한 곳으로 관리합니다.

```javascript
window.BOOTCAMP_CONFIG = {
  appsScriptEndpoints: {
    production: "https://script.google.com/macros/s/.../exec",
    development: "https://script.google.com/macros/s/.../exec"
  },
  activeEndpoint: "production"
};
```

개발/운영 배포 URL을 나누려면 `development`, `production` 값을 각각 넣고 `activeEndpoint`만 바꾸면 됩니다.

## Apps Script Backend

기존 단일 `Code.gs`를 clasp 운영에 맞게 파일별로 분리했습니다.

- `config.gs`: `SPREADSHEET_ID`, `SHEET_NAME`, 헤더, timezone 등 설정
- `api.gs`: `doGet`, `doPost`, `action=submit/status/update`
- `sheets.gs`: 시트 열기, 헤더 보정, row 조회/수정
- `email.gs`: `GmailApp.sendEmail()` 신청 완료 메일
- `utils.gs`: JSON 응답, payload parsing, validation, ID 생성 등 공통 유틸
- `appsscript.json`: OAuth scope 및 V8 runtime 설정

유지되는 기능:

- `action=submit`: 신청 저장
- `action=status`: 이메일 기준 신청 내역 조회
- `action=update`: 기존 신청 수정
- 동일 `email + program` 중복 신청 방지
- `BOOT-2026-0001` 형식 `application_id` 생성
- 신청 완료 이메일 자동 발송

## Google Sheets Schema

`applications` 시트의 헤더는 아래 순서입니다.

```text
timestamp
application_id
name
student_id
email
organization
phone
program
motivation
status
```

`google-apps-script/config.gs`의 `CONFIG.SPREADSHEET_ID`는 현재 아래 Sheet ID로 설정되어 있습니다.

```text
1IYVPZ9OC4PF9d-KqnRUDiMt7aX2i46cDq8lB7kIwwptY8GeTb1F0mgYJ
```

## Windows + VS Code + clasp Setup

1. Node.js 설치

   Windows에서는 LTS 버전을 설치합니다.

   ```powershell
   winget install OpenJS.NodeJS.LTS
   ```

   설치 확인:

   ```powershell
   node -v
   npm -v
   ```

2. 의존성 설치

   ```powershell
   npm install
   ```

3. Google Apps Script API 활성화

   브라우저에서 아래 페이지를 열고 Apps Script API를 켭니다.

   ```text
   https://script.google.com/home/usersettings
   ```

4. Google 로그인

   ```powershell
   npx clasp login
   ```

5. 기존 Apps Script 프로젝트 연결

   기존 Web App 프로젝트를 계속 사용할 경우 Apps Script 편집기 URL에서 script ID를 확인합니다.

   ```text
   https://script.google.com/home/projects/SCRIPT_ID/edit
   ```

   `.clasp.json`의 `scriptId`를 실제 값으로 교체합니다.

   ```json
   {
     "scriptId": "실제_SCRIPT_ID",
     "rootDir": "google-apps-script"
   }
   ```

   기존 프로젝트를 로컬로 먼저 받아오고 싶다면:

   ```powershell
   npx clasp clone SCRIPT_ID --rootDir google-apps-script
   ```

   단, clone은 로컬 파일을 덮어쓸 수 있으니 현재 파일을 커밋한 뒤 실행하세요.

6. 새 Apps Script 프로젝트 생성이 필요할 경우

   ```powershell
   npx clasp create --type webapp --title "Bootcamp AI Applications" --rootDir google-apps-script
   ```

   생성 후 `.clasp.json`에 새 `scriptId`가 기록됩니다.

## Development Workflow

로컬에서 Apps Script 파일 수정:

```powershell
code google-apps-script
```

Apps Script 프로젝트로 push:

```powershell
npm run gas:push
```

온라인 편집기 열기:

```powershell
npm run gas:open
```

배포 목록 확인:

```powershell
npm run gas:deployments
```

## Deploy Workflow

1. 로컬 수정

   ```powershell
   git status
   npm run gas:push
   ```

2. 새 버전 생성 및 배포

   ```powershell
   npm run gas:deploy -- --description "Update application API"
   ```

3. Web App URL 확인

   ```powershell
   npm run gas:deployments
   ```

4. URL이 바뀌었으면 `assets/js/config.js`의 endpoint 갱신

5. GitHub Pages 프론트 변경사항 commit/push

중요: Apps Script는 저장 또는 `clasp push`만으로 기존 Web App 배포본이 자동 갱신되지 않을 수 있습니다. 운영 반영 시에는 반드시 새 버전 배포 또는 기존 deployment 업데이트를 확인해야 합니다.

## Why The Previous Errors Happened

`SpreadsheetApp.getActiveSpreadsheet()`가 null이 된 이유:

- Apps Script가 Google Sheet에 바인딩된 container-bound 프로젝트가 아니라 standalone 프로젝트로 실행되면 active spreadsheet 컨텍스트가 없습니다.
- Web App 요청에는 “현재 열려 있는 스프레드시트”라는 개념이 없으므로 `getActiveSpreadsheet()`가 null이 될 수 있습니다.
- 해결책은 `SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)`로 명시적으로 DB 시트를 여는 것입니다.

Deployment version mismatch:

- Apps Script Web Editor에 코드를 붙여넣고 저장해도 이미 배포된 Web App URL이 새 코드를 실행한다고 보장되지 않습니다.
- Web App은 특정 deployment/version을 바라봅니다.
- 로컬 코드, 온라인 편집기 코드, 실제 Web App 배포본이 서로 달라지면 `doGet`이 없거나 예전 `appendRow` 코드가 실행되는 문제가 생깁니다.

Old Web App URL 문제:

- 새 배포를 만들면 Web App URL이 바뀔 수 있습니다.
- `apply.js`와 `status.js`가 서로 다른 URL을 바라보면 신청은 새 서버, 조회는 옛 서버로 가는 식의 문제가 생깁니다.
- 그래서 endpoint를 `assets/js/config.js` 하나로 중앙화했습니다.

Online editor sync 문제:

- 웹 편집기에서 수동으로 붙여넣는 방식은 Git 이력과 배포본 추적이 어렵습니다.
- clasp를 사용하면 로컬 파일이 source of truth가 되고, 변경 이력은 Git으로 추적하며, 배포는 명령어로 반복 가능하게 만들 수 있습니다.

## Useful Commands

```powershell
npm install
npx clasp login
npm run gas:push
npm run gas:deploy -- --description "Release"
npm run gas:deployments
npm run gas:open
```
