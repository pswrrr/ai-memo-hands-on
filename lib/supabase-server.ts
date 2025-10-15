// lib/supabase-server.ts
// 서버 사이드 Supabase 클라이언트를 생성하는 파일
// Next.js Server Components에서 사용하기 위한 Supabase 클라이언트
// 쿠키를 사용하여 세션을 관리합니다
// 관련 파일: lib/supabase.ts, app/page.tsx

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Component에서는 set이 작동하지 않을 수 있음
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server Component에서는 remove가 작동하지 않을 수 있음
          }
        },
      },
    }
  )
}