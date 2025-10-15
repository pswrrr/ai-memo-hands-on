import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    
    // notes 테이블 구조 확인
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', 'notes')
      .eq('table_schema', 'public');
    
    if (tableError) {
      return NextResponse.json({ 
        success: false, 
        error: `테이블 구조 조회 실패: ${tableError.message}` 
      });
    }
    
    // notes 테이블 샘플 데이터 확인
    const { data: sampleData, error: sampleError } = await supabase
      .from('notes')
      .select('*')
      .limit(3);
    
    // 테이블 제약조건 확인
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('*')
      .eq('table_name', 'notes')
      .eq('table_schema', 'public');
    
    return NextResponse.json({
      success: true,
      tableStructure: tableInfo,
      sampleData: sampleData,
      constraints: constraints,
      analysis: {
        totalColumns: tableInfo?.length || 0,
        hasSampleData: sampleData && sampleData.length > 0,
        constraintCount: constraints?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Table structure debug error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}
