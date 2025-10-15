// notes 테이블 작업을 위한 유틸리티 함수
// DATABASE_URL 직접 연결 실패 시 Supabase 클라이언트를 통한 대안 제공

import { createServerSupabase } from '@/lib/supabase-server';
import { getDatabaseConnection } from '@/lib/db/connection';
import { notes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export interface NoteInsertData {
  userId: string;
  title: string;
  content?: string;
}

export interface NoteUpdateData {
  title?: string;
  content?: string;
}

// notes 테이블에 데이터 삽입
export async function insertNote(data: NoteInsertData) {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('📝 Drizzle ORM 직접 연결을 통한 INSERT');
      const result = await connection.connection
        .insert(notes)
        .values({
          userId: data.userId,
          title: data.title,
          content: data.content
        })
        .returning();
      
      return { success: true, data: result, method: 'Drizzle ORM 직접 연결' };
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 INSERT
  console.log('📝 Supabase 클라이언트를 통한 INSERT');
  const supabase = await createServerSupabase();
  
  const { data: result, error } = await supabase
    .from('notes')
    .insert({
      user_id: data.userId,
      title: data.title,
      content: data.content
    })
    .select();
  
  if (error) {
    throw new Error(`Supabase INSERT 실패: ${error.message}`);
  }
  
  return { success: true, data: result, method: 'Supabase 클라이언트' };
}

// notes 테이블에서 데이터 조회
export async function getNotes(userId: string, limit: number = 10) {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('📖 Drizzle ORM 직접 연결을 통한 SELECT');
      const result = await connection.connection
        .select()
        .from(notes)
        .where(eq(notes.userId, userId))
        .limit(limit);
      
      return { success: true, data: result, method: 'Drizzle ORM 직접 연결' };
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 SELECT
  console.log('📖 Supabase 클라이언트를 통한 SELECT');
  const supabase = await createServerSupabase();
  
  const { data: result, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .limit(limit);
  
  if (error) {
    throw new Error(`Supabase SELECT 실패: ${error.message}`);
  }
  
  return { success: true, data: result, method: 'Supabase 클라이언트' };
}

// notes 테이블에서 데이터 업데이트
export async function updateNote(noteId: string, data: NoteUpdateData) {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('✏️ Drizzle ORM 직접 연결을 통한 UPDATE');
      const result = await connection.connection
        .update(notes)
        .set({
          title: data.title,
          content: data.content,
          updatedAt: new Date()
        })
        .where(eq(notes.id, noteId))
        .returning();
      
      return { success: true, data: result, method: 'Drizzle ORM 직접 연결' };
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 UPDATE
  console.log('✏️ Supabase 클라이언트를 통한 UPDATE');
  const supabase = await createServerSupabase();
  
  const { data: result, error } = await supabase
    .from('notes')
    .update({
      title: data.title,
      content: data.content,
      updated_at: new Date().toISOString()
    })
    .eq('id', noteId)
    .select();
  
  if (error) {
    throw new Error(`Supabase UPDATE 실패: ${error.message}`);
  }
  
  return { success: true, data: result, method: 'Supabase 클라이언트' };
}

// notes 테이블에서 데이터 삭제 (소프트 삭제)
export async function deleteNote(noteId: string) {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('🗑️ Drizzle ORM 직접 연결을 통한 DELETE');
      const result = await connection.connection
        .update(notes)
        .set({ deletedAt: new Date() })
        .where(eq(notes.id, noteId))
        .returning();
      
      return { success: true, data: result, method: 'Drizzle ORM 직접 연결' };
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 DELETE
  console.log('🗑️ Supabase 클라이언트를 통한 DELETE');
  const supabase = await createServerSupabase();
  
  const { data: result, error } = await supabase
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId)
    .select();
  
  if (error) {
    throw new Error(`Supabase DELETE 실패: ${error.message}`);
  }
  
  return { success: true, data: result, method: 'Supabase 클라이언트' };
}
