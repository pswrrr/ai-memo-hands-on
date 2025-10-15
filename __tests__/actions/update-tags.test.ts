import { updateTags } from '@/app/actions/notes';
import { createServerSupabase } from '@/lib/supabase-server';
import { notesDb } from '@/lib/db/supabase-db';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/db/supabase-db');
jest.mock('next/cache');

const mockCreateServerSupabase = createServerSupabase as jest.MockedFunction<typeof createServerSupabase>;
const mockNotesDb = notesDb as jest.Mocked<typeof notesDb>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<typeof revalidatePath>;

describe('updateTags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('성공적으로 태그를 업데이트해야 한다', async () => {
    // Mock authentication
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    } as any);

    // Mock database operation
    mockNotesDb.replaceTags.mockResolvedValue(undefined);

    const tags = ['AI', '머신러닝', '자연어처리'];
    const result = await updateTags('note-123', tags);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ tags });
    expect(mockNotesDb.replaceTags).toHaveBeenCalledWith('note-123', tags);
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/notes/note-123');
  });

  it('인증되지 않은 사용자는 태그를 업데이트할 수 없어야 한다', async () => {
    // Mock authentication failure
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated')
        })
      }
    } as any);

    const result = await updateTags('note-123', ['AI', 'ML']);

    expect(result.success).toBe(false);
    expect(result.error).toBe('로그인이 필요합니다');
    expect(mockNotesDb.replaceTags).not.toHaveBeenCalled();
  });

  it('6개를 초과하는 태그는 거부되어야 한다', async () => {
    // Mock authentication
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    } as any);

    const tooManyTags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'];
    const result = await updateTags('note-123', tooManyTags);

    expect(result.success).toBe(false);
    expect(result.error).toBe('태그는 최대 6개까지 가능합니다');
    expect(mockNotesDb.replaceTags).not.toHaveBeenCalled();
  });

  it('50자를 초과하는 태그는 거부되어야 한다', async () => {
    // Mock authentication
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    } as any);

    const longTag = 'a'.repeat(51);
    const result = await updateTags('note-123', ['AI', longTag]);

    expect(result.success).toBe(false);
    expect(result.error).toBe('각 태그는 50자를 초과할 수 없습니다');
    expect(mockNotesDb.replaceTags).not.toHaveBeenCalled();
  });

  it('중복 태그가 제거되어야 한다', async () => {
    // Mock authentication
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    } as any);

    // Mock database operation
    mockNotesDb.replaceTags.mockResolvedValue(undefined);

    const tagsWithDuplicates = ['AI', 'AI', 'ML', 'ML', 'NLP'];
    const result = await updateTags('note-123', tagsWithDuplicates);

    expect(result.success).toBe(true);
    expect(result.data?.tags).toEqual(['AI', 'ML', 'NLP']);
    expect(mockNotesDb.replaceTags).toHaveBeenCalledWith('note-123', ['AI', 'ML', 'NLP']);
  });

  it('빈 태그가 제거되어야 한다', async () => {
    // Mock authentication
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    } as any);

    // Mock database operation
    mockNotesDb.replaceTags.mockResolvedValue(undefined);

    const tagsWithEmpty = ['AI', '', '  ', 'ML'];
    const result = await updateTags('note-123', tagsWithEmpty);

    expect(result.success).toBe(true);
    expect(result.data?.tags).toEqual(['AI', 'ML']);
    expect(mockNotesDb.replaceTags).toHaveBeenCalledWith('note-123', ['AI', 'ML']);
  });

  it('태그의 공백이 제거되어야 한다', async () => {
    // Mock authentication
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    } as any);

    // Mock database operation
    mockNotesDb.replaceTags.mockResolvedValue(undefined);

    const tagsWithSpaces = ['  AI  ', '  ML  ', '  NLP  '];
    const result = await updateTags('note-123', tagsWithSpaces);

    expect(result.success).toBe(true);
    expect(result.data?.tags).toEqual(['AI', 'ML', 'NLP']);
    expect(mockNotesDb.replaceTags).toHaveBeenCalledWith('note-123', ['AI', 'ML', 'NLP']);
  });

  it('데이터베이스 오류 시 적절한 에러를 반환해야 한다', async () => {
    // Mock authentication
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    } as any);

    // Mock database error
    mockNotesDb.replaceTags.mockRejectedValue(new Error('Database error'));

    const result = await updateTags('note-123', ['AI', 'ML']);

    expect(result.success).toBe(false);
    expect(result.error).toBe('태그 업데이트에 실패했습니다');
  });
});

