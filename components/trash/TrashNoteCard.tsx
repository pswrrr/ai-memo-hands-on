'use client';

import { useState, useTransition } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { restoreNote, permanentDeleteNote } from '@/app/actions/notes';
import { toast } from 'sonner';
import PermanentDeleteDialog from './PermanentDeleteDialog';

interface TrashNote {
  id: string;
  title: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface TrashNoteCardProps {
  note: TrashNote;
  onDeleted: () => void;
  onRestored: () => void;
}

export default function TrashNoteCard({ note, onDeleted, onRestored }: TrashNoteCardProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  const handleRestore = () => {
    startTransition(async () => {
      try {
        const result = await restoreNote(note.id);
        
        if (result.success) {
          toast.success('노트가 복구되었습니다');
          onRestored();
        } else {
          toast.error(result.error || '노트 복구에 실패했습니다');
        }
      } catch (err) {
        console.error('복구 중 오류:', err);
        toast.error('노트 복구에 실패했습니다');
      }
    });
  };

  const truncateContent = (content: string | null, maxLength: number = 100) => {
    if (!content) return '내용 없음';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const daysUntilDeletion = note.deletedAt 
    ? Math.max(0, 30 - Math.floor((new Date().getTime() - new Date(note.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
            {note.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {truncateContent(note.content)}
          </p>
          
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-4">
            <Calendar className="h-3 w-3" />
            <span>삭제일: {note.deletedAt ? formatDate(note.deletedAt) : '알 수 없음'}</span>
          </div>

          <div className="mb-4">
            <div className="text-xs text-amber-600 font-medium">
              {daysUntilDeletion}일 후 영구 삭제됩니다
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleRestore}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  복구
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              영구 삭제
            </Button>
          </div>
        </CardContent>
      </Card>

      <PermanentDeleteDialog
        noteId={note.id}
        noteTitle={note.title}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={onDeleted}
      />
    </>
  );
}

