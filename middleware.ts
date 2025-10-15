// middleware.ts
// 보호???�우??미들?�어
// Story 1.6: ?�션 ?�태 관�?구현
// 관???�일: lib/supabase-server.ts, app/dashboard/page.tsx

import { createServerSupabase } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호???�우??목록
const protectedRoutes = [
  '/dashboard',
  '/notes',
  '/profile',
  '/settings'
];

// ?�증???�요 ?�는 ?�우??목록
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
  

  // ?�적 ?�일?� ?�과
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // 공개 ?�우?�는 ?�과
  if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
  }

  // 보호???�우???�인
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
      return NextResponse.next();
  }

  try {
      
    // Supabase ?�버 ?�라?�언?�로 ?�션 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('??[middleware.ts] ?�증 ?�인 ?�패:', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (!user) {
          return NextResponse.redirect(new URL('/auth/login', request.url));
    }

      
    // ?�증???�용?�의 경우 ?�보???�료 ?��? ?�인
    if (pathname === '/dashboard') {
      const onboardingCompleted = user.user_metadata?.onboarding_completed;
      
      if (!onboardingCompleted) {
              return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('??[middleware.ts] 미들?�어 처리 �??�류:', error);
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


