// hooks/useSession.ts
// 세션 관리 훅
// Story 1.6: 세션 상태 관리 구현
// 관련 파일: contexts/AuthContext.tsx, lib/session.ts

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { Session } from '@supabase/supabase-js';

interface SessionInfo {
  isExpiring: boolean;
  timeUntilExpiry: number;
  shouldRefresh: boolean;
}

export function useSession() {
  const { session, refreshSession } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    isExpiring: false,
    timeUntilExpiry: 0,
    shouldRefresh: false
  });

  useEffect(() => {
    if (!session) {
      setSessionInfo({
        isExpiring: false,
        timeUntilExpiry: 0,
        shouldRefresh: false
      });
      return;
    }

    const checkSessionExpiry = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const timeUntilExpiry = expiresAt - now;
      
      // 5분 전에 경고 표시
      const isExpiring = timeUntilExpiry <= 300 && timeUntilExpiry > 0;
      // 1분 전에 자동 갱신 시도
      const shouldRefresh = timeUntilExpiry <= 60 && timeUntilExpiry > 0;

      setSessionInfo({
        isExpiring,
        timeUntilExpiry,
        shouldRefresh
      });

      console.log('🕐 [useSession] 세션 만료 시간:', {
        timeUntilExpiry,
        isExpiring,
        shouldRefresh
      });
    };

    // 초기 확인
    checkSessionExpiry();

    // 30초마다 세션 상태 확인
    const interval = setInterval(checkSessionExpiry, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [session]);

  // 자동 갱신 처리
  useEffect(() => {
    if (sessionInfo.shouldRefresh && session) {
      console.log('🔄 [useSession] 자동 세션 갱신 시작');
      refreshSession().catch((error) => {
        console.error('❌ [useSession] 자동 세션 갱신 실패:', error);
      });
    }
  }, [sessionInfo.shouldRefresh, refreshSession, session]);

  return {
    session,
    sessionInfo,
    refreshSession
  };
}

