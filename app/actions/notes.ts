'use server';

import { notesDb } from '@/lib/db/supabase-db';
import { createNoteSchema, updateNoteSchema, deleteNoteSchema, NOTE_ERROR_MESSAGES } from '@/lib/validations/notes';
import { createServerSupabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { getGeminiClient, validateEnvironment } from '@/lib/ai/gemini';
import { summarizerService } from '@/lib/ai/summarizer';
import { taggerService } from '@/lib/ai/tagger';

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

    // Supabase 클라이언트를 통한 노트 목록 조회
    const result = await notesDb.getByUser(user.id, page, limit, sortBy);

    return {
      success: true,
      data: {
        notes: result.notes,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalNotes: result.totalCount,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
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

    // Supabase 클라이언트를 통한 노트 조회
    const note = await notesDb.getById(noteId, user.id);

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

    // Supabase 클라이언트를 통한 노트 수정
    const updatedNote = await notesDb.update(noteId, user.id, title, content);

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

    // Supabase 클라이언트를 통한 노트 저장
    const newNote = await notesDb.create(
      user.id,
      validatedData.title,
      validatedData.content
    );

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

    // Supabase 클라이언트를 통한 노트 소프트 삭제
    await notesDb.softDelete(noteId, user.id);

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

    // Supabase 클라이언트를 통한 노트 복구
    await notesDb.restore(noteId, user.id);

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

    // Supabase 클라이언트를 통한 노트 영구 삭제
    await notesDb.permanentDelete(noteId, user.id);

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

    // Supabase 클라이언트를 통한 휴지통 노트 목록 조회
    const result = await notesDb.getTrashByUser(user.id, page, limit);

    return {
      success: true,
      data: {
        notes: result.notes,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalNotes: result.totalCount,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
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

// AI 요약/태그 재생성 서버 액션
export async function regenerateAI(noteId: string) {
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

    // 환경변수 검증
    try {
      validateEnvironment();
    } catch (error) {
      return {
        success: false,
        error: 'AI 서비스 설정이 완료되지 않았습니다',
      };
    }

    // 노트 조회
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다',
      };
    }

    // Gemini API 클라이언트 초기화
    const geminiClient = getGeminiClient();

    // API 연결 테스트
    const isConnected = await geminiClient.testConnection();
    if (!isConnected) {
      return {
        success: false,
        error: 'AI 서비스에 연결할 수 없습니다',
      };
    }

    // 요약 생성
    const summaryResult = await geminiClient.generateContent({
      content: `다음 노트를 3-6개의 불릿 포인트로 요약해주세요:\n\n제목: ${note.title}\n내용: ${note.content}`
    });

    // 태그 생성
    const tagsResult = await geminiClient.generateContent({
      content: `다음 노트의 내용을 바탕으로 최대 6개의 관련 태그를 생성해주세요. 태그는 쉼표로 구분해주세요:\n\n제목: ${note.title}\n내용: ${note.content}`
    });

    // 요약 저장
    if (summaryResult.text) {
      await notesDb.createSummary(noteId, 'gemini', summaryResult.text);
    }

    // 태그 저장
    if (tagsResult.text) {
      const tags = tagsResult.text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      for (const tag of tags.slice(0, 6)) { // 최대 6개 태그
        await notesDb.createTag(noteId, tag);
      }
    }

    // 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: {
        summary: summaryResult.text,
        tags: tagsResult.text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).slice(0, 6)
      }
    };
  } catch (error) {
    console.error('AI 재생성 오류:', error);
    
    return {
      success: false,
      error: 'AI 요약/태그 생성에 실패했습니다',
    };
  }
}

// AI 요약 생성 서버 액션
export async function generateSummary(noteId: string) {
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

    // 환경변수 검증
    try {
      validateEnvironment();
    } catch (error) {
      return {
        success: false,
        error: 'AI 서비스 설정이 완료되지 않았습니다',
      };
    }

    // 노트 조회
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다',
      };
    }

    // 노트 내용이 없으면 에러
    if (!note.content || note.content.trim().length === 0) {
      return {
        success: false,
        error: '요약할 내용이 없습니다',
      };
    }

    // 요약 생성
    const summaryResult = await summarizerService.generateSummary(note.content, note.title);

    // 요약 저장 (기존 요약이 있으면 업데이트)
    await notesDb.upsertSummary(noteId, 'gemini-2.0-flash-exp', summaryResult.summary);

    // 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: {
        summary: summaryResult.summary,
        bulletPoints: summaryResult.bulletPoints,
        quality: summaryResult.quality,
        processingTime: summaryResult.processingTime
      }
    };
  } catch (error) {
    console.error('요약 생성 오류:', error);
    
    return {
      success: false,
      error: '요약 생성에 실패했습니다',
    };
  }
}

// 요약 초안 생성 서버 액션 (미리보기용, 저장하지 않음)
export async function generateSummaryDraft(noteId: string) {
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

    // 환경 변수 확인
    validateEnvironment();

    // 노트 조회
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다',
      };
    }

    // 노트 내용이 없으면 에러
    if (!note.content || note.content.trim().length === 0) {
      return {
        success: false,
        error: '요약할 내용이 없습니다',
      };
    }

    // 요약 초안 생성 (다양성을 위해 temperature 높임)
    const summaryResult = await summarizerService.generateSummary(note.content, note.title, { temperature: 0.9 });

    return {
      success: true,
      data: {
        summary: summaryResult.summary,
        bulletPoints: summaryResult.bulletPoints,
        quality: summaryResult.quality,
        processingTime: summaryResult.processingTime
      }
    };
  } catch (error) {
    console.error('요약 초안 생성 오류:', error);
    
    return {
      success: false,
      error: '요약 초안 생성에 실패했습니다',
    };
  }
}

// 선택한 요약 적용 서버 액션
export async function applySummary(noteId: string, summaryContent: string) {
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

    // 요약 저장
    await notesDb.upsertSummary(noteId, 'gemini-2.0-flash-exp', summaryContent);

    // 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: { summary: summaryContent }
    };
  } catch (error) {
    console.error('요약 적용 오류:', error);
    
    return {
      success: false,
      error: '요약 적용에 실패했습니다',
    };
  }
}

// 요약 수동 편집 서버 액션
export async function updateSummary(noteId: string, summaryContent: string) {
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

    // 요약 내용 검증
    if (!summaryContent || summaryContent.trim().length === 0) {
      return {
        success: false,
        error: '요약 내용을 입력해주세요',
      };
    }

    if (summaryContent.length > 1000) {
      return {
        success: false,
        error: '요약은 1000자를 초과할 수 없습니다',
      };
    }

    // 요약 업데이트
    await notesDb.upsertSummary(noteId, 'manual-edit', summaryContent.trim());

    // 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: { summary: summaryContent.trim() }
    };
  } catch (error) {
    console.error('요약 업데이트 오류:', error);
    
    return {
      success: false,
      error: '요약 업데이트에 실패했습니다',
    };
  }
}

// 태그 수동 편집 서버 액션
export async function updateTags(noteId: string, tags: string[]) {
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

    // 태그 검증
    if (tags.length > 6) {
      return {
        success: false,
        error: '태그는 최대 6개까지 가능합니다',
      };
    }

    for (const tag of tags) {
      if (tag.length > 50) {
        return {
          success: false,
          error: '각 태그는 50자를 초과할 수 없습니다',
        };
      }
    }

    // 중복 태그 제거
    const uniqueTags = [...new Set(tags.map(tag => tag.trim()).filter(tag => tag.length > 0))];

    // 태그 업데이트
    await notesDb.replaceTags(noteId, uniqueTags);

    // 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: { tags: uniqueTags }
    };
  } catch (error) {
    console.error('태그 업데이트 오류:', error);
    
    return {
      success: false,
      error: '태그 업데이트에 실패했습니다',
    };
  }
}

// 요약 조회 서버 액션
export async function getSummary(noteId: string) {
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

    // 노트 조회 (권한 확인)
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '노트를 찾을 수 없습니다',
      };
    }

    // 요약 조회
    const summary = await notesDb.getSummaryByNoteId(noteId);

    return {
      success: true,
      data: summary
    };
  } catch (error) {
    console.error('요약 조회 오류:', error);
    
    return {
      success: false,
      error: '요약을 불러오는데 실패했습니다',
    };
  }
}

// AI 태그 생성 서버 액션
export async function generateTags(noteId: string) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    try {
      validateEnvironment();
    } catch (error) {
      return { success: false, error: 'AI 서비스 설정이 완료되지 않았습니다' };
    }

    const note = await notesDb.getById(noteId, user.id);
    if (!note) return { success: false, error: '노트를 찾을 수 없습니다' };
    if (!note.content || note.content.trim().length === 0) {
      return { success: false, error: '태그를 생성할 내용이 없습니다' };
    }

    const result = await taggerService.generateTags(note.content, note.title);

    // 태그 저장: 기존 태그 교체
    await notesDb.replaceTags(noteId, result.tags);

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return { success: true, data: { tags: result.tags, processingTime: result.processingTime } };
  } catch (error) {
    console.error('태그 생성 오류:', error);
    return { success: false, error: '태그 생성에 실패했습니다' };
  }
}

// 태그 조회 서버 액션
export async function getTags(noteId: string) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    // 권한 확인을 위해 노트 존재 확인
    const note = await notesDb.getById(noteId, user.id);
    if (!note) return { success: false, error: '노트를 찾을 수 없습니다' };

    const rows = await notesDb.getTagsByNoteId(noteId);
    const tags = rows.map(r => r.tag).slice(0, 6);
    return { success: true, data: { tags } };
  } catch (error) {
    console.error('태그 조회 오류:', error);
    return { success: false, error: '태그를 불러오는데 실패했습니다' };
  }
}
