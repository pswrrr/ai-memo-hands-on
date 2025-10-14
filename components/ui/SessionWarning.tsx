// components/ui/SessionWarning.tsx
// 세션 만료 경고 컴포넌트
// Story 1.6: 세션 상태 관리 구현
// 관련 파일: hooks/useSession.ts, components/auth/SessionGuard.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { getSessionWarningMessage } from '@/lib/session';

export default function SessionWarning() {
  const { session, sessionInfo, refreshSession } = useSession();
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    if (!session) {
      setShowWarning(false);
      return;
    }

    const message = getSessionWarningMessage(session);
    
    if (message) {
      setWarningMessage(message);
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [session, sessionInfo]);

  const handleRefresh = async () => {
    try {
      console.log('🔄 [SessionWarning] 수동 세션 갱신 시작');
      await refreshSession();
      setShowWarning(false);
    } catch (error) {
      console.error('❌ [SessionWarning] 세션 갱신 실패:', error);
    }
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              세션 만료 경고
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              {warningMessage}
            </p>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleRefresh}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                갱신하기
              </button>
              <button
                onClick={handleDismiss}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

