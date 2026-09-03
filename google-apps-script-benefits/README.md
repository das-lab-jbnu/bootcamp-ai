# 학생 지원 혜택 Google Sheet 연결

이 폴더는 기존 프로그램 신청 시스템과 분리된 학생 지원 전용 Apps Script입니다.
사업단 담당자가 소유한 새 Google Sheet에서 이수·이수증·장학금 정보를 관리합니다.

## 1. Google Sheet 준비

1. 사업단 계정으로 관리할 Google Sheet를 엽니다. 기존 관리대장을 사용해도 됩니다.
2. `확장 프로그램 > Apps Script`를 엽니다.
3. `Code.gs` 내용을 Apps Script 편집기에 붙여넣습니다.
4. 프로젝트 설정에서 `appsscript.json` 표시를 활성화한 뒤 이 폴더의 manifest 내용으로 교체합니다.
5. Apps Script 편집기에서 `setupBenefitsSheet` 함수를 한 번 실행하고 권한을 승인합니다.
6. `runBenefitsSmokeTest` 함수를 실행해 헤더·공개 응답·비공개 필드 검사를 통과하는지 확인합니다.

자동 이수증 발급은 세로형 Google Slides 원본을 복사하고 비공개 PDF를 생성하므로
고급 Drive 서비스, `drive`, `presentations` 권한이 필요합니다. `drive`는 배포
실행 계정의 전체 Drive 파일을 다룰 수 있는 민감한 권한입니다. Apps Script 편집 권한은
사업단의 최소 담당자에게만 부여하고, 템플릿·발급 폴더 ID를 외부에 공개하지 않습니다.

`benefits` 탭과 아래 헤더가 자동 생성됩니다.

```text
email
name
basic_completion_status
basic_completion_date
basic_certificate_url
intermediate_completion_status
intermediate_completion_date
intermediate_certificate_url
scholarship_eligibility
scholarship_round
scholarship_application_status
scholarship_apply_start
scholarship_apply_end
scholarship_applied_at
updated_at
internal_note
affiliation
student_id
basic_course_name
basic_course_period
basic_certificate_number
basic_certificate_file_id
basic_certificate_issued_at
intermediate_course_name
intermediate_course_period
intermediate_certificate_number
intermediate_certificate_file_id
intermediate_certificate_issued_at
```

학생 한 명당 한 행을 사용합니다. 이메일은 프로그램 신청 당시 이메일과 정확히 일치해야 하며,
입력 시 자동으로 소문자 변환됩니다.

권장 드롭다운 값:

- 초급·중급 이수: `심사중`, `이수`, `미이수`
- 장학금 대상: `심사중`, `대상`, `비대상`
- 장학금 신청: `신청 전`, `신청완료`, `접수`, `보완요청`, `승인`, `반려`, `지급완료`

`internal_note`는 웹 API가 반환하지 않는 사업단 내부 메모입니다.

`scholarship_applications` 탭에는 아래 헤더가 준비됩니다.

```text
application_id
email
name
scholarship_round
bank_name
account_holder
account_number
bankbook_file_id
bankbook_file_name
bankbook_mime_type
bankbook_file_size
submitted_at
application_status
reviewed_at
internal_note
```

장학금 신청 중복은 `email + scholarship_round` 기준으로 차단됩니다. 사업단이 이 탭의
`application_status`를 변경하면 같은 회차의 `benefits` 상태에도 자동 반영됩니다.

경진대회와 신규 초급과정 접수는 학생지원 관리대장과 분리된
`2026 경진대회·초급과정 신청 접수 관리대장`에서 아래 다섯 탭을 사용합니다.

- 스프레드시트 ID: `1aRNgmAqS6IbRbn5Q-PBqnticH1gJ45c_-sahOs9nDRc`

- `idea_contest_teams`: 팀별 접수번호, 대표자, 팀명, 아이디어 주제, 접수 상태와 팀 전체 방위산업육성개론 수강 현황 요약
- `idea_contest_members`: 대표자와 팀원 3~5명의 학번, 성명, 전화번호, 이메일, 학과, 방위산업육성개론 수강 여부
- `idea_contest_individuals`: 팀 미편성 학생의 학번, 성명, 전화번호, 이메일, 학과, 방위산업육성개론 수강 여부, 관심 아이디어 분야와 팀 매칭 상태
- `program_applications`: AI Agent·바이브코딩·생성형 AI 기본과정의 개인별 신청정보와 생성형 AI 서비스 지원 수요
- `application_change_log`: 신규 신청의 온라인 변경·취소 시각과 접수번호, 처리 구분, 상태 이력

경진대회는 대표자 이메일·팀명 또는 다른 활성 팀에 이미 등록된 팀원의 이메일·학번이
같으면 중복 접수를 차단합니다. 초급과정은
`program + email` 또는 `program + student_id`가 같으면 중복 접수를 차단합니다.
접수 시 대표자 또는 신청자 이메일로 접수번호가 발송됩니다.
팀 미편성 개인 접수는 이메일 또는 학번이 같으면 중복 접수를 차단하고,
`idea_contest_individuals`의 `application_status`와 `matched_team_name`으로 매칭 진행 상황을 관리합니다.
관심 아이디어 분야는 1~2개를 선택해 `idea_interest_fields`에 쉼표로 구분하여 저장하며,
`아직 정하지 못함`은 다른 분야와 함께 선택할 수 없습니다.
신청 확인·변경·취소는 이 관리대장에 저장된 신규 신청만 대상으로 합니다. 신청 이메일로
인증번호를 받은 뒤 15분 동안 이용할 수 있으며, 상태가 `접수`인 신청만 변경·취소할 수 있습니다.
팀 신청은 대표자 이메일로만 관리하고 온라인 변경 시 기존 팀원 수는 유지합니다.
취소된 행은 삭제하지 않으며 상태와 `application_change_log` 이력을 보존합니다. 취소 후에는
같은 학생이 같은 과정이나 경진대회에 다시 신청할 수 있습니다.

신규 접수 기능을 추가한 뒤에는 `setupApplicationSheets`를 실행하여 다섯 탭의 헤더와
드롭다운 및 별도 관리대장 편집 트리거를 확인하고, `runBenefitsSmokeTest`를 실행한 다음
웹앱을 새 버전으로 배포합니다. `setupBenefitsSheet`를 실행해도 별도 관리대장 설정이 함께 실행됩니다.
현재 신규 프로그램의 실제 접수를 위해 `Code.gs`의 `APPLICATIONS_OPEN`과
`assets/js/config.js`의 `applicationsOpen`이 모두 `true`로 설정되어 있습니다. 접수를 마감할
때는 두 값을 모두 `false`로 변경합니다. 홈페이지 목록과 신청 화면은 이 프런트엔드 설정을 함께
사용하므로 별도의 버튼 마크업 수정은 필요하지 않습니다.
장학금 접수는 `SCHOLARSHIP_APPLICATIONS_OPEN`으로 별도 관리합니다. `false`인 동안에는
홈페이지에서 장학금 인증 입력을 비활성화하고 Apps Script도 장학금 신청서 제출을 거부합니다.
이수증 발급은 이 설정과 관계없이 이용할 수 있습니다.

실제 홈페이지 접수를 열지 않고 로컬에서 Google Sheet 저장과 확인 메일까지 테스트하려면 다음 순서로 진행합니다.

1. 최신 `Code.gs`와 `appsscript.json`을 저장하고 `setupApplicationSheets`를 실행합니다.
2. `createApplicationTestKey`를 실행하고 실행 로그에 표시된 테스트 키를 복사합니다.
3. Apps Script 웹 앱을 새 버전으로 배포합니다.
4. `http://127.0.0.1:5500/apply/?liveTest=1&testKey=발급받은키`로 접속합니다.
5. 프로그램의 `접수하기`를 눌러 샘플 정보를 제출하고 시트·메일을 확인합니다.
6. 테스트를 마치면 `clearApplicationTestKey`를 실행하여 테스트 키를 즉시 폐기합니다.

실제 접수를 열기 전 테스트할 때는 `APPLICATIONS_OPEN`을 `false`로 유지합니다. 테스트 키가
없거나 일치하지 않으면 공개 API는 신청을 거부하며, 키가 포함된 URL은 공유하지 않습니다.

## 2. 이수증 자동 발급

템플릿은 Google Slides 파일 `19QCbrjGHuGVqJdfFldOcowVsEftsd_2y8qhFuB5NpmI`을 사용합니다.
아래 치환문구를 슬라이드에서 임의로 바꾸거나 삭제하지 않습니다.

```text
{{CERT_NO}}
{{NAME}}
{{AFFILIATION}}
{{STUDENT_ID}}
{{COURSE_NAME}}
{{COURSE_PERIOD}}
{{ISSUE_DATE_KR}}
```

사업단은 `benefits`에서 학생별로 다음 값을 입력합니다.

- 공통: `email`, `name`, `affiliation`, `student_id`
- 초급: `basic_completion_status`, `basic_completion_date`, `basic_course_name`, `basic_course_period`
- 중급: `intermediate_completion_status`, `intermediate_completion_date`, `intermediate_course_name`, `intermediate_course_period`

이수 상태가 `이수`이고 필수 정보가 모두 입력되면 학생 화면에 `이수증 발급` 버튼이 나타납니다.
사업단이 `basic_certificate_number` 또는 `intermediate_certificate_number`를 입력하면 그 번호를
그대로 사용합니다. 번호가 비어 있을 때만 `연도-초/중-4자리 일련번호` 형식으로 자동 생성합니다.
학생이 버튼을 누르면 Slides 치환문구를 학생 정보로 바꾼 PDF를
`[비공개] 학생 이수증 PDF (웹발급 전용)` 폴더에 저장합니다.
PDF는 Drive 링크나 파일 ID를 공개하지 않습니다. Apps Script가 홈페이지 이메일 인증
세션을 다시 확인한 후 PDF 데이터를 직접 전달하며, 브라우저가 받은 데이터를 PDF로
복원합니다. 학생은 Google 계정 로그인이나 Drive 방문자 초대 없이 PDF를 열거나
다운로드할 수 있습니다. 직접 전달 가능한 PDF는 최대 5MB입니다.

발급 결과는 해당 학생 행의 URL·번호·파일 ID·발급일시에 기록하며,
`certificate_issuance_log` 탭에도 발급 이력을 추가합니다. 이미 유효한 PDF가 있으면
새 번호를 만들지 않고 기존 파일을 다시 제공합니다.

사업단이 홈페이지 이메일 인증 없이 직접 발급할 때는 별도 관리 메뉴 대신
`Code.gs` 상단의 `ADMIN_CERTIFICATE_ISSUE`를 사용합니다.

1. `ROW_NUMBER`에 `benefits` 시트의 학생 행 번호를 입력합니다. 첫 학생이 있는 2행은 `2`입니다.
2. `LEVEL`에 `"초급"` 또는 `"중급"`을 입력하고 저장합니다.
3. Apps Script 함수 목록에서 `issueCertificateForAdmin`을 선택하고 `실행`합니다.
4. `benefits` 행의 발급 결과와 `certificate_issuance_log`, Drive PDF를 확인합니다.

직접 발급도 이수 상태가 `이수`이고 필수 항목이 모두 입력된 행만 처리합니다.
이 함수로 생성한 PDF는 항상 사업단만 보관하며, 학생에게 Drive 권한을 부여하거나
알림 메일을 보내지 않습니다. 학생 발급은 홈페이지의 이메일 인증 절차로만 처리합니다.
사업단 보관용 PDF가 이미 있는 경우에도 학생 화면에서는 권한 없는 링크를 숨기고,
학생이 `이수증 발급` 버튼을 누르면 인증 세션을 확인한 뒤 기존 PDF 데이터를 직접
전달합니다. 학생 이메일에 Drive 권한이나 알림 메일을 보내지 않습니다.

## 3. 장학금 계좌정보와 통장사본

학생은 이메일 인증 후 은행, 예금주, 계좌번호와 통장사본을 제출합니다.

- 허용 파일: PDF, JPG, PNG
- 최대 크기: 5MB
- 파일명: 원본 이름을 저장하지 않고 무작위 신청번호로 변경
- 저장 위치: `setupBenefitsSheet`가 만든 `[비공개] 학생 장학금 통장사본 (웹신청 전용)` 폴더
- Drive 권한: Slides 복사·PDF 생성과 기존 발급 파일 확인을 위해 manifest의 전체 Drive 권한인 `drive` 사용

계좌정보는 `scholarship_applications` 탭에서만 관리하고 학생 조회 API에는 반환하지 않습니다.
통장사본 폴더와 관리 시트는 `웹에 게시`하거나 링크 공개하지 마세요.

## 4. Apps Script 웹앱 배포

라이브 서버 화면 검토와 코드 확인이 끝난 다음 진행합니다.

1. Apps Script에서 `배포 > 새 배포 > 웹 앱`을 선택합니다.
2. 실행 계정은 `나`, 액세스 사용자는 `모든 사용자`로 설정합니다.
3. 배포 후 `/exec`로 끝나는 웹앱 URL을 복사합니다.
4. `assets/js/config.js`의 `benefitsEndpoint`만 해당 URL로 교체합니다.

코드를 수정한 뒤에는 `배포 > 배포 관리 > 수정 > 새 버전`으로 다시 배포해야 변경 내용이 웹앱에 반영됩니다.

기존 `appsScriptEndpoints.production`은 프로그램 신청 시스템 주소이므로 변경하지 않습니다.

## 5. 학생 이용 흐름

1. 이수증 또는 장학금 탭에서 신청 이메일 입력
2. 이메일로 받은 6자리 인증번호 입력
3. 이수증 탭에서 초급·중급 이수 현황 확인 후 이수증 PDF 발급
4. 장학금 탭에서 대상 여부 확인 후 은행·예금주·계좌번호 입력
5. 통장사본 첨부 및 개인정보 수집·이용 동의 후 제출

인증번호는 10분, 인증 세션은 마지막 요청으로부터 15분 동안 유효합니다.
제출이 완료되면 신청 내역과 비공개 파일이 저장되고, 해당 학생 행의 신청 상태와 신청 일시가
자동 갱신되며 신청번호가 포함된 접수 메일이 발송됩니다.

## 6. 보안 주의사항

- Google Sheet의 `웹에 게시` 기능을 사용하지 않습니다.
- 시트 편집 권한은 실제 업무 담당자에게만 부여합니다.
- 주민등록번호는 수집하지 않습니다.
- 경진대회·교육 접수에는 생년월일과 학적정보가 포함되므로 시트 편집 권한을 최소화하고
  개인정보 보유기간을 학생 동의문에 확정하여 안내한 뒤 기간 종료 시 삭제합니다.
- 계좌정보와 통장사본은 장학금 지급·정산 목적에만 사용합니다.
- 개인정보 처리방침과 동의문에 사업단의 정확한 보유기간을 명시하고, 기간 종료 후 삭제합니다.
- Apps Script 웹앱 URL만으로 개인정보를 조회할 수 없으며 이메일 인증을 통과해야 합니다.
- 발급된 이수증 PDF는 `링크가 있는 모든 사용자` 또는 학생 이메일에 공유하지 않습니다. 홈페이지 이메일 인증 세션을 확인한 뒤 Apps Script가 PDF 데이터를 직접 전달하므로 학생은 Google 로그인 없이 열거나 다운로드할 수 있습니다.
- 최종 배포 전 테스트용 학생 이메일과 가상 계좌·가상 통장사본으로 인증·조회·장학금 신청을 모두 확인합니다.
