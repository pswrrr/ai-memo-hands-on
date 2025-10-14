// app/auth/layout.tsx
// 인증 관련 페이지들의 공통 레이아웃을 담당하는 파일
// 회원가입, 로그인 등 모든 인증 페이지에서 공통으로 사용되는 레이아웃을 제공합니다
// 이 파일은 Next.js App Router의 레이아웃 시스템을 활용합니다
// 관련 파일: app/auth/signup/page.tsx, app/auth/login/page.tsx

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
