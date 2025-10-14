'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

interface SortSelectProps {
  className?: string;
}

const SORT_OPTIONS = [
  { value: 'newest' as const, label: '최신순' },
  { value: 'oldest' as const, label: '과거순' },
  { value: 'title_asc' as const, label: '제목순 (가나다)' },
  { value: 'title_desc' as const, label: '제목 역순 (하→가)' },
];

const LOCAL_STORAGE_KEY = 'notesSortOption';

export default function SortSelect({ className }: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // 초기 정렬 옵션 로드 (URL > localStorage > 기본값)
  useEffect(() => {
    const urlSort = searchParams.get('sort') as SortOption | null;
    const storageSort = localStorage.getItem(LOCAL_STORAGE_KEY) as SortOption | null;
    
    const initialSort = urlSort || storageSort || 'newest';
    
    // 유효한 정렬 옵션인지 확인
    if (SORT_OPTIONS.some(opt => opt.value === initialSort)) {
      setSortBy(initialSort);
    }
  }, [searchParams]);

  const handleSortChange = (value: SortOption) => {
    setIsLoading(true);
    setSortBy(value);

    // localStorage에 저장
    localStorage.setItem(LOCAL_STORAGE_KEY, value);

    // URL 업데이트 (페이지 1로 리셋)
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    params.set('page', '1'); // 정렬 변경 시 첫 페이지로 이동
    
    router.push(`/dashboard?${params.toString()}`);
    
    // 로딩 상태는 router.push가 완료되면 자동으로 해제됨
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className={className}>
      <Select
        value={sortBy}
        onValueChange={handleSortChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[180px]">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            <SelectValue />
          </div>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

