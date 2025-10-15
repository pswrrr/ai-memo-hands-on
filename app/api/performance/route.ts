// 데이터베이스 성능 모니터링 API
// GET: 성능 통계 조회
// POST: 성능 리포트 생성

import { NextRequest, NextResponse } from 'next/server';
import performanceMonitor from '@/lib/db/performance-monitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const minutes = parseInt(searchParams.get('minutes') || '5');
    
    const stats = performanceMonitor.getRecentStats(minutes);
    const report = performanceMonitor.generateReport();
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        report,
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('성능 통계 조회 실패:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '성능 통계 조회에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'report':
        const report = performanceMonitor.generateReport();
        return NextResponse.json({
          success: true,
          data: { report }
        });
        
      case 'reset':
        performanceMonitor.reset();
        return NextResponse.json({
          success: true,
          message: '성능 모니터링 데이터가 초기화되었습니다.'
        });
        
      default:
        return NextResponse.json(
          { success: false, error: '지원하지 않는 액션입니다.' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('성능 모니터링 처리 실패:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '성능 모니터링 처리에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
}
