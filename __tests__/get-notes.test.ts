// __tests__/get-notes.test.ts
// getNotes 서버 액션 테스트 - 노트 목록 조회 기능 검증
// 페이지네이션, 사용자 인증, 데이터 정렬 등의 로직을 테스트
// app/actions/notes.ts, lib/db/schema.ts, lib/supabase-server.ts

import { getNotes } from '@/app/actions/notes';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { createServerSupabase } from '@/lib/supabase-server';

// Mock dependencies
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/db');

const mockCreateServerSupabase = createServerSupabase as jest.MockedFunction<typeof createServerSupabase>;
const mockDb = db as jest.Mocked<typeof db>;

describe('getNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('인증되지 않은 사용자는 에러를 받아야 함', async () => {
    // Mock: 인증 실패
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated')
        })
      }
    } as any);

    const result = await getNotes(1, 10);

    expect(result.success).toBe(false);
    expect(result.error).toBe('로그인이 필요합니다');
  });

  it('인증된 사용자는 노트 목록을 받아야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNotes = [
      {
        id: 'note-1',
        title: '테스트 노트 1',
        content: '내용 1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'note-2',
        title: '테스트 노트 2',
        content: '내용 2',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      }
    ];

    // Mock: 인증 성공
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    } as any);

    // Mock: 데이터베이스 쿼리
    mockDb.select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ count: 2 }])
        })
      })
    });

    mockDb.select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue(mockNotes)
            })
          })
        })
      })
    });

    const result = await getNotes(1, 10);

    expect(result.success).toBe(true);
    expect(result.data?.notes).toHaveLength(2);
    expect(result.data?.pagination.currentPage).toBe(1);
    expect(result.data?.pagination.totalNotes).toBe(2);
  });

  it('페이지네이션이 올바르게 작동해야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    // Mock: 인증 성공
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    } as any);

    // Mock: 총 25개 노트, 페이지당 10개
    mockDb.select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue([{ count: 25 }])
        })
      })
    });

    mockDb.select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([])
            })
          })
        })
      })
    });

    const result = await getNotes(2, 10);

    expect(result.success).toBe(true);
    expect(result.data?.pagination.currentPage).toBe(2);
    expect(result.data?.pagination.totalPages).toBe(3);
    expect(result.data?.pagination.hasNextPage).toBe(true);
    expect(result.data?.pagination.hasPrevPage).toBe(true);
  });

  it('데이터베이스 오류 시 에러를 반환해야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    // Mock: 인증 성공
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    } as any);

    // Mock: 데이터베이스 오류
    mockDb.select = jest.fn().mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const result = await getNotes(1, 10);

    expect(result.success).toBe(false);
    expect(result.error).toBe('노트 목록을 불러오는데 실패했습니다');
  });
});
