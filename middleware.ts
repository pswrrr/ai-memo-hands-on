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
  
  console.log('🛡️ [middleware.ts] 라우트 보호 확인:', pathname);

  // 정적 파일은 통과
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/static/') || 
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // 공개 라우트는 통과
  if (publicRoutes.includes(pathname)) {
    console.log('✅ [middleware.ts] 공개 라우트, 통과');
    return NextResponse.next();
  }

  // 보호된 라우트 확인
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    console.log('✅ [middleware.ts] 보호되지 않은 라우트, 통과');
    return NextResponse.next();
  }

  try {
    console.log('🔍 [middleware.ts] 보호된 라우트 접근, 인증 확인 시작');
    
    // Supabase 서버 클라이언트로 세션 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('❌ [middleware.ts] 인증 확인 실패:', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    if (!user) {
      console.log('🔓 [middleware.ts] 인증되지 않은 사용자, 로그인 페이지로 리다이렉트');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    console.log('✅ [middleware.ts] 인증된 사용자, 라우트 접근 허용');
    
    // 인증된 사용자의 경우 온보딩 완료 여부 확인
    if (pathname === '/dashboard') {
      const onboardingCompleted = user.user_metadata?.onboarding_completed;
      
      if (!onboardingCompleted) {
        console.log('📚 [middleware.ts] 온보딩 미완료, 온보딩 페이지로 리다이렉트');
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('❌ [middleware.ts] 미들웨어 처리 중 오류:', error);
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

