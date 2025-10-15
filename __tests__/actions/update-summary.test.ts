import { updateSummary } from '@/app/actions/notes';
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

describe('updateSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('성공적으로 요약을 업데이트해야 한다', async () => {
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
    mockNotesDb.upsertSummary.mockResolvedValue(undefined);

    const result = await updateSummary('note-123', 'Updated summary content');

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ summary: 'Updated summary content' });
    expect(mockNotesDb.upsertSummary).toHaveBeenCalledWith('note-123', 'manual-edit', 'Updated summary content');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard');
    expect(mockRevalidatePath).toHaveBeenCalledWith('/dashboard/notes/note-123');
  });

  it('인증되지 않은 사용자는 요약을 업데이트할 수 없어야 한다', async () => {
    // Mock authentication failure
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated')
        })
      }
    } as any);

    const result = await updateSummary('note-123', 'Updated summary content');

    expect(result.success).toBe(false);
    expect(result.error).toBe('로그인이 필요합니다');
    expect(mockNotesDb.upsertSummary).not.toHaveBeenCalled();
  });

  it('빈 요약 내용은 거부되어야 한다', async () => {
    // Mock authentication
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    } as any);

    const result = await updateSummary('note-123', '');

    expect(result.success).toBe(false);
    expect(result.error).toBe('요약 내용을 입력해주세요');
    expect(mockNotesDb.upsertSummary).not.toHaveBeenCalled();
  });

  it('1000자를 초과하는 요약은 거부되어야 한다', async () => {
    // Mock authentication
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    } as any);

    const longContent = 'a'.repeat(1001);
    const result = await updateSummary('note-123', longContent);

    expect(result.success).toBe(false);
    expect(result.error).toBe('요약은 1000자를 초과할 수 없습니다');
    expect(mockNotesDb.upsertSummary).not.toHaveBeenCalled();
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
    mockNotesDb.upsertSummary.mockRejectedValue(new Error('Database error'));

    const result = await updateSummary('note-123', 'Updated summary content');

    expect(result.success).toBe(false);
    expect(result.error).toBe('요약 업데이트에 실패했습니다');
  });

  it('공백이 제거되어야 한다', async () => {
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
    mockNotesDb.upsertSummary.mockResolvedValue(undefined);

    const result = await updateSummary('note-123', '  Updated summary content  ');

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ summary: 'Updated summary content' });
    expect(mockNotesDb.upsertSummary).toHaveBeenCalledWith('note-123', 'manual-edit', 'Updated summary content');
  });
});

