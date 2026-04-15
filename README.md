# Bootcamp AI Website

전북대학교 방산 AI 인재양성 부트캠프 공식 웹사이트 초기 프로젝트입니다.

## 목적

- 부트캠프 비전, 교육과정, 참여기업, 교수진/인프라, 학생지원 정보를 한 곳에서 제공
- 수험생/재학생/산업체 대상 핵심 정보를 빠르게 안내

## 기술 스택

- HTML5
- Tailwind CSS (CDN)
- Vanilla JavaScript (ES6+)
- GitHub Pages 배포를 고려한 정적 구조

## 정보 구조

- `/index.html`: 메인 소개
- `/about/index.html`: 사업단 소개
- `/curriculum/index.html`: 4대 트랙 및 교육 로드맵
- `/partners/index.html`: 참여기업 소개
- `/faculty/index.html`: 교수진 및 인프라
- `/support/index.html`: 학생지원 및 모집 안내

## 개발 원칙

- 모든 페이지 공통 헤더/푸터 유지
- 모바일 우선 반응형 구성
- 다량 텍스트/목록은 `assets/js/data.js`에 저장 후 렌더링
