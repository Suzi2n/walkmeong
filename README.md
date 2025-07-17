# 🐶 산책멍소

> 직접 만든 산책 코스를 나누고, 산책 중 특별한 순간을 다른 견주들과 공유하며 산책을 즐겁게 바꿔주는 반려견 산책 서비스 (React + TypeScript 기반)


## 🚀 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Code Quality**: ESLint + Prettier

## 📁 프로젝트 구조
```
src/
├── assets/ # 이미지, 로고 등 정적 파일
├── components/ # 재사용 가능한 UI 컴포넌트
├── hooks/ # 커스텀 훅
├── pages/ # 라우팅되는 페이지 컴포넌트
├── routes/ # 라우터 설정
├── styles/ # 전역 스타일, Tailwind, CSS 등
├── utils/ # 유틸 함수
└── App.tsx # 루트 컴포넌트
```

## 🛣️ 라우팅 구조

| 경로 | 설명 |
|------|------|
| `/` | 홈 페이지 |
| `/login` | 로그인 |
| `/signup` | 회원가입 |
| `/my` | 마이페이지 |


## 🎨 코드 스타일

ESLint와 Prettier를 적용하여 일관된 코드 스타일을 유지하도록 했습니다.
