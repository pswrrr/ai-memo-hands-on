// lib/supabase-server.ts
// ?œë²„ ?¬ì´??Supabase ?´ë¼?´ì–¸?¸ë? ?ì„±?˜ëŠ” ?Œì¼
// Next.js Server Components?ì„œ ?¬ìš©?˜ê¸° ?„í•œ Supabase ?´ë¼?´ì–¸??
// ì¿ í‚¤ë¥??¬ìš©?˜ì—¬ ?¸ì…˜??ê´€ë¦¬í•©?ˆë‹¤
// ê´€???Œì¼: lib/supabase.ts, app/page.tsx

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerSupabase() {
  
  const cookieStore = await cookies()
  
  // ëª¨ë“  ì¿ í‚¤ ì¶œë ¥
  const allCookies = cookieStore.getAll();
  console.log('?„ì¬ ?€?¥ëœ ëª¨ë“  ì¿ í‚¤:', allCookies.map(c => c.name));
  
  // Supabase ê´€??ì¿ í‚¤ ?•ì¸
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
                      // Server Component?ì„œ??set???‘ë™?˜ì? ?Šì„ ???ˆìŒ
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
                      cookieStore.set({ name, value: '', ...options })
          } catch (error) {
                      // Server Component?ì„œ??removeê°€ ?‘ë™?˜ì? ?Šì„ ???ˆìŒ
          }
        },
      },
    }
  )
}
