// middleware.ts
// ë³´í˜¸???¼ìš°??ë¯¸ë“¤?¨ì–´
// Story 1.6: ?¸ì…˜ ?íƒœ ê´€ë¦?êµ¬í˜„
// ê´€???Œì¼: lib/supabase-server.ts, app/dashboard/page.tsx

import { createServerSupabase } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ë³´í˜¸???¼ìš°??ëª©ë¡
const protectedRoutes = [
  '/dashboard',
  '/notes',
  '/profile',
  '/settings'
];

// ?¸ì¦???„ìš” ?†ëŠ” ?¼ìš°??ëª©ë¡
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/update-password',
  '/onboarding'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  

  // ?•ì  ?Œì¼?€ ?µê³¼
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // ê³µê°œ ?¼ìš°?¸ëŠ” ?µê³¼
  if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
  }

  // ë³´í˜¸???¼ìš°???•ì¸
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
      return NextResponse.next();
  }

  try {
      
    // Supabase ?œë²„ ?´ë¼?´ì–¸?¸ë¡œ ?¸ì…˜ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('??[middleware.ts] ?¸ì¦ ?•ì¸ ?¤íŒ¨:', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (!user) {
          return NextResponse.redirect(new URL('/auth/login', request.url));
    }

      
    // ?¸ì¦???¬ìš©?ì˜ ê²½ìš° ?¨ë³´???„ë£Œ ?¬ë? ?•ì¸
    if (pathname === '/dashboard') {
      const onboardingCompleted = user.user_metadata?.onboarding_completed;
      
      if (!onboardingCompleted) {
              return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('??[middleware.ts] ë¯¸ë“¤?¨ì–´ ì²˜ë¦¬ ì¤??¤ë¥˜:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


