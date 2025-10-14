import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import TrashContent from '@/components/trash/TrashContent';
import TrashLoading from '@/components/trash/TrashLoading';

export default async function TrashPage() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<TrashLoading />}>
        <TrashContent />
      </Suspense>
    </div>
  );
}

