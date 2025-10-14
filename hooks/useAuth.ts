// hooks/useAuth.ts
// 인증 상태 관리 훅
// Story 1.6: 세션 상태 관리 구현
// 관련 파일: contexts/AuthContext.tsx, components/auth/SessionProvider.tsx

import { useAuth as useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  return useAuthContext();
}

