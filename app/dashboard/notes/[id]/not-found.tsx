// app/dashboard/notes/[id]/not-found.tsx
// 노트 상세 페이지 404 컴포넌트 - 존재하지 않는 노트에 접근할 때 표시
// 사용자에게 적절한 안내 메시지와 대시보드로 돌아가는 버튼 제공
// app/dashboard/notes/[id]/page.tsx, components/ui/card.tsx, components/ui/button.tsx

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileX } from 'lucide-react';

export default function NoteNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6">
            <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <FileX className="h-8 w-8 text-orange-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-orange-900 mb-2">
              노트를 찾을 수 없습니다
            </h1>
            
            <p className="text-orange-600 text-center mb-6">
              요청하신 노트가 존재하지 않거나 삭제되었을 수 있습니다.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard">
                <Button className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  대시보드로 돌아가기
                </Button>
              </Link>
              <Link href="/dashboard/notes/new">
                <Button variant="outline">
                  새 노트 작성
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
