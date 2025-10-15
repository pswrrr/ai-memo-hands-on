/**
 * 향상된 관리자 토큰 사용량 API (시간대 문제 해결)
 * GET /api/admin/token-usage-enhanced?period=daily|weekly|monthly&timezone=Asia/Seoul
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { db } from '@/lib/db';
import { tokenUsage } from '@/lib/db/schema';
import { sql, and, gte, lte, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // 1. 관리자 권한 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 2. 쿼리 파라미터 확인
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'daily';
    const timezone = searchParams.get('timezone') || 'Asia/Seoul';

    // 3. 시간대를 고려한 기간 설정
    const now = new Date();
    const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);
    let startDate: Date;
    let endDate: Date;

    // 시간대 변환 함수
    const convertToTimezone = (date: Date, targetTimezone: string) => {
      const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
      const targetTime = new Date(utc + (getTimezoneOffset(targetTimezone) * 60000));
      return targetTime;
    };

    const getTimezoneOffset = (timezone: string): number => {
      const now = new Date();
      const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
      const target = new Date(utc.toLocaleString("en-US", { timeZone: timezone }));
      return (target.getTime() - utc.getTime()) / 60000;
    };

    switch (period) {
      case 'daily':
        if (isVercel) {
          // Vercel 환경에서는 클라이언트 시간대를 고려
          const clientNow = convertToTimezone(now, timezone);
          startDate = new Date(clientNow);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(clientNow);
          endDate.setHours(23, 59, 59, 999);
          
          // UTC로 변환
          startDate = new Date(startDate.getTime() - (getTimezoneOffset(timezone) * 60000));
          endDate = new Date(endDate.getTime() - (getTimezoneOffset(timezone) * 60000));
        } else {
          // 로컬 환경에서는 로컬 시간 기준
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case 'weekly':
        if (isVercel) {
          const clientNow = convertToTimezone(now, timezone);
          const dayOfWeek = clientNow.getDay();
          startDate = new Date(clientNow);
          startDate.setDate(clientNow.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          
          // UTC로 변환
          startDate = new Date(startDate.getTime() - (getTimezoneOffset(timezone) * 60000));
          endDate = new Date(endDate.getTime() - (getTimezoneOffset(timezone) * 60000));
        } else {
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - dayOfWeek);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      case 'monthly':
        if (isVercel) {
          const clientNow = convertToTimezone(now, timezone);
          startDate = new Date(clientNow.getFullYear(), clientNow.getMonth(), 1);
          endDate = new Date(clientNow.getFullYear(), clientNow.getMonth() + 1, 0, 23, 59, 59, 999);
          
          // UTC로 변환
          startDate = new Date(startDate.getTime() - (getTimezoneOffset(timezone) * 60000));
          endDate = new Date(endDate.getTime() - (getTimezoneOffset(timezone) * 60000));
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        break;
      default:
        return NextResponse.json(
          { error: '유효하지 않은 기간입니다.' },
          { status: 400 }
        );
    }

    // 디버깅 로그
    console.log(`🔍 향상된 토큰 사용량 조회 (${period}):`, {
      environment: isVercel ? 'vercel' : 'local',
      timezone,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      originalNow: now.toISOString()
    });

    // 4. Drizzle ORM으로 전체 시스템 통계 조회
    const statsResult = await db
      .select({
        totalTokens: sql<number>`COALESCE(SUM(${tokenUsage.totalTokens}), 0)`,
        totalCost: sql<string>`COALESCE(SUM(${tokenUsage.cost}), 0)`,
        requestCount: sql<number>`COUNT(*)`,
        successCount: sql<number>`SUM(CASE WHEN ${tokenUsage.success} THEN 1 ELSE 0 END)`,
        errorCount: sql<number>`SUM(CASE WHEN NOT ${tokenUsage.success} THEN 1 ELSE 0 END)`,
        avgProcessingTime: sql<number>`COALESCE(AVG(${tokenUsage.processingTime}), 0)`
      })
      .from(tokenUsage)
      .where(
        and(
          gte(tokenUsage.createdAt, startDate),
          lte(tokenUsage.createdAt, endDate)
        )
      );

    const stats = statsResult[0] || {
      totalTokens: 0,
      totalCost: '0',
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      avgProcessingTime: 0
    };

    // 5. 사용자별 사용량 랭킹
    const userRankings = await db
      .select({
        userId: tokenUsage.userId,
        userEmail: sql<string>`COALESCE(
          (SELECT email FROM auth.users WHERE id = ${tokenUsage.userId}),
          'Unknown User'
        )`,
        totalTokens: sql<number>`SUM(${tokenUsage.totalTokens})`,
        totalCost: sql<string>`SUM(${tokenUsage.cost})`,
        requestCount: sql<number>`COUNT(*)`,
        lastActivity: sql<string>`MAX(${tokenUsage.createdAt})`
      })
      .from(tokenUsage)
      .where(
        and(
          gte(tokenUsage.createdAt, startDate),
          lte(tokenUsage.createdAt, endDate)
        )
      )
      .groupBy(tokenUsage.userId)
      .orderBy(sql`SUM(${tokenUsage.totalTokens}) DESC`)
      .limit(10);

    // 6. 최근 알림 (빈 배열로 초기화)
    const recentAlerts: any[] = [];

    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      },
      userRankings: userRankings.map(user => ({
        ...user,
        lastActivity: new Date(user.lastActivity)
      })),
      recentAlerts,
      debug: {
        environment: isVercel ? 'vercel' : 'local',
        timezone,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('토큰 사용량 조회 오류:', error);
    return NextResponse.json(
      { 
        error: '토큰 사용량 조회 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
