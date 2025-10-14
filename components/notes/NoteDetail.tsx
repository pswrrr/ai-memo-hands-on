// components/notes/NoteDetail.tsx
// 노트 상세 컴포넌트 - 노트의 전체 내용과 메타데이터를 표시
// 수정/삭제 버튼과 뒤로가기 기능을 제공하는 상세 뷰
// 편집 모드 토글 기능을 포함한 통합 컴포넌트
// app/dashboard/notes/[id]/page.tsx, components/notes/NoteEditForm.tsx, components/ui/card.tsx, components/ui/button.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import NoteEditForm from './NoteEditForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface Note {
  id: string;
  title: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NoteDetailProps {
  note: Note;
}

export default function NoteDetail({ note }: NoteDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // 상대 시간 포맷팅
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;
    return formatDate(date);
  };

  const isRecentlyUpdated = note.updatedAt.getTime() !== note.createdAt.getTime();

  // 편집 모드 토글
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // 편집 모드일 때 편집 폼 표시
  if (isEditing) {
    return <NoteEditForm note={note} onCancel={handleCancelEdit} />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              대시보드로 돌아가기
            </Button>
          </Link>
        </div>

        {/* 노트 상세 내용 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {note.title}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>작성일: {formatDate(note.createdAt)}</span>
                  </div>
                  {isRecentlyUpdated && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>수정일: {formatDate(note.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  수정
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="prose prose-gray max-w-none">
              {note.content ? (
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {note.content}
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  내용이 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 메타데이터 */}
        <div className="mt-6 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>노트 ID: {note.id}</span>
            {isRecentlyUpdated && (
              <span>마지막 수정: {formatRelativeTime(note.updatedAt)}</span>
            )}
          </div>
        </div>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        noteId={note.id}
        noteTitle={note.title}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
