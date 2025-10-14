import { Suspense } from 'react';
import CreateNoteForm from '@/components/notes/CreateNoteForm';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';

export default async function NewNotePage() {
  // 사용자 인증 확인
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">새 노트 작성</h1>
          <p className="text-muted-foreground mt-2">
            아이디어와 메모를 저장하세요
          </p>
        </div>
        
        <Suspense fallback={<div>로딩 중...</div>}>
          <CreateNoteForm />
        </Suspense>
      </div>
    </div>
  );
}
