// components/notes/NoteList.tsx
// 노트 목록 컴포넌트 - 노트 목록과 페이지네이션을 관리하는 메인 컴포넌트
// 서버에서 노트 데이터를 받아와서 NoteCard, Pagination 등 하위 컴포넌트들을 조합
// app/dashboard/page.tsx, components/notes/NoteCard.tsx, components/notes/Pagination.tsx

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getNotes, type SortOption } from '@/app/actions/notes';
import { checkOnboardingStatus } from '@/lib/onboarding';
import NoteCard from './NoteCard';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { StickyNote } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalNotes: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface NotesResponse {
  success: boolean;
  data?: {
    notes: Note[];
    pagination: PaginationInfo;
  };
  error?: string;
}

export default function NoteList() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // 노트 목록 로드 함수
  const loadNotes = async (page: number = 1, sortBy: SortOption = 'newest') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response: NotesResponse = await getNotes(page, 10, sortBy);
      
      if (response.success && response.data) {
        setNotes(response.data.notes);
        setPagination(response.data.pagination);
        setCurrentPage(page);
      } else {
        setError(response.error || '노트를 불러오는데 실패했습니다');
      }
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다');
      console.error('노트 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    const sortBy = (searchParams.get('sort') as SortOption) || 'newest';
    loadNotes(page, sortBy);
  };

  // 재시도 핸들러
  const handleRetry = () => {
    const sortBy = (searchParams.get('sort') as SortOption) || 'newest';
    loadNotes(currentPage, sortBy);
  };

  // 초기 로드 및 URL 파라미터 변경 감지 (온보딩 상태 확인 포함)
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 온보딩 상태와 노트 로드를 병렬로 처리
        const [completed] = await Promise.all([
          checkOnboardingStatus(),
          (() => {
            const page = parseInt(searchParams.get('page') || '1', 10);
            const sortBy = (searchParams.get('sort') as SortOption) || 'newest';
            return loadNotes(page, sortBy);
          })()
        ]);
        
        setIsOnboardingComplete(completed);
      } catch (error) {
        console.error('초기화 중 오류:', error);
        // 오류가 발생해도 기본값으로 설정
        setIsOnboardingComplete(false);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const sortBy = (searchParams.get('sort') as SortOption) || 'newest';
        loadNotes(page, sortBy);
      }
    };

    initializeData();
  }, [searchParams]);

  // 로딩 상태
  if (isLoading) {
    return <LoadingState />;
  }

  // 에러 상태
  if (error) {
    return <ErrorState error={error} onRetry={handleRetry} />;
  }

  // 빈 상태
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={StickyNote}
        title={isOnboardingComplete ? "아직 노트가 없습니다" : "AI 메모장에 오신 것을 환영합니다! 🎉"}
        description={
          isOnboardingComplete
            ? "첫 번째 노트를 작성해보세요. 아이디어, 메모, 생각을 자유롭게 기록할 수 있습니다."
            : "첫 번째 노트를 작성해보세요. 아이디어, 메모, 생각을 자유롭게 기록할 수 있습니다."
        }
        actionLabel={isOnboardingComplete ? "새 노트 작성" : "첫 노트 작성하기"}
        actionHref="/dashboard/notes/new"
      />
    );
  }

  // 노트 목록 표시
  return (
    <div className="space-y-6">
      {/* 노트 목록 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            id={note.id}
            title={note.title}
            content={note.content}
            createdAt={note.created_at}
            updatedAt={note.updated_at}
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
