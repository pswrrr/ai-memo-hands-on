// lib/session.ts
// 세션 관리 유틸리티 함수
// Story 1.6: 세션 상태 관리 구현
// 관련 파일: hooks/useSession.ts, components/auth/SessionProvider.tsx

import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

/**
 * 세션 만료 시간 확인
 * @param session 현재 세션
 * @returns 만료까지 남은 시간 (초)
 */
export function getTimeUntilExpiry(session: Session | null): number {
  if (!session) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at || 0;
  return Math.max(0, expiresAt - now);
}

/**
 * 세션이 곧 만료되는지 확인 (5분 전)
 * @param session 현재 세션
 * @returns 만료 임박 여부
 */
export function isSessionExpiring(session: Session | null): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(session);
  return timeUntilExpiry <= 300 && timeUntilExpiry > 0; // 5분 전
}

/**
 * 세션 자동 갱신이 필요한지 확인 (1분 전)
 * @param session 현재 세션
 * @returns 자동 갱신 필요 여부
 */
export function shouldRefreshSession(session: Session | null): boolean {
  const timeUntilExpiry = getTimeUntilExpiry(session);
  return timeUntilExpiry <= 60 && timeUntilExpiry > 0; // 1분 전
}

/**
 * 세션 자동 갱신
 * @returns 갱신 성공 여부
 */
export async function refreshSession(): Promise<boolean> {
  try {
    console.log('🔄 [lib/session.ts] 세션 갱신 시작');
    
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('❌ [lib/session.ts] 세션 갱신 실패:', error);
      return false;
    }
    
    console.log('✅ [lib/session.ts] 세션 갱신 완료');
    return true;
  } catch (error) {
    console.error('❌ [lib/session.ts] 세션 갱신 중 오류:', error);
    return false;
  }
}

/**
 * 세션 만료 경고 메시지 생성
 * @param session 현재 세션
 * @returns 경고 메시지
 */
export function getSessionWarningMessage(session: Session | null): string {
  const timeUntilExpiry = getTimeUntilExpiry(session);
  
  if (timeUntilExpiry <= 0) {
    return '세션이 만료되었습니다. 다시 로그인해주세요.';
  }
  
  const minutes = Math.ceil(timeUntilExpiry / 60);
  
  if (minutes <= 1) {
    return '세션이 곧 만료됩니다. 자동으로 갱신을 시도합니다.';
  } else if (minutes <= 5) {
    return `세션이 ${minutes}분 후 만료됩니다.`;
  }
  
  return '';
}

/**
 * 다중 탭 간 세션 동기화
 */
export function setupSessionSync() {
  if (typeof window === 'undefined') return;

  // Storage 이벤트 리스너 (다른 탭에서 세션 변경 감지)
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'supabase.auth.token') {
      console.log('🔄 [lib/session.ts] 다른 탭에서 세션 변경 감지');
      
      // 세션 상태 확인 및 동기화
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('✅ [lib/session.ts] 세션 동기화 완료');
        } else {
          console.log('🔓 [lib/session.ts] 세션 만료로 인한 동기화');
        }
      });
    }
  };

  window.addEventListener('storage', handleStorageChange);

  // 페이지 가시성 변경 시 세션 확인
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      console.log('👁️ [lib/session.ts] 페이지 포커스 복원, 세션 확인');
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          console.log('🔓 [lib/session.ts] 세션 만료 감지, 로그인 페이지로 리다이렉트');
          window.location.href = '/auth/login';
        }
      });
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 정리 함수 반환
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * 세션 상태 로컬 스토리지에 저장
 * @param session 현재 세션
 */
export function saveSessionToStorage(session: Session | null) {
  if (typeof window === 'undefined') return;

  try {
    if (session) {
      localStorage.setItem('session_expires_at', session.expires_at?.toString() || '0');
      localStorage.setItem('session_user_id', session.user?.id || '');
    } else {
      localStorage.removeItem('session_expires_at');
      localStorage.removeItem('session_user_id');
    }
  } catch (error) {
    console.error('❌ [lib/session.ts] 세션 저장 실패:', error);
  }
}

/**
 * 로컬 스토리지에서 세션 상태 복원
 * @returns 저장된 세션 정보
 */
export function getSessionFromStorage(): { expiresAt: number; userId: string } | null {
  if (typeof window === 'undefined') return null;

  try {
    const expiresAt = localStorage.getItem('session_expires_at');
    const userId = localStorage.getItem('session_user_id');
    
    if (expiresAt && userId) {
      return {
        expiresAt: parseInt(expiresAt, 10),
        userId
      };
    }
  } catch (error) {
    console.error('❌ [lib/session.ts] 세션 복원 실패:', error);
  }
  
  return null;
}

