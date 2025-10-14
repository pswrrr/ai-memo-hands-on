'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { permanentDeleteNote } from '@/app/actions/notes';
import { toast } from 'sonner';

interface PermanentDeleteDialogProps {
  noteId: string;
  noteTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function PermanentDeleteDialog({
  noteId,
  noteTitle,
  open,
  onOpenChange,
  onDeleted,
}: PermanentDeleteDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await permanentDeleteNote(noteId);
        
        if (result.success) {
          toast.success('노트가 영구적으로 삭제되었습니다');
          onOpenChange(false);
          onDeleted();
        } else {
          setError(result.error || '노트 삭제에 실패했습니다');
          toast.error(result.error || '노트 삭제에 실패했습니다');
        }
      } catch (err) {
        console.error('삭제 중 오류:', err);
        setError('노트 삭제에 실패했습니다');
        toast.error('노트 삭제에 실패했습니다');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>영구 삭제 확인</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            <span className="font-semibold">&quot;{noteTitle}&quot;</span> 노트를 영구적으로 삭제하시겠습니까?
            <br />
            <br />
            <span className="text-red-600 font-semibold">
              이 작업은 되돌릴 수 없습니다!
            </span>
            <br />
            노트가 완전히 삭제되며 복구할 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                삭제 중...
              </>
            ) : (
              '영구 삭제'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

