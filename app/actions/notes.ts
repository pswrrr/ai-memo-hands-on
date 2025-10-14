'use server';

import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { createNoteSchema, updateNoteSchema, deleteNoteSchema, NOTE_ERROR_MESSAGES } from '@/lib/validations/notes';
import { createServerSupabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { eq, desc, asc, count, and, isNotNull, isNull } from 'drizzle-orm';

export type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

// 노트 목록 조회 서버 액션
export async function getNotes(page: number = 1, limit: number = 10, sortBy: SortOption = 'newest') {
  try {
    // 사용자 인증 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    // 페이지네이션 계산
    const offset = (page - 1) * limit;

    // 총 노트 수 조회 (삭제되지 않은 노트만)
    const [totalResult] = await db
      .select({ count: count() })
      .from(notes)
      .where(
        and(
          eq(notes.userId, user.id),
          isNull(notes.deletedAt)
        )
      );

    const totalNotes = totalResult.count;
    const totalPages = Math.ceil(totalNotes / limit);

    // 정렬 옵션에 따른 orderBy 절 결정
    const orderByClause = 
      sortBy === 'newest' ? desc(notes.createdAt) :
      sortBy === 'oldest' ? asc(notes.createdAt) :
      sortBy === 'title_asc' ? asc(notes.title) :
      desc(notes.title); // title_desc

    // 노트 목록 조회 (정렬 옵션 적용, 삭제되지 않은 노트만)
    const notesList = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(
        and(
          eq(notes.userId, user.id),
          isNull(notes.deletedAt)
        )
      )
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        notes: notesList,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotes,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    };
  } catch (error) {
    console.error('노트 목록 조회 오류:', error);
    
    return {
      success: false,
      error: '노트 목록을 불러오는데 실패했습니다',
    };
  }
}

// 노트 상세 조회 서버 액션
export async function getNoteById(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    // 노트 조회 (사용자 권한 확인 포함)
    const [note] = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        userId: notes.userId,
      })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다',
      };
    }

    // 사용자 권한 확인
    if (note.userId !== user.id) {
      return {
        success: false,
        error: '이 노트에 접근할 권한이 없습니다',
      };
    }

    return {
      success: true,
      data: note,
    };
  } catch (error) {
    console.error('노트 상세 조회 오류:', error);
    
    return {
      success: false,
      error: '노트를 불러오는데 실패했습니다',
    };
  }
}

// 노트 수정 서버 액션
export async function updateNote(noteId: string, title: string, content: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    // 노트 존재 여부 및 권한 확인
    const [existingNote] = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다',
      };
    }

    if (existingNote.userId !== user.id) {
      return {
        success: false,
        error: '이 노트를 수정할 권한이 없습니다',
      };
    }

    // 노트 업데이트
    const [updatedNote] = await db
      .update(notes)
      .set({
        title,
        content,
        updatedAt: new Date(),
      })
      .where(eq(notes.id, noteId))
      .returning({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
      });

    return {
      success: true,
      data: updatedNote,
    };
  } catch (error) {
    console.error('노트 수정 오류:', error);
    
    return {
      success: false,
      error: '노트 수정에 실패했습니다',
    };
  }
}

// 노트 생성 서버 액션
export async function createNote(formData: FormData) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    // 폼 데이터 파싱
    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string || '',
    };

    // 유효성 검증
    const validatedData = createNoteSchema.parse(rawData);

    // 데이터베이스에 노트 저장
    const [newNote] = await db
      .insert(notes)
      .values({
        userId: user.id,
        title: validatedData.title,
        content: validatedData.content,
      })
      .returning();

    // 캐시 무효화
    revalidatePath('/dashboard');

    return {
      success: true,
      noteId: newNote.id,
    };
  } catch (error) {
    console.error('노트 생성 오류:', error);
    
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: NOTE_ERROR_MESSAGES.SAVE_FAILED,
    };
  }
}


// 노트 소프트 삭제 서버 액션
export async function deleteNote(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    // 노트 존재 여부 및 권한 확인
    const [existingNote] = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다',
      };
    }

    if (existingNote.userId !== user.id) {
      return {
        success: false,
        error: '이 노트를 삭제할 권한이 없습니다',
      };
    }

    // 소프트 삭제 (deletedAt 필드 설정)
    await db
      .update(notes)
      .set({
        deletedAt: new Date(),
      })
      .where(eq(notes.id, noteId));

    // 캐시 무효화
    revalidatePath('/dashboard');

    return {
      success: true,
    };
  } catch (error) {
    console.error('노트 삭제 오류:', error);
    
    return {
      success: false,
      error: '노트 삭제에 실패했습니다',
    };
  }
}

// 노트 복구 서버 액션
export async function restoreNote(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    // 노트 존재 여부 및 권한 확인
    const [existingNote] = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다',
      };
    }

    if (existingNote.userId !== user.id) {
      return {
        success: false,
        error: '이 노트를 복구할 권한이 없습니다',
      };
    }

    // 복구 (deletedAt 필드 null로 설정)
    await db
      .update(notes)
      .set({
        deletedAt: null,
      })
      .where(eq(notes.id, noteId));

    // 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/trash');

    return {
      success: true,
    };
  } catch (error) {
    console.error('노트 복구 오류:', error);
    
    return {
      success: false,
      error: '노트 복구에 실패했습니다',
    };
  }
}

// 노트 영구 삭제 서버 액션
export async function permanentDeleteNote(noteId: string) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    // 노트 존재 여부 및 권한 확인
    const [existingNote] = await db
      .select({ id: notes.id, userId: notes.userId })
      .from(notes)
      .where(eq(notes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다',
      };
    }

    if (existingNote.userId !== user.id) {
      return {
        success: false,
        error: '이 노트를 삭제할 권한이 없습니다',
      };
    }

    // 영구 삭제
    await db
      .delete(notes)
      .where(eq(notes.id, noteId));

    // 캐시 무효화
    revalidatePath('/dashboard/trash');

    return {
      success: true,
    };
  } catch (error) {
    console.error('노트 영구 삭제 오류:', error);
    
    return {
      success: false,
      error: '노트 영구 삭제에 실패했습니다',
    };
  }
}

// 휴지통 노트 목록 조회 서버 액션
export async function getTrashNotes(page: number = 1, limit: number = 10) {
  try {
    // 사용자 인증 확인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    // 페이지네이션 계산
    const offset = (page - 1) * limit;

    // 총 삭제된 노트 수 조회
    const [totalResult] = await db
      .select({ count: count() })
      .from(notes)
      .where(
        and(
          eq(notes.userId, user.id),
          isNotNull(notes.deletedAt)
        )
      );

    const totalNotes = totalResult.count;
    const totalPages = Math.ceil(totalNotes / limit);

    // 삭제된 노트 목록 조회
    const trashNotes = await db
      .select({
        id: notes.id,
        title: notes.title,
        content: notes.content,
        createdAt: notes.createdAt,
        updatedAt: notes.updatedAt,
        deletedAt: notes.deletedAt,
      })
      .from(notes)
      .where(
        and(
          eq(notes.userId, user.id),
          isNotNull(notes.deletedAt)
        )
      )
      .orderBy(desc(notes.deletedAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        notes: trashNotes,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotes,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    };
  } catch (error) {
    console.error('휴지통 노트 목록 조회 오류:', error);
    
    return {
      success: false,
      error: '휴지통 노트 목록을 불러오는데 실패했습니다',
    };
  }
}
