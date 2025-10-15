// lib/supabase-server.ts
// 서버 사이드 Supabase 클라이언트를 생성하는 파일
// Next.js Server Components에서 사용하기 위한 Supabase 클라이언트
// 쿠키를 사용하여 세션을 관리합니다
// 관련 파일: lib/supabase.ts, app/page.tsx

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// 환경 변수 안전하게 가져오기
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 빌드 시점에서는 환경 변수가 없을 수 있으므로 기본값 제공
  return {
    url: supabaseUrl || 'https://djtohfpztbsbxpyephml.supabase.co',
    key: supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdG9oZnB6dGJzYnhweWVwaG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MDkxMDIsImV4cCI6MjA3NTk4NTEwMn0.3Ydki15Z03gM7NDwc5o_ZWu0djLd-kO6KzMJApkqnUI'
  }
}

export async function createServerSupabase() {
  const cookieStore = await cookies()
  const config = getSupabaseConfig()

  return createServerClient(
    config.url,
    config.key,
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