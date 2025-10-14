// components/auth/AuthLayout.tsx
// 인증 관련 페이지들의 공통 레이아웃을 담당하는 파일
// 회원가입, 로그인 등 인증 페이지에서 사용되는 공통 UI를 제공합니다
// 이 파일은 모든 인증 관련 페이지에서 사용됩니다
// 관련 파일: app/auth/signup/page.tsx, app/auth/login/page.tsx

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 로고 및 제목 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI 메모장
          </h1>
          <h2 className="text-xl text-gray-600 mb-6">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-gray-500 mb-8">
              {subtitle}
            </p>
          )}
        </div>

        {/* 폼 컨텐츠 */}
        {children}
      </div>

      {/* 푸터 */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2024 AI 메모장. 모든 권리 보유.
        </p>
      </div>
    </div>
  );
}
