/**
 * 관리자 토큰 사용량 API
 * GET /api/admin/token-usage?period=daily|weekly|monthly
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { db } from '@/lib/db';
import { tokenUsage } from '@/lib/db/schema';
import { sql, and, gte, lte } from 'drizzle-orm';

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

    // 3. 기간 설정
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      default:
        return NextResponse.json(
          { error: '유효하지 않은 기간입니다.' },
          { status: 400 }
        );
    }

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

    // 5. 사용자별 사용량 랭킹 (Drizzle ORM)
    const userRankingsData = await db
      .select({
        userId: tokenUsage.userId,
        totalTokens: sql<number>`SUM(${tokenUsage.totalTokens})`,
        totalCost: sql<string>`SUM(${tokenUsage.cost})`,
        requestCount: sql<number>`COUNT(*)`,
        lastActivity: sql<Date>`MAX(${tokenUsage.createdAt})`
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

    // 사용자 이메일 정보 가져오기 (RPC 함수 사용)
    const userIds = userRankingsData.map(u => u.userId);
    const { data: usersData, error: usersError } = await supabase
      .rpc('get_user_emails', { user_ids: userIds });
    
    console.log('📧 조회된 사용자 수:', usersData?.length);
    console.log('📧 조회 에러:', usersError);
    
    const userEmailMap = new Map<string, string>();
    usersData?.forEach((user: any) => {
      console.log('👤 User ID:', user.id, '| Email:', user.email);
      userEmailMap.set(user.id, user.email || user.id);
    });

    console.log('📊 랭킹 사용자 IDs:', userIds);
    
    const userRankingsResult = userRankingsData.map(user => {
      const email = userEmailMap.get(user.userId) || user.userId;
      console.log('🔍 Mapping:', user.userId, '→', email);
      return {
        userId: user.userId,
        userEmail: email,
        totalTokens: Number(user.totalTokens) || 0,
        totalCost: parseFloat(user.totalCost) || 0,
        requestCount: Number(user.requestCount) || 0,
        lastActivity: user.lastActivity
      };
    });

    // 6. 최근 알림 조회 (임시로 빈 배열 반환)
    const recentAlerts: any[] = [];

    // 7. 응답 데이터 포맷
    const response = {
      stats: {
        totalTokens: Number(stats.totalTokens) || 0,
        totalCost: parseFloat(stats.totalCost) || 0,
        requestCount: Number(stats.requestCount) || 0,
        successCount: Number(stats.successCount) || 0,
        errorCount: Number(stats.errorCount) || 0,
        avgProcessingTime: Math.round(Number(stats.avgProcessingTime) || 0),
        period: {
          start: startDate,
          end: endDate
        }
      },
      userRankings: userRankingsResult,
      recentAlerts
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('토큰 사용량 조회 실패:', error);
    return NextResponse.json(
      { error: '토큰 사용량 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

