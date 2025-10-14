// lib/supabase-server.ts
// 서버 사이드 Supabase 클라이언트를 생성하는 파일
// Next.js Server Components에서 사용하기 위한 Supabase 클라이언트
// 쿠키를 사용하여 세션을 관리합니다
// 관련 파일: lib/supabase.ts, app/page.tsx

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  console.log('🔧 [lib/supabase-server.ts] 서버 Supabase 클라이언트 생성');
  
  const cookieStore = await cookies()
  
  // 모든 쿠키 출력
  const allCookies = cookieStore.getAll();
  console.log('현재 저장된 모든 쿠키:', allCookies.map(c => c.name));
  
  // Supabase 관련 쿠키 확인
  const authCookie = allCookies.find(c => c.name.includes('auth'));
  console.log('Supabase Auth 쿠키:', authCookie ? '✅ 존재함' : '❌ 없음');
  if (authCookie) {
    console.log('Auth 쿠키 이름:', authCookie.name);
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          console.log(`쿠키 읽기: ${name} = ${value ? '✅ 존재' : '❌ 없음'}`);
          return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            console.log(`쿠키 설정 시도: ${name}`);
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.log(`쿠키 설정 실패: ${name}`);
            // Server Component에서는 set이 작동하지 않을 수 있음
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            console.log(`쿠키 삭제 시도: ${name}`);
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.log(`쿠키 삭제 실패: ${name}`);
            // Server Component에서는 remove가 작동하지 않을 수 있음
          }
        },
      },
    }
  )
}