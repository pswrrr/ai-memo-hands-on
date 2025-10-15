import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트를 통한 데이터베이스 접근
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export { supabase }

// 노트 관련 데이터베이스 함수들
export const notesDb = {
  // 노트 생성
  async create(userId: string, title: string, content: string) {
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title,
        content,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 노트 목록 조회
  async getByUser(userId: string, page: number = 1, limit: number = 10, sortBy: string = 'newest') {
    const offset = (page - 1) * limit
    
    let query = supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .is('deleted_at', null)

    // 정렬 옵션 적용
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false })
        break
      case 'oldest':
        query = query.order('created_at', { ascending: true })
        break
      case 'title_asc':
        query = query.order('title', { ascending: true })
        break
      case 'title_desc':
        query = query.order('title', { ascending: false })
        break
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      notes: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil((count || 0) / limit),
      hasPrevPage: page > 1,
    }
  },

  // 노트 상세 조회
  async getById(id: string, userId: string) {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  },

  // 노트 수정
  async update(id: string, userId: string, title: string, content: string) {
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
      .single()

    if (error) throw error
    return data
  },

  // 노트 소프트 삭제
  async softDelete(id: string, userId: string) {
    const { error } = await supabase
      .from('notes')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  },

  // 노트 복구
  async restore(id: string, userId: string) {
    const { error } = await supabase
      .from('notes')
      .update({
        deleted_at: null,
      })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  },

  // 노트 영구 삭제
  async permanentDelete(id: string, userId: string) {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  },

  // 휴지통 노트 목록 조회
  async getTrashByUser(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit
    
    const { data, error, count } = await supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return {
      notes: data || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil((count || 0) / limit),
      hasPrevPage: page > 1,
    }
  },

  // 요약 생성
  async createSummary(noteId: string, model: string, content: string) {
    const { data, error } = await supabase
      .from('summaries')
      .insert({
        note_id: noteId,
        model,
        content,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 태그 생성
  async createTag(noteId: string, tag: string) {
    const { data, error } = await supabase
      .from('note_tags')
      .insert({
        note_id: noteId,
        tag,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 노트의 요약 조회
  async getSummaryByNoteId(noteId: string) {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // 노트의 태그 조회
  async getTagsByNoteId(noteId: string) {
    const { data, error } = await supabase
      .from('note_tags')
      .select('*')
      .eq('note_id', noteId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // 태그 일괄 교체 (기존 삭제 후 새로 삽입)
  async replaceTags(noteId: string, tags: string[]) {
    // 기존 태그 삭제
    let { error: delError } = await supabase
      .from('note_tags')
      .delete()
      .eq('note_id', noteId)

    if (delError) throw delError

    if (tags.length === 0) return []

    // 새 태그 삽입
    const rows = tags.slice(0, 6).map(tag => ({ note_id: noteId, tag }))
    const { data, error } = await supabase
      .from('note_tags')
      .insert(rows)
      .select()

    if (error) throw error
    return data || []
  },

  // 요약 업데이트 (기존 요약이 있으면 업데이트, 없으면 생성)
  async upsertSummary(noteId: string, model: string, content: string) {
    // 기존 요약 확인
    const existingSummary = await this.getSummaryByNoteId(noteId);
    
    if (existingSummary) {
      // 기존 요약 업데이트
      const { data, error } = await supabase
        .from('summaries')
        .update({
          model,
          content,
          created_at: new Date().toISOString()
        })
        .eq('note_id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // 새 요약 생성
      return await this.createSummary(noteId, model, content);
    }
  },

  // 요약 삭제
  async deleteSummary(noteId: string) {
    const { error } = await supabase
      .from('summaries')
      .delete()
      .eq('note_id', noteId);

    if (error) throw error;
    return true;
  }
}
