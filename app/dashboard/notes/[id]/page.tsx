// app/dashboard/notes/[id]/page.tsx
// 노트 상세 페이지 - 특정 노트의 상세 내용을 표시하는 동적 라우트
// 사용자 인증, 권한 검증, 노트 데이터 로딩을 처리
// app/actions/notes.ts, components/notes/NoteDetail.tsx, lib/supabase-server.ts

import { Suspense } from 'react';
import { redirect, notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { getNoteById } from '@/app/actions/notes';
import NoteDetail from '@/components/notes/NoteDetail';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface NoteDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// 로딩 컴포넌트
function NoteDetailLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Card>
          <CardContent className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 노트 상세 컨텐츠 컴포넌트
async function NoteDetailContent({ noteId }: { noteId: string }) {
  const result = await getNoteById(noteId);

  if (!result.success) {
    if (result.error === '노트를 찾을 수 없습니다') {
      notFound();
    }
    
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link href="/dashboard">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드로 돌아가기
              </Button>
            </Link>
          </div>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex flex-col items-center justify-center py-12 px-6">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <FileText className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                노트를 불러올 수 없습니다
              </h3>
              <p className="text-red-600 text-center">
                {result.error}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <NoteDetail note={result.data} />;
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  // 사용자 인증 확인
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  const { id } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<NoteDetailLoading />}>
        <NoteDetailContent noteId={id} />
      </Suspense>
    </div>
  );
}
