// components/auth/SessionGuard.tsx
// 세션 가드 컴포넌트
// Story 1.6: 세션 상태 관리 구현
// 관련 파일: hooks/useAuth.ts, components/ui/SessionWarning.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SessionWarning from '@/components/ui/SessionWarning';

interface SessionGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export default function SessionGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/login' 
}: SessionGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      console.log('🔓 [SessionGuard] 인증되지 않은 사용자, 리다이렉트');
      router.push(redirectTo);
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">세션 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증이 필요한데 사용자가 없는 경우
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">인증이 필요합니다</h1>
          <p className="text-gray-600 mb-6">로그인이 필요합니다.</p>
          <a 
            href="/auth/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <SessionWarning />
    </>
  );
}

