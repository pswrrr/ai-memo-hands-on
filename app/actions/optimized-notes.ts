// 최적화된 노트 조회 서버 액션
// 캐싱, 페이지네이션 최적화, 쿼리 최적화를 통한 성능 향상

'use server';

import { createServerSupabase } from '@/lib/supabase-server';
import { getCachedNotes, setCachedNotes, invalidateUserCache, invalidateNoteCache } from '@/lib/cache/notes-cache';
import { getDatabaseConnection } from '@/lib/db/connection';
import performanceMonitor from '@/lib/db/performance-monitor';

export type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

// 최적화된 노트 목록 조회
export async function getOptimizedNotes(
  page: number = 1, 
  limit: number = 10, 
  sortBy: SortOption = 'newest'
) {
  const startTime = Date.now();
  
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

    // 캐시 확인
    const cached = getCachedNotes(user.id, page, sortBy);
    if (cached) {
      console.log(`📦 캐시된 노트 목록 사용: ${user.id}:${page}:${sortBy}`);
      performanceMonitor.recordQuery('getNotes', Date.now() - startTime, true);
      return {
        success: true,
        data: {
          notes: cached.notes,
          pagination: cached.pagination,
        },
        fromCache: true,
      };
    }

    // 데이터베이스에서 조회
    const result = await getNotesFromDatabase(user.id, page, limit, sortBy);
    
    if (result.success && result.data) {
      // 캐시에 저장
      setCachedNotes(user.id, page, sortBy, result.data.notes, result.data.pagination);
      
      const executionTime = Date.now() - startTime;
      performanceMonitor.recordQuery('getNotes', executionTime, false);
      
      console.log(`⚡ 최적화된 노트 조회: ${executionTime}ms`);
      
      return {
        success: true,
        data: result.data,
        fromCache: false,
        executionTime,
      };
    }

    return result;

  } catch (error) {
    console.error('최적화된 노트 조회 오류:', error);
    performanceMonitor.recordError();
    
    return {
      success: false,
      error: '노트 목록을 불러오는데 실패했습니다',
    };
  }
}

// 데이터베이스에서 노트 조회 (최적화된 쿼리)
async function getNotesFromDatabase(
  userId: string,
  page: number,
  limit: number,
  sortBy: SortOption
) {
  const offset = (page - 1) * limit;

  try {
    // 직접 연결 시도
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      console.log('📖 최적화된 Drizzle ORM 쿼리 실행');
      
      // 정렬 조건 설정
      let orderByClause;
      switch (sortBy) {
        case 'newest':
          orderByClause = 'created_at DESC';
          break;
        case 'oldest':
          orderByClause = 'created_at ASC';
          break;
        case 'title_asc':
          orderByClause = 'title ASC';
          break;
        case 'title_desc':
          orderByClause = 'title DESC';
          break;
        default:
          orderByClause = 'created_at DESC';
      }

      // 최적화된 쿼리 (필요한 필드만 선택)
      const notesQuery = connection.sql`
        SELECT 
          id, 
          title, 
          LEFT(content, 200) as content_preview,
          created_at, 
          updated_at
        FROM notes 
        WHERE user_id = ${userId} 
        AND deleted_at IS NULL 
        ORDER BY ${connection.sql.raw(orderByClause)} 
        LIMIT ${limit} OFFSET ${offset}
      `;

      // 총 개수 쿼리 (별도 실행)
      const countQuery = connection.sql`
        SELECT COUNT(*) as total_count
        FROM notes 
        WHERE user_id = ${userId} 
        AND deleted_at IS NULL
      `;

      // 병렬 실행
      const [notes, countResult] = await Promise.all([notesQuery, countQuery]);
      
      const totalCount = parseInt(countResult[0].total_count);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        success: true,
        data: {
          notes: notes.map(note => ({
            id: note.id,
            title: note.title,
            content: note.content_preview,
            created_at: note.created_at,
            updated_at: note.updated_at,
          })),
          pagination: {
            currentPage: page,
            totalPages,
            totalNotes: totalCount,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      };
    }
  } catch (error) {
    console.log('⚠️ 최적화된 쿼리 실패, Supabase 클라이언트 사용:', error);
  }

  // Supabase 클라이언트 대안
  console.log('📖 Supabase 클라이언트를 통한 노트 조회');
  const supabase = await createServerSupabase();
  
  // 정렬 조건 설정
  let orderBy: string;
  switch (sortBy) {
    case 'newest':
      orderBy = 'created_at.desc';
      break;
    case 'oldest':
      orderBy = 'created_at.asc';
      break;
    case 'title_asc':
      orderBy = 'title.asc';
      break;
    case 'title_desc':
      orderBy = 'title.desc';
      break;
    default:
      orderBy = 'created_at.desc';
  }

  // 노트 목록 조회
  const { data: notes, error: notesError } = await supabase
    .from('notes')
    .select('id, title, content, created_at, updated_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order(orderBy.split('.')[0], { ascending: orderBy.includes('asc') })
    .range(offset, offset + limit - 1);

  if (notesError) {
    throw new Error(`노트 조회 실패: ${notesError.message}`);
  }

  // 총 개수 조회
  const { count, error: countError } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (countError) {
    throw new Error(`개수 조회 실패: ${countError.message}`);
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    success: true,
    data: {
      notes: notes || [],
      pagination: {
        currentPage: page,
        totalPages,
        totalNotes: totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  };
}

// 노트 생성 (캐시 무효화 포함)
export async function createOptimizedNote(formData: FormData) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string || '',
    };

    // 노트 생성 로직 (기존과 동일)
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: rawData.title,
        content: rawData.content
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `노트 생성 실패: ${error.message}`,
      };
    }

    // 사용자 캐시 무효화
    invalidateUserCache(user.id);
    console.log('🗑️ 노트 생성으로 인한 캐시 무효화');

    return {
      success: true,
      noteId: data.id,
    };

  } catch (error) {
    console.error('최적화된 노트 생성 오류:', error);
    return {
      success: false,
      error: '노트 생성에 실패했습니다',
    };
  }
}

// 노트 수정 (캐시 무효화 포함)
export async function updateOptimizedNote(noteId: string, title: string, content: string) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    const { data, error } = await supabase
      .from('notes')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `노트 수정 실패: ${error.message}`,
      };
    }

    // 사용자 캐시 무효화
    invalidateUserCache(user.id);
    console.log('🗑️ 노트 수정으로 인한 캐시 무효화');

    return {
      success: true,
      data,
    };

  } catch (error) {
    console.error('최적화된 노트 수정 오류:', error);
    return {
      success: false,
      error: '노트 수정에 실패했습니다',
    };
  }
}

// 노트 삭제 (캐시 무효화 포함)
export async function deleteOptimizedNote(noteId: string) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그인이 필요합니다',
      };
    }

    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('user_id', user.id);

    if (error) {
      return {
        success: false,
        error: `노트 삭제 실패: ${error.message}`,
      };
    }

    // 사용자 캐시 무효화
    invalidateUserCache(user.id);
    console.log('🗑️ 노트 삭제로 인한 캐시 무효화');

    return {
      success: true,
    };

  } catch (error) {
    console.error('최적화된 노트 삭제 오류:', error);
    return {
      success: false,
      error: '노트 삭제에 실패했습니다',
    };
  }
}

// 캐시 통계 조회
export async function getCacheStats() {
  try {
    const stats = getCacheStats();
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    return {
      success: false,
      error: '캐시 통계 조회에 실패했습니다',
    };
  }
}
