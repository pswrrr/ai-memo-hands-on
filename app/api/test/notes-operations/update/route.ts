import { NextRequest, NextResponse } from 'next/server';
import { updateNote } from '@/lib/db/notes-operations';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { note_id, title, content } = body;
    
    if (!note_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'note_id 파라미터가 필요합니다.' 
      }, { status: 400 });
    }
    
    console.log('✏️ Notes Operations UPDATE 테스트:', { note_id, title, content });
    
    const result = await updateNote(note_id, {
      title: title,
      content: content
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Notes Operations UPDATE 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}
