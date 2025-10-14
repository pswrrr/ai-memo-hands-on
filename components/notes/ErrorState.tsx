// components/notes/ErrorState.tsx
// 에러 상태 컴포넌트 - 노트 목록 로딩 실패 시 표시되는 UI
// 사용자에게 에러 상황을 알리고 재시도 옵션을 제공
// components/notes/NoteList.tsx, app/dashboard/page.tsx, components/ui/button.tsx

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          노트를 불러올 수 없습니다
        </h3>
        
        <p className="text-red-600 text-center mb-6 max-w-sm">
          {error}
        </p>
        
        {onRetry && (
          <Button 
            variant="outline" 
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
