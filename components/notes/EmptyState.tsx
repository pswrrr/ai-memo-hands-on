// components/notes/EmptyState.tsx
// 빈 상태 컴포넌트 - 노트가 없을 때 표시되는 UI
// 사용자에게 첫 노트 작성을 유도하는 안내 메시지와 버튼 제공
// components/notes/NoteList.tsx, app/dashboard/page.tsx, components/ui/button.tsx

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus } from 'lucide-react';

export default function EmptyState() {
  return (
    <Card className="border-dashed border-2 border-gray-200">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          아직 노트가 없습니다
        </h3>
        
        <p className="text-gray-500 text-center mb-6 max-w-sm">
          첫 번째 노트를 작성해보세요. 아이디어, 메모, 생각을 자유롭게 기록할 수 있습니다.
        </p>
        
        <Link href="/dashboard/notes/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            새 노트 작성
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
