'use server';

import { notesDb } from '@/lib/db/supabase-db';
import { createNoteSchema, updateNoteSchema, deleteNoteSchema, NOTE_ERROR_MESSAGES } from '@/lib/validations/notes';
import { createServerSupabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { getGeminiClient, validateEnvironment } from '@/lib/ai/gemini';
import { summarizerService } from '@/lib/ai/summarizer';
import { taggerService } from '@/lib/ai/tagger';

export type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

// ?�트 목록 조회 ?�버 ?�션
export async function getNotes(page: number = 1, limit: number = 10, sortBy: SortOption = 'newest') {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // Supabase ?�라?�언?��? ?�한 ?�트 목록 조회
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

    
    return {
      success: false,
      error: '?�트 목록??불러?�는???�패?�습?�다',
    };
  }
}

// ?�트 ?�세 조회 ?�버 ?�션
export async function getNoteById(noteId: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // Supabase ?�라?�언?��? ?�한 ?�트 조회
    const note = await notesDb.getById(noteId, user.id);

    return {
      success: true,
      data: note,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?�트�?불러?�는???�패?�습?�다',
    };
  }
}

// ?�트 ?�정 ?�버 ?�션
export async function updateNote(noteId: string, title: string, content: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // Supabase ?�라?�언?��? ?�한 ?�트 ?�정
    const updatedNote = await notesDb.update(noteId, user.id, title, content);

    return {
      success: true,
      data: updatedNote,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?�트 ?�정???�패?�습?�다',
    };
  }
}

// ?�트 ?�성 ?�버 ?�션
export async function createNote(formData: FormData) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // ???�이???�싱
    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string || '',
    };

    // ?�효??검�?    const validatedData = createNoteSchema.parse(rawData);

    // Supabase ?�라?�언?��? ?�한 ?�트 ?�??    const newNote = await notesDb.create(
      user.id,
      validatedData.title,
      validatedData.content
    );

    // 캐시 무효??    revalidatePath('/dashboard');

    return {
      success: true,
      noteId: newNote.id,
    };
  } catch (error) {

    
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


// ?�트 ?�프????�� ?�버 ?�션
export async function deleteNote(noteId: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // Supabase ?�라?�언?��? ?�한 ?�트 ?�프????��
    await notesDb.softDelete(noteId, user.id);

    // 캐시 무효??    revalidatePath('/dashboard');

    return {
      success: true,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?�트 ??��???�패?�습?�다',
    };
  }
}

// ?�트 복구 ?�버 ?�션
export async function restoreNote(noteId: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // Supabase ?�라?�언?��? ?�한 ?�트 복구
    await notesDb.restore(noteId, user.id);

    // 캐시 무효??    revalidatePath('/dashboard');
    revalidatePath('/dashboard/trash');

    return {
      success: true,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?�트 복구???�패?�습?�다',
    };
  }
}

// ?�트 ?�구 ??�� ?�버 ?�션
export async function permanentDeleteNote(noteId: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // Supabase ?�라?�언?��? ?�한 ?�트 ?�구 ??��
    await notesDb.permanentDelete(noteId, user.id);

    // 캐시 무효??    revalidatePath('/dashboard/trash');

    return {
      success: true,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?�트 ?�구 ??��???�패?�습?�다',
    };
  }
}

// ?��????�트 목록 조회 ?�버 ?�션
export async function getTrashNotes(page: number = 1, limit: number = 10) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // Supabase ?�라?�언?��? ?�한 ?��????�트 목록 조회
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

    
    return {
      success: false,
      error: '?��????�트 목록??불러?�는???�패?�습?�다',
    };
  }
}

// AI ?�약/?�그 ?�생???�버 ?�션
export async function regenerateAI(noteId: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // ?�경변??검�?    try {
      validateEnvironment();
    } catch (error) {
      return {
        success: false,
        error: 'AI ?�비???�정???�료?��? ?�았?�니??,
      };
    }

    // ?�트 조회
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '?�트�?찾을 ???�습?�다',
      };
    }

    // Gemini API ?�라?�언??초기??    const geminiClient = getGeminiClient();

    // API ?�결 ?�스??    const isConnected = await geminiClient.testConnection();
    if (!isConnected) {
      return {
        success: false,
        error: 'AI ?�비?�에 ?�결?????�습?�다',
      };
    }

    // ?�약 ?�성
    const summaryResult = await geminiClient.generateContent({
      content: `?�음 ?�트�?3-6개의 불릿 ?�인?�로 ?�약?�주?�요:\n\n?�목: ${note.title}\n?�용: ${note.content}`
    });

    // ?�그 ?�성
    const tagsResult = await geminiClient.generateContent({
      content: `?�음 ?�트???�용??바탕?�로 최�? 6개의 관???�그�??�성?�주?�요. ?�그???�표�?구분?�주?�요:\n\n?�목: ${note.title}\n?�용: ${note.content}`
    });

    // ?�약 ?�??    if (summaryResult.text) {
      await notesDb.createSummary(noteId, 'gemini', summaryResult.text);
    }

    // ?�그 ?�??    if (tagsResult.text) {
      const tags = tagsResult.text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      for (const tag of tags.slice(0, 6)) { // 최�? 6�??�그
        await notesDb.createTag(noteId, tag);
      }
    }

    // 캐시 무효??    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: {
        summary: summaryResult.text,
        tags: tagsResult.text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).slice(0, 6)
      }
    };
  } catch (error) {

    
    return {
      success: false,
      error: 'AI ?�약/?�그 ?�성???�패?�습?�다',
    };
  }
}

// AI ?�약 ?�성 ?�버 ?�션
export async function generateSummary(noteId: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // ?�경변??검�?    try {
      validateEnvironment();
    } catch (error) {
      return {
        success: false,
        error: 'AI ?�비???�정???�료?��? ?�았?�니??,
      };
    }

    // ?�트 조회
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '?�트�?찾을 ???�습?�다',
      };
    }

    // ?�트 ?�용???�으�??�러
    if (!note.content || note.content.trim().length === 0) {
      return {
        success: false,
        error: '?�약???�용???�습?�다',
      };
    }

    // ?�약 ?�성
    const summaryResult = await summarizerService.generateSummary(note.content, note.title);

    // ?�약 ?�??(기존 ?�약???�으�??�데?�트)
    await notesDb.upsertSummary(noteId, 'gemini-2.0-flash-exp', summaryResult.summary);

    // 캐시 무효??    revalidatePath('/dashboard');
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

    
    return {
      success: false,
      error: '?�약 ?�성???�패?�습?�다',
    };
  }
}

// ?�약 초안 ?�성 ?�버 ?�션 (미리보기?? ?�?�하지 ?�음)
export async function generateSummaryDraft(noteId: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // ?�경 변???�인
    validateEnvironment();

    // ?�트 조회
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '?�트�?찾을 ???�습?�다',
      };
    }

    // ?�트 ?�용???�으�??�러
    if (!note.content || note.content.trim().length === 0) {
      return {
        success: false,
        error: '?�약???�용???�습?�다',
      };
    }

    // ?�약 초안 ?�성 (?�양?�을 ?�해 temperature ?�임)
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

    
    return {
      success: false,
      error: '?�약 초안 ?�성???�패?�습?�다',
    };
  }
}

// ?�택???�약 ?�용 ?�버 ?�션
export async function applySummary(noteId: string, summaryContent: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // ?�약 ?�??    await notesDb.upsertSummary(noteId, 'gemini-2.0-flash-exp', summaryContent);

    // 캐시 무효??    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: { summary: summaryContent }
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?�약 ?�용???�패?�습?�다',
    };
  }
}

// ?�약 ?�동 ?�집 ?�버 ?�션
export async function updateSummary(noteId: string, summaryContent: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // ?�약 ?�용 검�?    if (!summaryContent || summaryContent.trim().length === 0) {
      return {
        success: false,
        error: '?�약 ?�용???�력?�주?�요',
      };
    }

    if (summaryContent.length > 1000) {
      return {
        success: false,
        error: '?�약?� 1000?��? 초과?????�습?�다',
      };
    }

    // ?�약 ?�데?�트
    await notesDb.upsertSummary(noteId, 'manual-edit', summaryContent.trim());

    // 캐시 무효??    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: { summary: summaryContent.trim() }
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?�약 ?�데?�트???�패?�습?�다',
    };
  }
}

// ?�그 ?�동 ?�집 ?�버 ?�션
export async function updateTags(noteId: string, tags: string[]) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // ?�그 검�?    if (tags.length > 6) {
      return {
        success: false,
        error: '?�그??최�? 6개까지 가?�합?�다',
      };
    }

    for (const tag of tags) {
      if (tag.length > 50) {
        return {
          success: false,
          error: '�??�그??50?��? 초과?????�습?�다',
        };
      }
    }

    // 중복 ?�그 ?�거
    const uniqueTags = [...new Set(tags.map(tag => tag.trim()).filter(tag => tag.length > 0))];

    // ?�그 ?�데?�트
    await notesDb.replaceTags(noteId, uniqueTags);

    // 캐시 무효??    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: { tags: uniqueTags }
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?�그 ?�데?�트???�패?�습?�다',
    };
  }
}

// ?�약 조회 ?�버 ?�션
export async function getSummary(noteId: string) {
  try {
    // ?�용???�증 ?�인
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: '로그?�이 ?�요?�니??,
      };
    }

    // ?�트 조회 (권한 ?�인)
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '?�트�?찾을 ???�습?�다',
      };
    }

    // ?�약 조회
    const summary = await notesDb.getSummaryByNoteId(noteId);

    return {
      success: true,
      data: summary
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?�약??불러?�는???�패?�습?�다',
    };
  }
}

// AI ?�그 ?�성 ?�버 ?�션
export async function generateTags(noteId: string) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그?�이 ?�요?�니?? };
    }

    try {
      validateEnvironment();
    } catch (error) {
      return { success: false, error: 'AI ?�비???�정???�료?��? ?�았?�니?? };
    }

    const note = await notesDb.getById(noteId, user.id);
    if (!note) return { success: false, error: '?�트�?찾을 ???�습?�다' };
    if (!note.content || note.content.trim().length === 0) {
      return { success: false, error: '?�그�??�성???�용???�습?�다' };
    }

    const result = await taggerService.generateTags(note.content, note.title);

    // ?�그 ?�?? 기존 ?�그 교체
    await notesDb.replaceTags(noteId, result.tags);

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return { success: true, data: { tags: result.tags, processingTime: result.processingTime } };
  } catch (error) {

    return { success: false, error: '?�그 ?�성???�패?�습?�다' };
  }
}

// ?�그 조회 ?�버 ?�션
export async function getTags(noteId: string) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: '로그?�이 ?�요?�니?? };
    }

    // 권한 ?�인???�해 ?�트 존재 ?�인
    const note = await notesDb.getById(noteId, user.id);
    if (!note) return { success: false, error: '?�트�?찾을 ???�습?�다' };

    const rows = await notesDb.getTagsByNoteId(noteId);
    const tags = rows.map(r => r.tag).slice(0, 6);
    return { success: true, data: { tags } };
  } catch (error) {

    return { success: false, error: '?�그�?불러?�는???�패?�습?�다' };
  }
}
