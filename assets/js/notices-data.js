// 공지 내용은 이 배열에서 관리합니다. 새 공지는 고유한 id를 지정해 추가하세요.
// 첨부파일은 notices/files/에 두고 file에 "./files/파일명.pdf"처럼 적습니다.
window.BOOTCAMP_NOTICES = [
  {
    id: "winter-internship-2027",
    date: "2026-11-18",
    category: "프로그램 신청",
    title: "2027년 동계 인턴십 참여학생 모집",
    summary: "크라우드웍스·인피닉 각 2명 모집 · 11월 24일(화)까지 신청",
    facts: [
      { label: "모집기업", value: "크라우드웍스 2명 · 인피닉 2명" },
      { label: "인턴십 기간", value: "2027년 1월~2월(2개월)" },
      { label: "지원금", value: "학생 1인당 월 210만 원" },
      { label: "신청기한", value: "2026년 11월 24일(화)까지" },
      { label: "신청방법", value: "첨부된 인턴십 지원 신청서 작성 후 sunha1011@jbnu.ac.kr로 이메일 제출" },
      { label: "지원 자격", value: "중급 프로그램 이수 완료 또는 이수 중인 학생" }
    ],
    content: ["참여를 희망하는 학생은 기한 내 신청해 주시기 바랍니다."],
    images: [
      { file: "./files/KakaoTalk_20261118_143610878.png", alt: "크라우드웍스 동계 인턴십 참여학생 모집 카드뉴스", caption: "크라우드웍스 모집 안내" },
      { file: "./files/KakaoTalk_20261118_143614155.png", alt: "인피닉 동계 인턴십 참여학생 모집 카드뉴스", caption: "인피닉 모집 안내" }
    ],
    links: [
      { label: "신청 이메일 보내기", url: "mailto:sunha1011@jbnu.ac.kr" }
    ],
    attachments: [
      { name: "방산AI부트캠프사업단 인턴십 지원 신청서.hwp", file: "./files/방산AI부트캠프사업단_인턴십 지원 신청서.hwp" }
    ]
  },
  {
    id: "university-ai-cooperation-2026",
    date: "2026-10-20",
    category: "언론보도",
    title: "전주대·군산대·전북대, 첨단산업 인재양성 협의회 발족",
    summary: "세 대학 부트캠프 사업단이 교육 경험과 성과를 공유하고 현장 수요에 맞는 첨단산업 인재 양성에 협력합니다.",
    content: [
      "전주대학교·군산대학교·전북대학교의 부트캠프 사업단이 교육 경험과 성과를 공유하고, 현장 수요에 맞는 첨단산업 인재를 함께 양성하기로 했습니다.",
      "10월 16일 사업단 간 업무협약을 맺고 방산 AI·로봇 AX·피지컬 AI 분야의 특화 역량을 연계합니다."
    ],
    links: [
      { label: "기사 원문 보기", url: "https://www.todayan.com/news/articleView.html?idxno=634111" }
    ],
    attachments: []
  }
];
