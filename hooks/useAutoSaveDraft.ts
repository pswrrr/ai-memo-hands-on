// hooks/useAutoSaveDraft.ts
// 노트 작성 중 자동 임시 저장 커스텀 훅
// Story 2.9: 노트 작성 중 임시 저장

import { useCallback, useEffect, useRef, useState } from 'react';
import { saveDraft, loadDraft, clearDraft, hasDraft as checkHasDraft, type DraftData } from '@/lib/utils/draftStorage';

interface UseAutoSaveDraftOptions {
  userId: string;
  debounceMs?: number; // 기본값: 2000ms (2초)
}

interface UseAutoSaveDraftReturn {
  saveDraftNow: (title: string, content: string) => void;
  loadDraftData: () => DraftData | null;
  clearDraftData: () => void;
  hasDraft: boolean;
}

/**
 * 노트 임시 저장 자동화 훅
 * - 입력 후 지정된 시간(기본 2초) 후 자동 저장
 * - 로컬 스토리지 기반 임시 저장
 * - 7일 자동 만료
 */
export function useAutoSaveDraft(
  options: UseAutoSaveDraftOptions
): UseAutoSaveDraftReturn {
  const { userId, debounceMs = 2000 } = options;
  const [hasDraft, setHasDraft] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 임시 저장 데이터 존재 여부 확인
  useEffect(() => {
    const checkDraft = () => {
      const exists = checkHasDraft(userId);
      setHasDraft(exists);
    };

    checkDraft();
    
    // 주기적으로 확인 (다른 탭에서 삭제될 수 있음)
    const interval = setInterval(checkDraft, 5000);
    
    return () => clearInterval(interval);
  }, [userId]);

  // 즉시 저장 (디바운스 없음)
  const saveDraftNow = useCallback(
    (title: string, content: string) => {
      // 빈 제목과 빈 내용은 저장하지 않음
      if (!title.trim() && !content.trim()) {
        return;
      }

      saveDraft(userId, title, content);
      setHasDraft(true);
    },
    [userId]
  );

  // 디바운스된 저장 (자동 저장용)
  const saveDraftDebounced = useCallback(
    (title: string, content: string) => {
      // 기존 타이머 취소
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // 새 타이머 설정
      debounceTimerRef.current = setTimeout(() => {
        saveDraftNow(title, content);
      }, debounceMs);
    },
    [saveDraftNow, debounceMs]
  );

  // 임시 저장 데이터 로드
  const loadDraftData = useCallback(() => {
    return loadDraft(userId);
  }, [userId]);

  // 임시 저장 데이터 삭제
  const clearDraftData = useCallback(() => {
    clearDraft(userId);
    setHasDraft(false);
  }, [userId]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    saveDraftNow,
    loadDraftData,
    clearDraftData,
    hasDraft,
  };
}

