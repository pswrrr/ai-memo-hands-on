// 캐시 통계 조회 API
// GET: 캐시 성능 통계 조회

import { NextRequest, NextResponse } from 'next/server';
import { getCacheStats } from '@/lib/cache/notes-cache';

export async function GET(request: NextRequest) {
  try {
    const stats = getCacheStats();
    
    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('캐시 통계 조회 실패:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '캐시 통계 조회에 실패했습니다.' 
      },
      { status: 500 }
    );
  }
}
