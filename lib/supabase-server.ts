// lib/supabase-server.ts
// ?�버 ?�이??Supabase ?�라?�언?��? ?�성?�는 ?�일
// Next.js Server Components?�서 ?�용?�기 ?�한 Supabase ?�라?�언??
// 쿠키�??�용?�여 ?�션??관리합?�다
// 관???�일: lib/supabase.ts, app/page.tsx

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  
  const cookieStore = await cookies()
  
  // 모든 쿠키 출력
  const allCookies = cookieStore.getAll();
  console.log('?�재 ?�?�된 모든 쿠키:', allCookies.map(c => c.name));
  
  // Supabase 관??쿠키 ?�인
  const authCookie = allCookies.find(c => c.name.includes('auth'));
  if (authCookie) {
    }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
                  return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
                      cookieStore.set({ name, value, ...options })
          } catch (error) {
                      // Server Component?�서??set???�동?��? ?�을 ???�음
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
                      cookieStore.set({ name, value: '', ...options })
          } catch (error) {
                      // Server Component?�서??remove가 ?�동?��? ?�을 ???�음
          }
        },
      },
    }
  )
}
