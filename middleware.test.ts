import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 테스트 환경에서는 인증을 우회
  if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST === 'true') {
    return NextResponse.next();
  }

  // 기존 미들웨어 로직은 원래 middleware.ts에서 처리
  return NextResponse.next();
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
