// components/auth/SessionProvider.tsx
// 세션 프로바이더 컴포넌트
// Story 1.6: 세션 상태 관리 구현
// 관련 파일: contexts/AuthContext.tsx, hooks/useSession.ts

'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { setupSessionSync } from '@/lib/session';

interface SessionProviderProps {
  children: React.ReactNode;
}

export default function SessionProvider({ children }: SessionProviderProps) {
  useEffect(() => {
    // 다중 탭 간 세션 동기화 설정
    const cleanup = setupSessionSync();
    
    return () => {
      cleanup?.();
    };
  }, []);

  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
