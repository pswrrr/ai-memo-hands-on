import { NextRequest, NextResponse } from 'next/server';
import { getNotes } from '@/lib/db/notes-operations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'user_id 파라미터가 필요합니다.' 
      }, { status: 400 });
    }
    
    console.log('📖 Notes Operations SELECT 테스트:', { userId, limit });
    
    const result = await getNotes(userId, limit);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Notes Operations SELECT 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}
