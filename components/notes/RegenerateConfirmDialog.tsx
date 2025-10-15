'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface RegenerateConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'summary' | 'tags';
  isLoading?: boolean;
}

export default function RegenerateConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  isLoading = false
}: RegenerateConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {type === 'summary' ? '요약 재생성' : '태그 재생성'}
          </DialogTitle>
          <DialogDescription>
            기존 {type === 'summary' ? '요약' : '태그'}을 삭제하고 새로운 {type === 'summary' ? '요약' : '태그'}을 생성하시겠습니까?
            <br />
            <span className="text-amber-600 font-medium">이 작업은 되돌릴 수 없습니다.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                재생성 중...
              </>
            ) : (
              '재생성'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

