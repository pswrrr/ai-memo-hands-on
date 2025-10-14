import { deleteNote } from '@/app/actions/notes';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { createServerSupabase } from '@/lib/supabase-server';
import { eq } from 'drizzle-orm';

// 모킹
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
}));

describe('deleteNote', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  const mockNote = {
    id: 'test-note-id',
    userId: 'test-user-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('사용자가 인증되지 않은 경우 오류를 반환해야 한다', async () => {
    // Mock 설정
    (createServerSupabase as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    });

    // 실행
    const result = await deleteNote('test-note-id');

    // 검증
    expect(result.success).toBe(false);
    expect(result.error).toBe('로그인이 필요합니다');
  });

  it('노트가 존재하지 않는 경우 오류를 반환해야 한다', async () => {
    // Mock 설정
    (createServerSupabase as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    const mockSelect = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]), // 노트가 없음
    };

    (db.select as jest.Mock).mockReturnValue(mockSelect);

    // 실행
    const result = await deleteNote('non-existent-note-id');

    // 검증
    expect(result.success).toBe(false);
    expect(result.error).toBe('노트를 찾을 수 없습니다');
  });

  it('다른 사용자의 노트를 삭제하려고 하면 오류를 반환해야 한다', async () => {
    // Mock 설정
    (createServerSupabase as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    const mockSelect = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([
        { id: 'test-note-id', userId: 'different-user-id' }, // 다른 사용자의 노트
      ]),
    };

    (db.select as jest.Mock).mockReturnValue(mockSelect);

    // 실행
    const result = await deleteNote('test-note-id');

    // 검증
    expect(result.success).toBe(false);
    expect(result.error).toBe('이 노트를 삭제할 권한이 없습니다');
  });

  it('성공적으로 노트를 소프트 삭제해야 한다', async () => {
    // Mock 설정
    (createServerSupabase as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    const mockSelect = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockNote]),
    };

    const mockUpdate = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(undefined),
    };

    (db.select as jest.Mock).mockReturnValue(mockSelect);
    (db.update as jest.Mock).mockReturnValue(mockUpdate);

    // 실행
    const result = await deleteNote('test-note-id');

    // 검증
    expect(result.success).toBe(true);
    expect(db.update).toHaveBeenCalled();
    expect(mockUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: expect.any(Date),
      })
    );
  });
});

