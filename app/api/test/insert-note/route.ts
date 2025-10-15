import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, content } = body;
    
    console.log('📝 INSERT 테스트 시작:', { user_id, title, content });
    
    const supabase = await createServerSupabase();
    
    // 1. Supabase 클라이언트를 통한 INSERT 테스트
    console.log('1. Supabase 클라이언트를 통한 INSERT 테스트...');
    
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user_id,
        title: title,
        content: content
      })
      .select();
    
    if (error) {
      console.error('❌ Supabase INSERT 실패:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Supabase INSERT 실패: ${error.message}`,
        details: error
      });
    }
    
    console.log('✅ Supabase INSERT 성공:', data);
    
    return NextResponse.json({
      success: true,
      message: 'INSERT 성공',
      data: data,
      method: 'Supabase 클라이언트'
    });
    
  } catch (error) {
    console.error('INSERT 테스트 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}
