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

manifest에는 고급 Drive 서비스와 `drive.file` 제한 권한이 포함됩니다. 이 권한은 전체 Drive를
열람하는 권한이 아니라, 이 Apps Script가 직접 만든 웹신청 전용 폴더와 파일만 관리합니다.

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

경진대회와 신규 초급과정 접수를 위해 아래 탭도 함께 사용합니다.

- `idea_contest_teams`: 팀별 접수번호, 대표자, 팀명, 아이디어 주제, 접수 상태
- `idea_contest_members`: 대표자와 팀원 3~5명의 학번, 성명, 전화번호, 이메일, 학과
- `program_applications`: AI Agent·바이브코딩·생성형 AI 기본과정의 개인별 신청정보와 생성형 AI 서비스 지원 수요

경진대회는 대표자 이메일 또는 팀명이 같으면 중복 접수를 차단합니다. 초급과정은
`program + email` 또는 `program + student_id`가 같으면 중복 접수를 차단합니다.
접수 시 대표자 또는 신청자 이메일로 접수번호가 발송됩니다.

신규 접수 기능을 추가한 뒤에는 `setupBenefitsSheet`를 다시 실행하여 세 탭의 헤더와
드롭다운을 확인하고, `runBenefitsSmokeTest`를 실행한 다음 웹앱을 새 버전으로 배포합니다.
현재 신규 프로그램은 모집예정 상태이므로 `Code.gs`의 `APPLICATIONS_OPEN`이 `false`로
설정되어 있습니다. 접수를 시작할 때는 이 값을 `true`로 변경하고 홈페이지 접수 버튼을 활성화합니다.

## 2. 이수증 파일

`basic_certificate_url`, `intermediate_certificate_url`에는 HTTPS 이수증 링크를 입력합니다.
Google Drive를 사용하는 경우 파일을 `링크가 있는 모든 사용자`에게 공개하지 말고 해당 학생 이메일에만 공유하는 것을 권장합니다.
학생 화면에서는 이수 상태가 `이수`이고 URL이 입력된 경우에만 발급 버튼이 나타납니다.

## 3. 장학금 계좌정보와 통장사본

학생은 이메일 인증 후 은행, 예금주, 계좌번호와 통장사본을 제출합니다.

- 허용 파일: PDF, JPG, PNG
- 최대 크기: 5MB
- 파일명: 원본 이름을 저장하지 않고 무작위 신청번호로 변경
- 저장 위치: `setupBenefitsSheet`가 만든 `[비공개] 학생 장학금 통장사본 (웹신청 전용)` 폴더
- Drive 권한: Apps Script가 만든 폴더와 파일만 접근하는 `drive.file`

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

1. 신청 이메일 입력
2. 이메일로 받은 6자리 인증번호 입력
3. 초급·중급 이수 현황과 이수증 확인
4. 장학금 대상자인 경우 은행·예금주·계좌번호 입력
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
- 최종 배포 전 테스트용 학생 이메일과 가상 계좌·가상 통장사본으로 인증·조회·장학금 신청을 모두 확인합니다.
