/**
 * Vercel 배포 환경에서 토큰 추적 디버깅 API
 * GET /api/debug/token-tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { db } from '@/lib/db';
import { tokenUsage } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
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

    // 환경 변수 확인
    const environment = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      GEMINI_API_KEY_SET: !!process.env.GEMINI_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY_SET: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    // 데이터베이스 연결 테스트
    let dbConnectionStatus = 'unknown';
    let dbError = null;
    
    try {
      await db.execute('SELECT 1');
      dbConnectionStatus = 'success';
    } catch (error) {
      dbConnectionStatus = 'failed';
      dbError = error instanceof Error ? error.message : '알 수 없는 오류';
    }

    // 토큰 사용량 테이블 확인
    let tableExists = false;
    let tableError = null;
    
    try {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'token_usage'
        )
      `);
      tableExists = result[0]?.exists || false;
    } catch (error) {
      tableError = error instanceof Error ? error.message : '알 수 없는 오류';
    }

    // 최근 토큰 사용량 기록
    let recentUsage = null;
    let usageError = null;
    
    try {
      const result = await db
        .select({
          totalRecords: sql<number>`COUNT(*)`,
          latestRecord: sql<string>`MAX(${tokenUsage.createdAt})`,
          uniqueUsers: sql<number>`COUNT(DISTINCT ${tokenUsage.userId})`,
          totalTokens: sql<number>`SUM(${tokenUsage.totalTokens})`,
          totalCost: sql<string>`SUM(${tokenUsage.cost})`
        })
        .from(tokenUsage)
        .where(sql`${tokenUsage.createdAt} >= NOW() - INTERVAL '1 hour'`);
      
      recentUsage = result[0];
    } catch (error) {
      usageError = error instanceof Error ? error.message : '알 수 없는 오류';
    }

    // 전체 토큰 사용량 통계
    let totalStats = null;
    let statsError = null;
    
    try {
      const result = await db
        .select({
          totalRecords: sql<number>`COUNT(*)`,
          latestRecord: sql<string>`MAX(${tokenUsage.createdAt})`,
          uniqueUsers: sql<number>`COUNT(DISTINCT ${tokenUsage.userId})`,
          totalTokens: sql<number>`SUM(${tokenUsage.totalTokens})`,
          totalCost: sql<string>`SUM(${tokenUsage.cost})`
        })
        .from(tokenUsage);
      
      totalStats = result[0];
    } catch (error) {
      statsError = error instanceof Error ? error.message : '알 수 없는 오류';
    }

    // 최근 사용자 활동
    let recentUsers = null;
    let usersError = null;
    
    try {
      const result = await db
        .select({
          userId: tokenUsage.userId,
          requestCount: sql<number>`COUNT(*)`,
          totalTokens: sql<number>`SUM(${tokenUsage.totalTokens})`,
          lastActivity: sql<string>`MAX(${tokenUsage.createdAt})`
        })
        .from(tokenUsage)
        .where(sql`${tokenUsage.createdAt} >= NOW() - INTERVAL '24 hours'`)
        .groupBy(tokenUsage.userId)
        .orderBy(sql`MAX(${tokenUsage.createdAt}) DESC`)
        .limit(10);
      
      recentUsers = result;
    } catch (error) {
      usersError = error instanceof Error ? error.message : '알 수 없는 오류';
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment,
      database: {
        connectionStatus: dbConnectionStatus,
        error: dbError,
        tableExists,
        tableError
      },
      tokenUsage: {
        recent: {
          data: recentUsage,
          error: usageError
        },
        total: {
          data: totalStats,
          error: statsError
        },
        recentUsers: {
          data: recentUsers,
          error: usersError
        }
      },
      recommendations: generateRecommendations({
        environment,
        dbConnectionStatus,
        tableExists,
        recentUsage,
        totalStats
      })
    });

  } catch (error) {
    console.error('토큰 추적 디버깅 API 오류:', error);
    return NextResponse.json(
      { 
        error: '디버깅 API 실행 실패',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

function generateRecommendations(data: any): string[] {
  const recommendations = [];

  // 환경 변수 확인
  if (!data.environment.DATABASE_URL_SET) {
    recommendations.push('DATABASE_URL 환경 변수가 설정되지 않았습니다. Vercel 대시보드에서 설정하세요.');
  }

  if (!data.environment.GEMINI_API_KEY_SET) {
    recommendations.push('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. Vercel 대시보드에서 설정하세요.');
  }

  // 데이터베이스 연결 확인
  if (data.dbConnectionStatus === 'failed') {
    recommendations.push('데이터베이스 연결에 실패했습니다. DATABASE_URL을 확인하고 재배포하세요.');
  }

  // 테이블 존재 확인
  if (!data.tableExists) {
    recommendations.push('token_usage 테이블이 존재하지 않습니다. 데이터베이스 마이그레이션을 실행하세요.');
  }

  // 최근 사용량 확인
  if (data.recentUsage && data.recentUsage.totalRecords === 0) {
    recommendations.push('최근 1시간 내 토큰 사용량 기록이 없습니다. AI 요약/태그 생성 기능을 테스트해보세요.');
  }

  // Vercel 환경 특성
  if (data.environment.VERCEL) {
    recommendations.push('Vercel 배포 환경입니다. 서버리스 함수의 콜드 스타트로 인한 지연이 있을 수 있습니다.');
  }

  if (recommendations.length === 0) {
    recommendations.push('모든 시스템이 정상적으로 작동하고 있습니다.');
  }

  return recommendations;
}
