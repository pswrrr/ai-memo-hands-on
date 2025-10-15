// lib/db/notes-db.ts
// 자동 연결 관리를 사용한 노트 관련 데이터베이스 함수들
// DATABASE_URL 직접 연결 실패 시 Supabase 클라이언트로 자동 대체
// 관련 파일: lib/db/schema.ts, lib/db/connection.ts, app/actions/notes.ts

import { getDatabaseConnection } from './connection';
import { createServerSupabase } from '@/lib/supabase-server';
import { notes, noteTags, summaries, type Note, type NoteTag, type Summary } from './schema';
import { eq, and, isNull, desc, asc, sql } from 'drizzle-orm';

interface PaginationResult {
  notes: any[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// 노트 생성
async function create(
  userId: string,
  title: string,
  content: string
): Promise<Note> {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('📝 Drizzle ORM 직접 연결을 통한 노트 생성');
      const [note] = await connection.connection
        .insert(notes)
        .values({
          userId,
          title,
          content,
        })
        .returning();
      
      return note;
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 생성
  console.log('📝 Supabase 클라이언트를 통한 노트 생성');
  const supabase = await createServerSupabase();
  
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: title,
      content: content
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`노트 생성 실패: ${error.message}`);
  }
  
  // Supabase 응답을 Note 타입으로 변환
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    content: data.content,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
    deletedAt: data.deleted_at ? new Date(data.deleted_at) : null
  };
}

// 노트 목록 조회 (페이지네이션 및 정렬)
async function getByUser(
  userId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'newest'
): Promise<PaginationResult> {
  const offset = (page - 1) * limit;

  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('📖 Drizzle ORM 직접 연결을 통한 노트 목록 조회');
      
      // 정렬 조건 설정
      let orderByClause;
      switch (sortBy) {
        case 'newest':
          orderByClause = desc(notes.createdAt);
          break;
        case 'oldest':
          orderByClause = asc(notes.createdAt);
          break;
        case 'title_asc':
          orderByClause = asc(notes.title);
          break;
        case 'title_desc':
          orderByClause = desc(notes.title);
          break;
        default:
          orderByClause = desc(notes.createdAt);
      }

      // 데이터 조회
      const data = await connection.connection
        .select()
        .from(notes)
        .where(and(
          eq(notes.userId, userId),
          isNull(notes.deletedAt)
        ))
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      // 총 개수 조회
      const [{ count }] = await connection.connection
        .select({ count: sql<number>`count(*)::int` })
        .from(notes)
        .where(and(
          eq(notes.userId, userId),
          isNull(notes.deletedAt)
        ));

      const totalPages = Math.ceil(count / limit);

      return {
        notes: data,
        totalCount: count,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 조회
  console.log('📖 Supabase 클라이언트를 통한 노트 목록 조회');
  const supabase = await createServerSupabase();
  
  // 정렬 조건 설정
  let orderByColumn = 'created_at';
  let ascending = false;
  
  switch (sortBy) {
    case 'newest':
      orderByColumn = 'created_at';
      ascending = false;
      break;
    case 'oldest':
      orderByColumn = 'created_at';
      ascending = true;
      break;
    case 'title_asc':
      orderByColumn = 'title';
      ascending = true;
      break;
    case 'title_desc':
      orderByColumn = 'title';
      ascending = false;
      break;
    default:
      orderByColumn = 'created_at';
      ascending = false;
  }

  // 데이터 조회
  const { data: notesData, error: notesError } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order(orderByColumn, { ascending })
    .range(offset, offset + limit - 1);

  if (notesError) {
    throw new Error(`노트 목록 조회 실패: ${notesError.message}`);
  }

  // 총 개수 조회
  const { count, error: countError } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (countError) {
    throw new Error(`노트 개수 조회 실패: ${countError.message}`);
  }

  const totalPages = Math.ceil((count || 0) / limit);

  // Supabase 응답을 Note 타입으로 변환
  const convertedNotes = (notesData || []).map(note => ({
    id: note.id,
    userId: note.user_id,
    title: note.title,
    content: note.content,
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
    deletedAt: note.deleted_at ? new Date(note.deleted_at) : null
  }));

  return {
    notes: convertedNotes,
    totalCount: count || 0,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// 노트 상세 조회
async function getById(
  id: string,
  userId: string
): Promise<Note | undefined> {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('📖 Drizzle ORM 직접 연결을 통한 노트 상세 조회');
      const [note] = await connection.connection
        .select()
        .from(notes)
        .where(and(
          eq(notes.id, id),
          eq(notes.userId, userId)
        ))
        .limit(1);
      
      return note;
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 조회
  console.log('📖 Supabase 클라이언트를 통한 노트 상세 조회');
  const supabase = await createServerSupabase();
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Supabase 노트 상세 조회 오류:', error);
    return undefined;
  }
  
  return data;
}

// 노트 수정
async function update(
  id: string,
  userId: string,
  title: string,
  content: string
): Promise<Note | undefined> {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('📝 Drizzle ORM 직접 연결을 통한 노트 수정');
      const [updated] = await connection.connection
        .update(notes)
        .set({
          title,
          content,
          updatedAt: new Date(),
        })
        .where(and(
          eq(notes.id, id),
          eq(notes.userId, userId)
        ))
        .returning();
      
      return updated;
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 수정
  console.log('📝 Supabase 클라이언트를 통한 노트 수정');
  const supabase = await createServerSupabase();
  
  const { data, error } = await supabase
    .from('notes')
    .update({
      title,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) {
    console.error('Supabase 노트 수정 오류:', error);
    return undefined;
  }
  
  return data;
}

// 노트 소프트 삭제
async function softDelete(
  id: string,
  userId: string
): Promise<void> {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('🗑️ Drizzle ORM 직접 연결을 통한 노트 소프트 삭제');
      await connection.connection
        .update(notes)
        .set({
          deletedAt: new Date(),
        })
        .where(and(
          eq(notes.id, id),
          eq(notes.userId, userId)
        ));
      return;
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 삭제
  console.log('🗑️ Supabase 클라이언트를 통한 노트 소프트 삭제');
  const supabase = await createServerSupabase();
  
  const { error } = await supabase
    .from('notes')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Supabase 노트 소프트 삭제 오류:', error);
    throw error;
  }
}

// 노트 복구
async function restore(
  id: string,
  userId: string
): Promise<void> {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('♻️ Drizzle ORM 직접 연결을 통한 노트 복구');
      await connection.connection
        .update(notes)
        .set({
          deletedAt: null,
        })
        .where(and(
          eq(notes.id, id),
          eq(notes.userId, userId)
        ));
      return;
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 복구
  console.log('♻️ Supabase 클라이언트를 통한 노트 복구');
  const supabase = await createServerSupabase();
  
  const { error } = await supabase
    .from('notes')
    .update({
      deleted_at: null,
    })
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Supabase 노트 복구 오류:', error);
    throw error;
  }
}

// 노트 영구 삭제
async function permanentDelete(
  id: string,
  userId: string
): Promise<void> {
  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('🗑️ Drizzle ORM 직접 연결을 통한 노트 영구 삭제');
      await connection.connection
        .delete(notes)
        .where(and(
          eq(notes.id, id),
          eq(notes.userId, userId)
        ));
      return;
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 영구 삭제
  console.log('🗑️ Supabase 클라이언트를 통한 노트 영구 삭제');
  const supabase = await createServerSupabase();
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) {
    console.error('Supabase 노트 영구 삭제 오류:', error);
    throw error;
  }
}

// 휴지통 노트 목록 조회
async function getTrashByUser(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginationResult> {
  const offset = (page - 1) * limit;

  try {
    // 1. 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('🗑️ Drizzle ORM 직접 연결을 통한 휴지통 노트 목록 조회');
      
      // 데이터 조회
      const data = await connection.connection
        .select()
        .from(notes)
        .where(and(
          eq(notes.userId, userId),
          sql`${notes.deletedAt} IS NOT NULL`
        ))
        .orderBy(desc(notes.deletedAt))
        .limit(limit)
        .offset(offset);

      // 총 개수 조회
      const [{ count }] = await connection.connection
        .select({ count: sql<number>`count(*)::int` })
        .from(notes)
        .where(and(
          eq(notes.userId, userId),
          sql`${notes.deletedAt} IS NOT NULL`
        ));

      const totalPages = Math.ceil(count / limit);

      return {
        notes: data,
        totalCount: count,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    }
  } catch (error) {
    console.log('⚠️ Drizzle ORM 직접 연결 실패, Supabase 클라이언트 사용:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 대안 조회
  console.log('🗑️ Supabase 클라이언트를 통한 휴지통 노트 목록 조회');
  const supabase = await createServerSupabase();
  
  // 데이터 조회
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Supabase 휴지통 노트 목록 조회 오류:', error);
    throw error;
  }

  // 총 개수 조회
  const { count, error: countError } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('deleted_at', 'is', null);

  if (countError) {
    console.error('Supabase 휴지통 노트 개수 조회 오류:', countError);
    throw countError;
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    notes: data || [],
    totalCount: count || 0,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// 요약 생성
async function createSummary(
  noteId: string,
  model: string,
  content: string
): Promise<Summary> {
  const [summary] = await db
    .insert(summaries)
    .values({
      noteId,
      model: model as any, // model enum type
      content,
    })
    .returning();
  
  return summary;
}

// 태그 생성
async function createTag(
  noteId: string,
  tag: string
): Promise<NoteTag> {
  const [noteTag] = await db
    .insert(noteTags)
    .values({
      noteId,
      tag,
    })
    .returning();
  
  return noteTag;
}

// 노트의 요약 조회
async function getSummaryByNoteId(
  noteId: string
): Promise<Summary | undefined> {
  const [summary] = await db
    .select()
    .from(summaries)
    .where(eq(summaries.noteId, noteId))
    .orderBy(desc(summaries.createdAt))
    .limit(1);
  
  return summary;
}

// 노트의 태그 조회
async function getTagsByNoteId(
  noteId: string
): Promise<NoteTag[]> {
  const tags = await db
    .select()
    .from(noteTags)
    .where(eq(noteTags.noteId, noteId))
    .orderBy(desc(noteTags.createdAt));
  
  return tags;
}

// 태그 일괄 교체 (기존 삭제 후 새로 삽입)
async function replaceTags(
  noteId: string,
  tags: string[]
): Promise<NoteTag[]> {
  // 트랜잭션으로 처리
  const result = await db.transaction(async (tx) => {
    // 기존 태그 삭제
    await tx
      .delete(noteTags)
      .where(eq(noteTags.noteId, noteId));

    if (tags.length === 0) {
      return [];
    }

    // 새 태그 삽입 (최대 6개)
    const tagValues = tags.slice(0, 6).map(tag => ({
      noteId,
      tag,
    }));

    const newTags = await tx
      .insert(noteTags)
      .values(tagValues)
      .returning();

    return newTags;
  });

  return result;
}

// 요약 업데이트 (기존 요약이 있으면 업데이트, 없으면 생성)
async function upsertSummary(
  noteId: string,
  model: string,
  content: string
): Promise<Summary> {
  // 기존 요약 확인
  const existingSummary = await getSummaryByNoteId(noteId);
  
  if (existingSummary) {
    // 기존 요약 업데이트
    const [updated] = await db
      .update(summaries)
      .set({
        model: model as any,
        content,
        createdAt: new Date(),
      })
      .where(eq(summaries.noteId, noteId))
      .returning();
    
    return updated;
  } else {
    // 새 요약 생성
    return await createSummary(noteId, model, content);
  }
}

// 요약 삭제
async function deleteSummary(
  noteId: string
): Promise<void> {
  await db
    .delete(summaries)
    .where(eq(summaries.noteId, noteId));
}

// notesDb 객체 export (supabase-db.ts와 동일한 인터페이스)
export const notesDb = {
  create,
  getByUser,
  getById,
  update,
  softDelete,
  restore,
  permanentDelete,
  getTrashByUser,
  createSummary,
  createTag,
  getSummaryByNoteId,
  getTagsByNoteId,
  replaceTags,
  upsertSummary,
  deleteSummary,
};

