// lib/supabase.ts
// Supabase 클라이언트 설정 파일
// 클라이언트 사이드에서 사용할 Supabase 클라이언트를 생성합니다
// 이 파일은 프로젝트의 모든 클라이언트 사이드 컴포넌트에서 Supabase 인스턴스를 사용할 수 있도록 합니다
// 관련 파일: app/auth/signup/page.tsx, components/auth/SignupForm.tsx, lib/auth.ts

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔧 [lib/supabase.ts] Supabase 브라우저 클라이언트 초기화');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 미설정');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ 설정됨' : '❌ 미설정');
console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

// 브라우저 클라이언트 생성 - 자동으로 쿠키에 세션 저장
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

console.log('✅ Supabase 브라우저 클라이언트 생성 완료 (쿠키 자동 저장 활성화)');

