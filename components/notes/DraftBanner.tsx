// components/notes/DraftBanner.tsx
// 임시 저장된 노트 복원 배너 컴포넌트
// Story 2.9: 노트 작성 중 임시 저장

'use client';

import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type DraftData } from '@/lib/utils/draftStorage';

interface DraftBannerProps {
  draftData: DraftData;
  onRestore: (data: DraftData) => void;
  onDiscard: () => void;
}

/**
 * 임시 저장 복원 배너 컴포넌트
 * - 임시 저장된 노트가 있을 때 표시
 * - 복원 또는 삭제 선택 가능
 * - 저장 시간 표시
 */
export default function DraftBanner({
  draftData,
  onRestore,
  onDiscard,
}: DraftBannerProps) {
  // 저장 시간을 상대적으로 표시
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    return `${days}일 전`;
  };

  return (
    <div
      className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 animate-in slide-in-from-top duration-300"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">
            임시 저장된 노트가 있습니다
          </h3>
          <p className="text-sm text-yellow-800 mb-3">
            {getRelativeTime(draftData.savedAt)} 저장됨
            {draftData.title && (
              <> · <span className="font-medium">"{draftData.title}"</span></>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => onRestore(draftData)}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              복원하기
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDiscard}
              className="border-yellow-300 text-yellow-900 hover:bg-yellow-100"
            >
              삭제하기
            </Button>
          </div>
        </div>

        <button
          onClick={onDiscard}
          className="text-yellow-600 hover:text-yellow-800 transition-colors p-1"
          aria-label="배너 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

