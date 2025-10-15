// middleware.ts
// 보호된 라우트 미들웨어
// Story 1.6: 세션 상태 관리 구현
// 관련 파일: lib/supabase-server.ts, app/dashboard/page.tsx

import { createServerSupabase } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호된 라우트 목록
const protectedRoutes = [
  '/dashboard',
  '/notes',
  '/profile',
  '/settings'
];

// 관리자 전용 라우트 목록
const adminRoutes = [
  '/admin'
];

// 인증이 필요 없는 라우트 목록
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

  // 정적 파일은 통과
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // 공개 라우트는 통과
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // 관리자 전용 라우트 확인
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  // 보호된 라우트 확인
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  try {
    // Supabase 서버 클라이언트로 세션 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // 관리자 전용 라우트 접근 체크
    if (isAdminRoute) {
      const isAdmin = user.user_metadata?.role === 'admin';
      
      if (!isAdmin) {
        // 관리자가 아니면 대시보드로 리다이렉트
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // 인증된 사용자의 경우 온보딩 완료 여부 확인
    if (pathname === '/dashboard') {
      const onboardingCompleted = user.user_metadata?.onboarding_completed;
      
      if (!onboardingCompleted) {
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
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

