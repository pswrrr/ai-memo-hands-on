/**
 * regenerateAI 서버 액션 테스트
 */

import { regenerateAI } from '@/app/actions/notes';
import { notesDb } from '@/lib/db/notes-db';
import { getGeminiClient, validateEnvironment } from '@/lib/ai/gemini';

// 모킹
jest.mock('@/lib/db/notes-db');
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
const mockGetGeminiClient = getGeminiClient as jest.MockedFunction<typeof getGeminiClient>;
const mockValidateEnvironment = validateEnvironment as jest.MockedFunction<typeof validateEnvironment>;

describe('regenerateAI', () => {
  const mockUser = { id: 'user-123' };
  const mockNote = {
    id: 'note-123',
    title: 'Test Note',
    content: 'This is a test note content.',
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
      mockNotesDb.createSummary.mockResolvedValue({ id: 'summary-123' });
      mockNotesDb.createTag.mockResolvedValue({ id: 'tag-123' });
      
      const mockGeminiClient = {
        testConnection: jest.fn().mockResolvedValue(true),
        generateContent: jest.fn()
          .mockResolvedValueOnce({ text: '• 요약 포인트 1\n• 요약 포인트 2' })
          .mockResolvedValueOnce({ text: '태그1, 태그2, 태그3' })
      };
      mockGetGeminiClient.mockReturnValue(mockGeminiClient as any);
    });

    it('성공적으로 AI 요약과 태그를 생성해야 한다', async () => {
      const result = await regenerateAI('note-123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.summary).toBe('• 요약 포인트 1\n• 요약 포인트 2');
      expect(result.data?.tags).toEqual(['태그1', '태그2', '태그3']);
    });

    it('요약을 데이터베이스에 저장해야 한다', async () => {
      await regenerateAI('note-123');

      expect(mockNotesDb.createSummary).toHaveBeenCalledWith(
        'note-123',
        'gemini',
        '• 요약 포인트 1\n• 요약 포인트 2'
      );
    });

    it('태그를 데이터베이스에 저장해야 한다', async () => {
      await regenerateAI('note-123');

      expect(mockNotesDb.createTag).toHaveBeenCalledTimes(3);
      expect(mockNotesDb.createTag).toHaveBeenCalledWith('note-123', '태그1');
      expect(mockNotesDb.createTag).toHaveBeenCalledWith('note-123', '태그2');
      expect(mockNotesDb.createTag).toHaveBeenCalledWith('note-123', '태그3');
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

      const result = await regenerateAI('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다');
    });
  });

  describe('환경변수 검증 실패 케이스', () => {
    it('환경변수가 설정되지 않았으면 에러를 반환해야 한다', async () => {
      mockValidateEnvironment.mockImplementation(() => {
        throw new Error('Missing environment variables');
      });

      const result = await regenerateAI('note-123');

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

      const result = await regenerateAI('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('노트를 찾을 수 없습니다');
    });
  });

  describe('API 연결 실패 케이스', () => {
    beforeEach(() => {
      mockValidateEnvironment.mockImplementation(() => {});
      mockNotesDb.getById.mockResolvedValue(mockNote);
    });

    it('API 연결 테스트가 실패하면 에러를 반환해야 한다', async () => {
      const mockGeminiClient = {
        testConnection: jest.fn().mockResolvedValue(false)
      };
      mockGetGeminiClient.mockReturnValue(mockGeminiClient as any);

      const result = await regenerateAI('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI 서비스에 연결할 수 없습니다');
    });
  });

  describe('AI 생성 실패 케이스', () => {
    beforeEach(() => {
      mockValidateEnvironment.mockImplementation(() => {});
      mockNotesDb.getById.mockResolvedValue(mockNote);
    });

    it('AI 요약 생성이 실패하면 에러를 반환해야 한다', async () => {
      const mockGeminiClient = {
        testConnection: jest.fn().mockResolvedValue(true),
        generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
      };
      mockGetGeminiClient.mockReturnValue(mockGeminiClient as any);

      const result = await regenerateAI('note-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('AI 요약/태그 생성에 실패했습니다');
    });
  });

  describe('태그 처리', () => {
    beforeEach(() => {
      mockValidateEnvironment.mockImplementation(() => {});
      mockNotesDb.getById.mockResolvedValue(mockNote);
      mockNotesDb.createSummary.mockResolvedValue({ id: 'summary-123' });
      mockNotesDb.createTag.mockResolvedValue({ id: 'tag-123' });
    });

    it('빈 태그는 필터링해야 한다', async () => {
      const mockGeminiClient = {
        testConnection: jest.fn().mockResolvedValue(true),
        generateContent: jest.fn()
          .mockResolvedValueOnce({ text: '• 요약 포인트 1' })
          .mockResolvedValueOnce({ text: '태그1, , 태그2, , 태그3' })
      };
      mockGetGeminiClient.mockReturnValue(mockGeminiClient as any);

      await regenerateAI('note-123');

      expect(mockNotesDb.createTag).toHaveBeenCalledTimes(3);
      expect(mockNotesDb.createTag).toHaveBeenCalledWith('note-123', '태그1');
      expect(mockNotesDb.createTag).toHaveBeenCalledWith('note-123', '태그2');
      expect(mockNotesDb.createTag).toHaveBeenCalledWith('note-123', '태그3');
    });

    it('최대 6개 태그만 저장해야 한다', async () => {
      const mockGeminiClient = {
        testConnection: jest.fn().mockResolvedValue(true),
        generateContent: jest.fn()
          .mockResolvedValueOnce({ text: '• 요약 포인트 1' })
          .mockResolvedValueOnce({ text: '태그1, 태그2, 태그3, 태그4, 태그5, 태그6, 태그7, 태그8' })
      };
      mockGetGeminiClient.mockReturnValue(mockGeminiClient as any);

      await regenerateAI('note-123');

      expect(mockNotesDb.createTag).toHaveBeenCalledTimes(6);
    });
  });
});
