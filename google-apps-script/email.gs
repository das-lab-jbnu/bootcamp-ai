function sendSubmissionEmail(application) {
  const subject = `[전북대 방산 AI 부트캠프] ${application.program} 신청 접수 안내`;
  const timestamp = Utilities.formatDate(application.timestamp, CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  const body = [
    `${application.name}님, 신청이 정상적으로 접수되었습니다.`,
    "",
    `신청 프로그램: ${application.program}`,
    `신청 시간: ${timestamp}`,
    `신청 ID: ${application.application_id}`,
    `신청 상태: ${application.status}`,
    "",
    "신청 내역 조회 페이지에서 신청 내용을 확인하거나 수정할 수 있습니다."
  ].join("\n");

  GmailApp.sendEmail(application.email, subject, body);
}
