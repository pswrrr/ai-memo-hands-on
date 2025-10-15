import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection } from '@/lib/db/connection';
import { notes } from '@/lib/db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, content } = body;
    
    console.log('🔧 Drizzle ORM INSERT 테스트 시작:', { user_id, title, content });
    
    // 1. 직접 연결을 통한 Drizzle ORM INSERT 테스트
    console.log('1. 직접 연결을 통한 Drizzle ORM INSERT 테스트...');
    
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL이 설정되지 않았습니다.');
      }
      
      const sql = postgres(databaseUrl);
      const db = drizzle(sql);
      
      const result = await db.insert(notes).values({
        userId: user_id,
        title: title,
        content: content
      }).returning();
      
      await sql.end();
      
      console.log('✅ Drizzle 직접 연결 INSERT 성공:', result);
      
      return NextResponse.json({
        success: true,
        message: 'Drizzle 직접 연결 INSERT 성공',
        data: result,
        method: 'Drizzle ORM 직접 연결'
      });
      
    } catch (directError) {
      console.log('❌ Drizzle 직접 연결 실패:', directError);
      
      // 2. Supabase 클라이언트를 통한 대안 INSERT
      console.log('2. Supabase 클라이언트를 통한 대안 INSERT...');
      
      const { createServerSupabase } = await import('@/lib/supabase-server');
      const supabase = await createServerSupabase();
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user_id,
          title: title,
          content: content
        })
        .select();
      
      if (error) {
        throw new Error(`Supabase 대안 INSERT도 실패: ${error.message}`);
      }
      
      console.log('✅ Supabase 대안 INSERT 성공:', data);
      
      return NextResponse.json({
        success: true,
        message: 'Supabase 대안 INSERT 성공 (Drizzle 직접 연결 실패)',
        data: data,
        method: 'Supabase 클라이언트 (대안)',
        directError: directError instanceof Error ? directError.message : '알 수 없는 오류'
      });
    }
    
  } catch (error) {
    console.error('Drizzle INSERT 테스트 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}
