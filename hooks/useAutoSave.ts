// hooks/useAutoSave.ts
// 자동 저장 기능을 위한 커스텀 훅
// 3초마다 변경사항을 자동으로 저장하고 저장 상태를 관리
// components/notes/NoteEditForm.tsx, app/actions/notes.ts

import { useCallback, useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<{ success: boolean; error?: string }>;
  delay?: number; // 자동 저장 지연 시간 (밀리초)
  enabled?: boolean; // 자동 저장 활성화 여부
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  save: () => Promise<void>;
  reset: () => void;
}

export function useAutoSave<T>(
  data: T,
  options: UseAutoSaveOptions
): UseAutoSaveReturn {
  const { onSave, delay = 3000, enabled = true } = options;
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // 자동 저장 실행
  const performSave = useCallback(async () => {
    if (isSavingRef.current) return;
    
    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      const result = await onSave(data);
      
      if (result.success) {
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // 2초 후 상태를 idle로 변경
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } else {
        setSaveStatus('error');
        console.error('자동 저장 실패:', result.error);
      }
    } catch (error) {
      setSaveStatus('error');
      console.error('자동 저장 오류:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave]);

  // 수동 저장
  const save = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await performSave();
  }, [performSave]);

  // 리셋
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setSaveStatus('idle');
    setLastSaved(null);
  }, []);

  // 자동 저장 타이머 설정
  useEffect(() => {
    if (!enabled) return;

    // 기존 타이머 클리어
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 새 타이머 설정
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);

    // 클린업
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, performSave]);

  // 컴포넌트 언마운트 시 타이머 클리어
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    saveStatus,
    lastSaved,
    save,
    reset,
  };
}
