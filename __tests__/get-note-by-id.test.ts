// __tests__/get-note-by-id.test.ts
// getNoteById 서버 액션 테스트 - 노트 상세 조회 기능 검증
// 사용자 인증, 권한 검증, 노트 존재 여부 확인 등의 로직을 테스트
// app/actions/notes.ts, lib/db/schema.ts, lib/supabase-server.ts

import { getNoteById } from '@/app/actions/notes';
import { db } from '@/lib/db';
import { notes } from '@/lib/db/schema';
import { createServerSupabase } from '@/lib/supabase-server';

// Mock dependencies
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/db');

const mockCreateServerSupabase = createServerSupabase as jest.MockedFunction<typeof createServerSupabase>;
const mockDb = db as jest.Mocked<typeof db>;

describe('getNoteById', () => {
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

    const result = await getNoteById('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('로그인이 필요합니다');
  });

  it('존재하지 않는 노트는 에러를 반환해야 함', async () => {
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

    // Mock: 노트 없음
    mockDb.select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      })
    });

    const result = await getNoteById('non-existent-note');

    expect(result.success).toBe(false);
    expect(result.error).toBe('노트를 찾을 수 없습니다');
  });

  it('다른 사용자의 노트는 접근할 수 없어야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      title: '테스트 노트',
      content: '테스트 내용',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      userId: 'other-user-456', // 다른 사용자의 노트
    };

    // Mock: 인증 성공
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    } as any);

    // Mock: 노트 조회 성공
    mockDb.select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockNote])
        })
      })
    });

    const result = await getNoteById('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('이 노트에 접근할 권한이 없습니다');
  });

  it('자신의 노트는 성공적으로 조회되어야 함', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockNote = {
      id: 'note-123',
      title: '테스트 노트',
      content: '테스트 내용',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      userId: 'user-123', // 같은 사용자의 노트
    };

    // Mock: 인증 성공
    mockCreateServerSupabase.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    } as any);

    // Mock: 노트 조회 성공
    mockDb.select = jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockNote])
        })
      })
    });

    const result = await getNoteById('note-123');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockNote);
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

    const result = await getNoteById('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('노트를 불러오는데 실패했습니다');
  });
});
