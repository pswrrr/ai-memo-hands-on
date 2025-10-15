// components/notes/NoteCard.tsx
// 노트 카드 컴포넌트 - 개별 노트를 표시하는 카드 UI
// 노트 목록에서 각 노트의 제목, 내용 미리보기, 날짜를 표시
// components/notes/NoteList.tsx, app/dashboard/page.tsx, components/ui/card.tsx

'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

interface NoteCardProps {
  id: string;
  title: string;
  content?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function NoteCard({ 
  id, 
  title, 
  content, 
  createdAt, 
  updatedAt 
}: NoteCardProps) {
  // 제목이 30자를 초과하면 말줄임표로 표시
  const truncatedTitle = title.length > 30 ? `${title.substring(0, 30)}...` : title;
  
  // 내용 미리보기 (100자 제한)
  const preview = content ? 
    (content.length > 100 ? `${content.substring(0, 100)}...` : content) : 
    '내용이 없습니다';

  // 날짜 포맷팅
  const formatDate = (date: Date | string | undefined | null) => {
    try {
      if (!date) {
        return '날짜 없음';
      }
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!dateObj || isNaN(dateObj.getTime())) {
        return '날짜 없음';
      }
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(dateObj);
    } catch (error) {
      console.error('날짜 포맷팅 오류:', error, date);
      return '날짜 없음';
    }
  };

  // 시간 포맷팅
  const formatTime = (date: Date | string | undefined | null) => {
    try {
      if (!date) {
        return '시간 없음';
      }
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!dateObj || isNaN(dateObj.getTime())) {
        return '시간 없음';
      }
      return new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      console.error('시간 포맷팅 오류:', error, date);
      return '시간 없음';
    }
  };

  return (
    <Link href={`/dashboard/notes/${id}`} className="block">
      <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
            {truncatedTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {preview}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(createdAt)}</span>
            </div>
            {updatedAt && createdAt && new Date(updatedAt).getTime() !== new Date(createdAt).getTime() && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(updatedAt)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
