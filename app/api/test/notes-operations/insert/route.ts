import { NextRequest, NextResponse } from 'next/server';
import { insertNote } from '@/lib/db/notes-operations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, title, content } = body;
    
    console.log('📝 Notes Operations INSERT 테스트:', { user_id, title, content });
    
    const result = await insertNote({
      userId: user_id,
      title: title,
      content: content
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Notes Operations INSERT 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}
