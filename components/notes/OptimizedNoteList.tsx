// 최적화된 노트 목록 컴포넌트
// 캐싱, 로딩 상태 개선, 성능 최적화를 통한 사용자 경험 향상

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOptimizedNotes, type SortOption } from '@/app/actions/optimized-notes';
import { checkOnboardingStatus } from '@/lib/onboarding';
import NoteCard from './NoteCard';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { StickyNote, RefreshCw } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string | null;
  created_at: Date;
  updated_at: Date;
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
  fromCache?: boolean;
  executionTime?: number;
}

export default function OptimizedNoteList() {
  const searchParams = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);
  const [fromCache, setFromCache] = useState(false);

  // 메모이제이션된 정렬 옵션
  const sortBy = useMemo(() => {
    return (searchParams.get('sort') as SortOption) || 'newest';
  }, [searchParams]);

  // 메모이제이션된 페이지 번호
  const page = useMemo(() => {
    return parseInt(searchParams.get('page') || '1', 10);
  }, [searchParams]);

  // 최적화된 노트 로드 함수
  const loadNotes = useCallback(async (pageNum: number = 1, sortOption: SortOption = 'newest') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const startTime = Date.now();
      const response: NotesResponse = await getOptimizedNotes(pageNum, 10, sortOption);
      const loadTime = Date.now() - startTime;
      
      if (response.success && response.data) {
        setNotes(response.data.notes);
        setPagination(response.data.pagination);
        setCurrentPage(pageNum);
        setLastLoadTime(loadTime);
        setFromCache(response.fromCache || false);
        
        // 성능 로깅
        if (response.fromCache) {
          console.log(`📦 캐시에서 로드: ${loadTime}ms`);
        } else {
          console.log(`⚡ DB에서 로드: ${loadTime}ms`);
        }
      } else {
        setError(response.error || '노트를 불러오는데 실패했습니다');
      }
    } catch (err) {
      setError('예상치 못한 오류가 발생했습니다');
      console.error('노트 로드 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 페이지 변경 핸들러 (메모이제이션)
  const handlePageChange = useCallback((pageNum: number) => {
    loadNotes(pageNum, sortBy);
  }, [loadNotes, sortBy]);

  // 재시도 핸들러 (메모이제이션)
  const handleRetry = useCallback(() => {
    loadNotes(currentPage, sortBy);
  }, [loadNotes, currentPage, sortBy]);

  // 새로고침 핸들러 (캐시 무효화)
  const handleRefresh = useCallback(() => {
    // 캐시 무효화를 위해 강제 새로고침
    setNotes([]);
    setPagination(null);
    loadNotes(currentPage, sortBy);
  }, [loadNotes, currentPage, sortBy]);

  // 초기 로드 및 URL 파라미터 변경 감지
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 온보딩 상태와 노트 로드를 병렬로 처리
        const [completed] = await Promise.all([
          checkOnboardingStatus(),
          loadNotes(page, sortBy)
        ]);
        
        setIsOnboardingComplete(completed);
      } catch (error) {
        console.error('초기화 중 오류:', error);
        setIsOnboardingComplete(false);
        loadNotes(page, sortBy);
      }
    };

    initializeData();
  }, [page, sortBy, loadNotes]);

  // 로딩 상태 (개선된 UI)
  if (isLoading) {
    return (
      <div className="space-y-4">
        <LoadingState />
        {lastLoadTime && (
          <div className="text-center text-sm text-gray-500">
            {fromCache ? '캐시에서 로드 중...' : '데이터베이스에서 로드 중...'}
          </div>
        )}
      </div>
    );
  }

  // 에러 상태 (개선된 UI)
  if (error) {
    return (
      <div className="space-y-4">
        <ErrorState error={error} onRetry={handleRetry} />
        <div className="text-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            강제 새로고침
          </button>
        </div>
      </div>
    );
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

  // 노트 목록 표시 (성능 정보 포함)
  return (
    <div className="space-y-6">
      {/* 성능 정보 표시 */}
      {lastLoadTime && (
        <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            {fromCache ? (
              <>
                <span className="text-green-600">📦</span>
                <span>캐시에서 로드됨</span>
              </>
            ) : (
              <>
                <span className="text-blue-600">⚡</span>
                <span>데이터베이스에서 로드됨</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>로딩 시간: {lastLoadTime}ms</span>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              새로고침
            </button>
          </div>
        </div>
      )}

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

      {/* 통계 정보 */}
      {pagination && (
        <div className="text-center text-sm text-gray-500">
          총 {pagination.totalNotes}개의 노트 중 {notes.length}개 표시
        </div>
      )}
    </div>
  );
}
