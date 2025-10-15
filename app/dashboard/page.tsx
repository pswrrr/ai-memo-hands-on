// app/dashboard/page.tsx
// 메인 대시보드 페이지 (온보딩 완료 후)
// Story 1.5: 신규 사용자 온보딩 플로우 구현
// 관련 파일: components/dashboard/WelcomeMessage.tsx, lib/onboarding.ts

import { createServerSupabase } from '@/lib/supabase-server';
import WelcomeMessage from '@/components/dashboard/WelcomeMessage';
import LogoutButton from '@/components/auth/LogoutButton';
import SessionGuard from '@/components/auth/SessionGuard';
import OptimizedNoteList from '@/components/notes/OptimizedNoteList';
import SortSelect from '@/components/notes/SortSelect';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">인증이 필요합니다</h1>
          <p className="text-gray-600 mb-6">로그인이 필요합니다.</p>
          <a 
            href="/auth/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            로그인하기
          </a>
        </div>
      </div>
    );
  }

  return (
    <SessionGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI 메모장</h1>
              <p className="text-gray-600">음성과 텍스트로 메모하고, AI가 요약해드립니다</p>
            </div>
            <LogoutButton />
          </div>

          {/* 환영 메시지 */}
          <WelcomeMessage user={user} />

          {/* 메인 콘텐츠 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {/* 음성 메모 카드 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">음성 메모</h3>
              </div>
              <p className="text-gray-600 mb-4">음성으로 빠르게 메모를 작성하고 자동으로 텍스트로 변환됩니다.</p>
              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                음성 메모 시작
              </button>
            </div>

            {/* 텍스트 메모 카드 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">텍스트 메모</h3>
              </div>
              <p className="text-gray-600 mb-4">키보드로 메모를 작성하고 AI가 자동으로 요약과 태그를 생성합니다.</p>
              <Link 
                href="/dashboard/notes/new"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors inline-block text-center"
              >
                텍스트 메모 작성
              </Link>
            </div>

            {/* AI 요약 카드 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">AI 요약</h3>
              </div>
              <p className="text-gray-600 mb-4">AI가 메모를 분석하여 핵심 내용을 요약하고 관련 태그를 자동 생성합니다.</p>
              <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
                AI 요약 보기
              </button>
            </div>
          </div>

          {/* 노트 목록 섹션 */}
          <div className="mt-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">내 노트</h2>
              <div className="flex gap-2">
                <Link href="/dashboard/trash">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    휴지통
                  </Button>
                </Link>
                <Link href="/dashboard/notes/new">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    새 노트 작성
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* 정렬 옵션 */}
            <div className="mb-4">
              <SortSelect />
            </div>
            
            <OptimizedNoteList />
          </div>
        </div>
      </div>
    </SessionGuard>
  );
}
