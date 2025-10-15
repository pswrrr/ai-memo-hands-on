'use server';

import { notesDb } from '@/lib/db/supabase-db';
import { createNoteSchema, updateNoteSchema, deleteNoteSchema, NOTE_ERROR_MESSAGES } from '@/lib/validations/notes';
import { createServerSupabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { getGeminiClient, validateEnvironment } from '@/lib/ai/gemini';
import { summarizerService } from '@/lib/ai/summarizer';
import { taggerService } from '@/lib/ai/tagger';

export type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc';

// ?¸íŠ¸ ëª©ë¡ ì¡°íšŒ ?œë²„ ?¡ì…˜
export async function getNotes(page: number = 1, limit: number = 10, sortBy: SortOption = 'newest') {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // Supabase ?´ë¼?´ì–¸?¸ë? ?µí•œ ?¸íŠ¸ ëª©ë¡ ì¡°íšŒ
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
      error: '?¸íŠ¸ ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?¸íŠ¸ ?ì„¸ ì¡°íšŒ ?œë²„ ?¡ì…˜
export async function getNoteById(noteId: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // Supabase ?´ë¼?´ì–¸?¸ë? ?µí•œ ?¸íŠ¸ ì¡°íšŒ
    const note = await notesDb.getById(noteId, user.id);

    return {
      success: true,
      data: note,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?¸íŠ¸ë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?¸íŠ¸ ?˜ì • ?œë²„ ?¡ì…˜
export async function updateNote(noteId: string, title: string, content: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // Supabase ?´ë¼?´ì–¸?¸ë? ?µí•œ ?¸íŠ¸ ?˜ì •
    const updatedNote = await notesDb.update(noteId, user.id, title, content);

    return {
      success: true,
      data: updatedNote,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?¸íŠ¸ ?˜ì •???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?¸íŠ¸ ?ì„± ?œë²„ ?¡ì…˜
export async function createNote(formData: FormData) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // ???°ì´???Œì‹±
    const rawData = {
      title: formData.get('title') as string,
      content: formData.get('content') as string || '',
    };

    // ? íš¨??ê²€ì¦?    const validatedData = createNoteSchema.parse(rawData);

    // Supabase ?´ë¼?´ì–¸?¸ë? ?µí•œ ?¸íŠ¸ ?€??    const newNote = await notesDb.create(
      user.id,
      validatedData.title,
      validatedData.content
    );

    // ìºì‹œ ë¬´íš¨??    revalidatePath('/dashboard');

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


// ?¸íŠ¸ ?Œí”„???? œ ?œë²„ ?¡ì…˜
export async function deleteNote(noteId: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // Supabase ?´ë¼?´ì–¸?¸ë? ?µí•œ ?¸íŠ¸ ?Œí”„???? œ
    await notesDb.softDelete(noteId, user.id);

    // ìºì‹œ ë¬´íš¨??    revalidatePath('/dashboard');

    return {
      success: true,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?¸íŠ¸ ?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?¸íŠ¸ ë³µêµ¬ ?œë²„ ?¡ì…˜
export async function restoreNote(noteId: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // Supabase ?´ë¼?´ì–¸?¸ë? ?µí•œ ?¸íŠ¸ ë³µêµ¬
    await notesDb.restore(noteId, user.id);

    // ìºì‹œ ë¬´íš¨??    revalidatePath('/dashboard');
    revalidatePath('/dashboard/trash');

    return {
      success: true,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?¸íŠ¸ ë³µêµ¬???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?¸íŠ¸ ?êµ¬ ?? œ ?œë²„ ?¡ì…˜
export async function permanentDeleteNote(noteId: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // Supabase ?´ë¼?´ì–¸?¸ë? ?µí•œ ?¸íŠ¸ ?êµ¬ ?? œ
    await notesDb.permanentDelete(noteId, user.id);

    // ìºì‹œ ë¬´íš¨??    revalidatePath('/dashboard/trash');

    return {
      success: true,
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?¸íŠ¸ ?êµ¬ ?? œ???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?´ì????¸íŠ¸ ëª©ë¡ ì¡°íšŒ ?œë²„ ?¡ì…˜
export async function getTrashNotes(page: number = 1, limit: number = 10) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // Supabase ?´ë¼?´ì–¸?¸ë? ?µí•œ ?´ì????¸íŠ¸ ëª©ë¡ ì¡°íšŒ
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
      error: '?´ì????¸íŠ¸ ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// AI ?”ì•½/?œê·¸ ?¬ìƒ???œë²„ ?¡ì…˜
export async function regenerateAI(noteId: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // ?˜ê²½ë³€??ê²€ì¦?    try {
      validateEnvironment();
    } catch (error) {
      return {
        success: false,
        error: 'AI ?œë¹„???¤ì •???„ë£Œ?˜ì? ?Šì•˜?µë‹ˆ??,
      };
    }

    // ?¸íŠ¸ ì¡°íšŒ
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '?¸íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤',
      };
    }

    // Gemini API ?´ë¼?´ì–¸??ì´ˆê¸°??    const geminiClient = getGeminiClient();

    // API ?°ê²° ?ŒìŠ¤??    const isConnected = await geminiClient.testConnection();
    if (!isConnected) {
      return {
        success: false,
        error: 'AI ?œë¹„?¤ì— ?°ê²°?????†ìŠµ?ˆë‹¤',
      };
    }

    // ?”ì•½ ?ì„±
    const summaryResult = await geminiClient.generateContent({
      content: `?¤ìŒ ?¸íŠ¸ë¥?3-6ê°œì˜ ë¶ˆë¦¿ ?¬ì¸?¸ë¡œ ?”ì•½?´ì£¼?¸ìš”:\n\n?œëª©: ${note.title}\n?´ìš©: ${note.content}`
    });

    // ?œê·¸ ?ì„±
    const tagsResult = await geminiClient.generateContent({
      content: `?¤ìŒ ?¸íŠ¸???´ìš©??ë°”íƒ•?¼ë¡œ ìµœë? 6ê°œì˜ ê´€???œê·¸ë¥??ì„±?´ì£¼?¸ìš”. ?œê·¸???¼í‘œë¡?êµ¬ë¶„?´ì£¼?¸ìš”:\n\n?œëª©: ${note.title}\n?´ìš©: ${note.content}`
    });

    // ?”ì•½ ?€??    if (summaryResult.text) {
      await notesDb.createSummary(noteId, 'gemini', summaryResult.text);
    }

    // ?œê·¸ ?€??    if (tagsResult.text) {
      const tags = tagsResult.text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      for (const tag of tags.slice(0, 6)) { // ìµœë? 6ê°??œê·¸
        await notesDb.createTag(noteId, tag);
      }
    }

    // ìºì‹œ ë¬´íš¨??    revalidatePath('/dashboard');
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
      error: 'AI ?”ì•½/?œê·¸ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// AI ?”ì•½ ?ì„± ?œë²„ ?¡ì…˜
export async function generateSummary(noteId: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // ?˜ê²½ë³€??ê²€ì¦?    try {
      validateEnvironment();
    } catch (error) {
      return {
        success: false,
        error: 'AI ?œë¹„???¤ì •???„ë£Œ?˜ì? ?Šì•˜?µë‹ˆ??,
      };
    }

    // ?¸íŠ¸ ì¡°íšŒ
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '?¸íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤',
      };
    }

    // ?¸íŠ¸ ?´ìš©???†ìœ¼ë©??ëŸ¬
    if (!note.content || note.content.trim().length === 0) {
      return {
        success: false,
        error: '?”ì•½???´ìš©???†ìŠµ?ˆë‹¤',
      };
    }

    // ?”ì•½ ?ì„±
    const summaryResult = await summarizerService.generateSummary(note.content, note.title);

    // ?”ì•½ ?€??(ê¸°ì¡´ ?”ì•½???ˆìœ¼ë©??…ë°?´íŠ¸)
    await notesDb.upsertSummary(noteId, 'gemini-2.0-flash-exp', summaryResult.summary);

    // ìºì‹œ ë¬´íš¨??    revalidatePath('/dashboard');
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
      error: '?”ì•½ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?”ì•½ ì´ˆì•ˆ ?ì„± ?œë²„ ?¡ì…˜ (ë¯¸ë¦¬ë³´ê¸°?? ?€?¥í•˜ì§€ ?ŠìŒ)
export async function generateSummaryDraft(noteId: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // ?˜ê²½ ë³€???•ì¸
    validateEnvironment();

    // ?¸íŠ¸ ì¡°íšŒ
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '?¸íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤',
      };
    }

    // ?¸íŠ¸ ?´ìš©???†ìœ¼ë©??ëŸ¬
    if (!note.content || note.content.trim().length === 0) {
      return {
        success: false,
        error: '?”ì•½???´ìš©???†ìŠµ?ˆë‹¤',
      };
    }

    // ?”ì•½ ì´ˆì•ˆ ?ì„± (?¤ì–‘?±ì„ ?„í•´ temperature ?’ì„)
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
      error: '?”ì•½ ì´ˆì•ˆ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ? íƒ???”ì•½ ?ìš© ?œë²„ ?¡ì…˜
export async function applySummary(noteId: string, summaryContent: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // ?”ì•½ ?€??    await notesDb.upsertSummary(noteId, 'gemini-2.0-flash-exp', summaryContent);

    // ìºì‹œ ë¬´íš¨??    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: { summary: summaryContent }
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?”ì•½ ?ìš©???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?”ì•½ ?˜ë™ ?¸ì§‘ ?œë²„ ?¡ì…˜
export async function updateSummary(noteId: string, summaryContent: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // ?”ì•½ ?´ìš© ê²€ì¦?    if (!summaryContent || summaryContent.trim().length === 0) {
      return {
        success: false,
        error: '?”ì•½ ?´ìš©???…ë ¥?´ì£¼?¸ìš”',
      };
    }

    if (summaryContent.length > 1000) {
      return {
        success: false,
        error: '?”ì•½?€ 1000?ë? ì´ˆê³¼?????†ìŠµ?ˆë‹¤',
      };
    }

    // ?”ì•½ ?…ë°?´íŠ¸
    await notesDb.upsertSummary(noteId, 'manual-edit', summaryContent.trim());

    // ìºì‹œ ë¬´íš¨??    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: { summary: summaryContent.trim() }
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?”ì•½ ?…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?œê·¸ ?˜ë™ ?¸ì§‘ ?œë²„ ?¡ì…˜
export async function updateTags(noteId: string, tags: string[]) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // ?œê·¸ ê²€ì¦?    if (tags.length > 6) {
      return {
        success: false,
        error: '?œê·¸??ìµœë? 6ê°œê¹Œì§€ ê°€?¥í•©?ˆë‹¤',
      };
    }

    for (const tag of tags) {
      if (tag.length > 50) {
        return {
          success: false,
          error: 'ê°??œê·¸??50?ë? ì´ˆê³¼?????†ìŠµ?ˆë‹¤',
        };
      }
    }

    // ì¤‘ë³µ ?œê·¸ ?œê±°
    const uniqueTags = [...new Set(tags.map(tag => tag.trim()).filter(tag => tag.length > 0))];

    // ?œê·¸ ?…ë°?´íŠ¸
    await notesDb.replaceTags(noteId, uniqueTags);

    // ìºì‹œ ë¬´íš¨??    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return {
      success: true,
      data: { tags: uniqueTags }
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?œê·¸ ?…ë°?´íŠ¸???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// ?”ì•½ ì¡°íšŒ ?œë²„ ?¡ì…˜
export async function getSummary(noteId: string) {
  try {
    // ?¬ìš©???¸ì¦ ?•ì¸
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??,
      };
    }

    // ?¸íŠ¸ ì¡°íšŒ (ê¶Œí•œ ?•ì¸)
    const note = await notesDb.getById(noteId, user.id);
    if (!note) {
      return {
        success: false,
        error: '?¸íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤',
      };
    }

    // ?”ì•½ ì¡°íšŒ
    const summary = await notesDb.getSummaryByNoteId(noteId);

    return {
      success: true,
      data: summary
    };
  } catch (error) {

    
    return {
      success: false,
      error: '?”ì•½??ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤',
    };
  }
}

// AI ?œê·¸ ?ì„± ?œë²„ ?¡ì…˜
export async function generateTags(noteId: string) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ?? };
    }

    try {
      validateEnvironment();
    } catch (error) {
      return { success: false, error: 'AI ?œë¹„???¤ì •???„ë£Œ?˜ì? ?Šì•˜?µë‹ˆ?? };
    }

    const note = await notesDb.getById(noteId, user.id);
    if (!note) return { success: false, error: '?¸íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤' };
    if (!note.content || note.content.trim().length === 0) {
      return { success: false, error: '?œê·¸ë¥??ì„±???´ìš©???†ìŠµ?ˆë‹¤' };
    }

    const result = await taggerService.generateTags(note.content, note.title);

    // ?œê·¸ ?€?? ê¸°ì¡´ ?œê·¸ êµì²´
    await notesDb.replaceTags(noteId, result.tags);

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/notes/${noteId}`);

    return { success: true, data: { tags: result.tags, processingTime: result.processingTime } };
  } catch (error) {

    return { success: false, error: '?œê·¸ ?ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤' };
  }
}

// ?œê·¸ ì¡°íšŒ ?œë²„ ?¡ì…˜
export async function getTags(noteId: string) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ?? };
    }

    // ê¶Œí•œ ?•ì¸???„í•´ ?¸íŠ¸ ì¡´ì¬ ?•ì¸
    const note = await notesDb.getById(noteId, user.id);
    if (!note) return { success: false, error: '?¸íŠ¸ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤' };

    const rows = await notesDb.getTagsByNoteId(noteId);
    const tags = rows.map(r => r.tag).slice(0, 6);
    return { success: true, data: { tags } };
  } catch (error) {

    return { success: false, error: '?œê·¸ë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤' };
  }
}
