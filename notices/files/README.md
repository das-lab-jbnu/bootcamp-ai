# 공지사항 첨부파일

공지 첨부파일을 이 폴더에 넣고 `assets/js/notices-data.js`의 해당 공지에 연결합니다.

```javascript
attachments: [
  { name: "모집 안내문.pdf", file: "./files/recruitment-guide.pdf" }
]
```

`file` 경로는 `notices/detail.html`을 기준으로 적습니다. 파일명이 영문이면 링크 관리가 편리합니다. PDF, 이미지, 문서 파일을 연결할 수 있습니다. GitHub Pages에 올라간 첨부파일은 누구나 열 수 있으므로 학생 명단이나 개인정보가 담긴 파일은 넣지 마세요.
