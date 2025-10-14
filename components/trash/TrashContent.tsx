'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { getTrashNotes } from '@/app/actions/notes';
import TrashNoteCard from './TrashNoteCard';
import EmptyState from '@/components/notes/EmptyState';

interface TrashNote {
  id: string;
  title: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalNotes: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function TrashContent() {
  const [notes, setNotes] = useState<TrashNote[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getTrashNotes(page, 12);
      
      if (result.success && result.data) {
        setNotes(result.data.notes);
        setPagination(result.data.pagination);
      } else {
        setError(result.error || '휴지통 노트를 불러오는데 실패했습니다');
      }
    } catch (err) {
      console.error('노트 목록 로드 오류:', err);
      setError('휴지통 노트를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleNoteDeleted = () => {
    // 노트가 삭제되면 목록 새로고침
    loadNotes(pagination?.currentPage || 1);
  };

  const handleNoteRestored = () => {
    // 노트가 복구되면 목록 새로고침
    loadNotes(pagination?.currentPage || 1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              대시보드로 돌아가기
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Trash2 className="h-8 w-8" />
                휴지통
              </h1>
              <p className="text-gray-600 mt-2">
                삭제된 노트는 30일 동안 보관됩니다
              </p>
            </div>
          </div>
        </div>

        {/* 노트 목록 */}
        {notes.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title="휴지통이 비어있습니다"
            description="삭제된 노트가 없습니다"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {notes.map((note) => (
                <TrashNoteCard
                  key={note.id}
                  note={note}
                  onDeleted={handleNoteDeleted}
                  onRestored={handleNoteRestored}
                />
              ))}
            </div>

            {/* 페이지네이션 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => loadNotes(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  이전
                </Button>
                <div className="flex items-center gap-2 px-4">
                  <span className="text-sm text-gray-600">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => loadNotes(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

