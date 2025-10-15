/**
 * generateSummary 서버 액션 테스트
 */

import { generateSummary, getSummary } from '@/app/actions/notes';
import { notesDb } from '@/lib/db/notes-db';
import { summarizerService } from '@/lib/ai/summarizer';
import { validateEnvironment } from '@/lib/ai/gemini';

// 모킹
jest.mock('@/lib/db/notes-db');
jest.mock('@/lib/ai/summarizer');
jest.mock('@/lib/ai/gemini');
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabase: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}));
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

const mockNotesDb = notesDb as jest.Mocked<typeof notesDb>;
const mockSummarizerService = summarizerService as jest.Mocked<typeof summarizerService>;
const mockValidateEnvironment = validateEnvironment as jest.MockedFunction<typeof validateEnvironment>;

describe('generateSummary', () => {
  const mockUser = { id: 'user-123' };
  const mockNote = {
    id: 'note-123',
    title: '테스트 노트',
    content: '이것은 테스트 노트 내용입니다.',
    user_id: 'user-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 기본 모킹 설정
    const { createServerSupabase } = require('@/lib/supabase-server');
    createServerSupabase.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    });
  });

  describe('성공 케이스', () => {
    beforeEach(() => {
      mockValidateEnvironment.mockImplementation(() => {});
      mockNotesDb.getById.mockResolvedValue(mockNote);
      mockNotesDb.upsertSummary.mockResolvedValue({ id: 'summary-123' });
      
      const mockSummaryResult = {
        summary: '• 테스트 요약\n• 두 번째 포인트',
        bulletPoints: ['테스트 요약', '두 번째 포인트'],
        quality: 0.9,
        processingTime: 1500
      };
      
      mockSummarizerService.generateSummary.mockResolvedValue(mockSummaryResult);
    });

    it('성공적으로 요약을 생성해야 한다', async () => {
      const result = await generateSummary('note-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.summary).toBe('• 테스트 요약\n• 두 번째 포인트');
      expect(result.data?.bulletPoints).toEqual(['테스트 요약', '두 번째 포인트']);
      expect(result.data?.quality).toBe(0.9);
      expect(result.data?.processingTime).toBe(1500);
    });

    it('요약을 데이터베이스에 저장해야 한다', async () => {
      await generateSummary('note-123');

      expect(mockNotesDb.upsertSummary).toHaveBeenCalledWith(
        'note-123',
        'gemini-1.5-flash',
        '• 테스트 요약\n• 두 번째 포인트'
      );
    });

    it('캐시를 무효화해야 한다', async () => {
      const { revalidatePath } = require('next/cache');
      
      await generateSummary('note-123');

      expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/notes/note-123');
    });
  });

  describe('인증 실패 케이스', () => {
    it('사용자가 로그인하지 않았으면 에러를 반환해야 한다', async () => {
      const { createServerSupabase } = require('@/lib/supabase-server');
      createServerSupabase.mockReturnValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated')
          })
        }
      });

      const result = await generateSummary('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다');
    });
  });

  describe('환경변수 검증 실패 케이스', () => {
    it('환경변수가 설정되지 않았으면 에러를 반환해야 한다', async () => {
      mockValidateEnvironment.mockImplementation(() => {
        throw new Error('Missing environment variables');
      });

      const result = await generateSummary('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI 서비스 설정이 완료되지 않았습니다');
    });
  });

  describe('노트 조회 실패 케이스', () => {
    beforeEach(() => {
      mockValidateEnvironment.mockImplementation(() => {});
    });

    it('노트를 찾을 수 없으면 에러를 반환해야 한다', async () => {
      mockNotesDb.getById.mockResolvedValue(null);

      const result = await generateSummary('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('노트를 찾을 수 없습니다');
    });
  });

  describe('노트 내용 검증', () => {
    beforeEach(() => {
      mockValidateEnvironment.mockImplementation(() => {});
    });

    it('노트 내용이 없으면 에러를 반환해야 한다', async () => {
      const noteWithoutContent = { ...mockNote, content: null };
      mockNotesDb.getById.mockResolvedValue(noteWithoutContent);

      const result = await generateSummary('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('요약할 내용이 없습니다');
    });

    it('노트 내용이 빈 문자열이면 에러를 반환해야 한다', async () => {
      const noteWithEmptyContent = { ...mockNote, content: '' };
      mockNotesDb.getById.mockResolvedValue(noteWithEmptyContent);

      const result = await generateSummary('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('요약할 내용이 없습니다');
    });

    it('노트 내용이 공백만 있으면 에러를 반환해야 한다', async () => {
      const noteWithWhitespaceContent = { ...mockNote, content: '   ' };
      mockNotesDb.getById.mockResolvedValue(noteWithWhitespaceContent);

      const result = await generateSummary('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('요약할 내용이 없습니다');
    });
  });

  describe('요약 생성 실패 케이스', () => {
    beforeEach(() => {
      mockValidateEnvironment.mockImplementation(() => {});
      mockNotesDb.getById.mockResolvedValue(mockNote);
    });

    it('요약 생성 실패 시 에러를 반환해야 한다', async () => {
      mockSummarizerService.generateSummary.mockRejectedValue(new Error('요약 생성 실패'));

      const result = await generateSummary('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('요약 생성에 실패했습니다');
    });
  });
});

describe('getSummary', () => {
  const mockUser = { id: 'user-123' };
  const mockNote = {
    id: 'note-123',
    title: '테스트 노트',
    content: '테스트 내용',
    user_id: 'user-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { createServerSupabase } = require('@/lib/supabase-server');
    createServerSupabase.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null
        })
      }
    });
  });

  it('성공적으로 요약을 조회해야 한다', async () => {
    const mockSummary = {
      id: 'summary-123',
      content: '테스트 요약',
      model: 'gemini-1.5-flash',
      created_at: '2024-01-01T00:00:00Z'
    };

    mockNotesDb.getById.mockResolvedValue(mockNote);
    mockNotesDb.getSummaryByNoteId.mockResolvedValue(mockSummary);

    const result = await getSummary('note-123');

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockSummary);
  });

  it('사용자가 로그인하지 않았으면 에러를 반환해야 한다', async () => {
    const { createServerSupabase } = require('@/lib/supabase-server');
    createServerSupabase.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated')
        })
      }
    });

    const result = await getSummary('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('로그인이 필요합니다');
  });

  it('노트를 찾을 수 없으면 에러를 반환해야 한다', async () => {
    mockNotesDb.getById.mockResolvedValue(null);

    const result = await getSummary('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('노트를 찾을 수 없습니다');
  });

  it('요약 조회 실패 시 에러를 반환해야 한다', async () => {
    mockNotesDb.getById.mockResolvedValue(mockNote);
    mockNotesDb.getSummaryByNoteId.mockRejectedValue(new Error('조회 실패'));

    const result = await getSummary('note-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('요약을 불러오는데 실패했습니다');
  });
});
