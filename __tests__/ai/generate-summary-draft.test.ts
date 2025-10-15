import { generateSummaryDraft, applySummary } from '@/app/actions/notes';
import { createServerSupabase } from '@/lib/supabase-server';
import { notesDb } from '@/lib/db/supabase-db';
import { summarizerService } from '@/lib/ai/summarizer';

// Mock dependencies
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/db/supabase-db');
jest.mock('@/lib/ai/summarizer');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

const mockCreateServerSupabase = createServerSupabase as jest.MockedFunction<typeof createServerSupabase>;
const mockNotesDb = notesDb as jest.Mocked<typeof notesDb>;
const mockSummarizerService = summarizerService as jest.Mocked<typeof summarizerService>;

describe('generateSummaryDraft', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('성공적으로 요약 초안을 생성해야 한다', async () => {
      // Mock setup
      const mockUser = { id: 'user-1' };
      const mockNote = {
        id: 'note-1',
        title: '테스트 노트',
        content: '테스트 내용입니다.',
        userId: 'user-1'
      };
      const mockSummaryResult = {
        summary: '테스트 요약',
        bulletPoints: ['포인트 1', '포인트 2'],
        quality: 0.85,
        processingTime: 1500
      };

      mockCreateServerSupabase.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      } as any);

      mockNotesDb.getById.mockResolvedValue(mockNote as any);
      mockSummarizerService.generateSummary.mockResolvedValue(mockSummaryResult);

      // Execute
      const result = await generateSummaryDraft('note-1');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSummaryResult);
      expect(mockSummarizerService.generateSummary).toHaveBeenCalledWith(
        '테스트 내용입니다.',
        '테스트 노트',
        { temperature: 0.9 }
      );
    });
  });

  describe('인증 실패 케이스', () => {
    it('사용자가 로그인하지 않았으면 에러를 반환해야 한다', async () => {
      mockCreateServerSupabase.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated')
          })
        }
      } as any);

      const result = await generateSummaryDraft('note-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다');
    });
  });

  describe('노트 조회 실패 케이스', () => {
    it('노트를 찾을 수 없으면 에러를 반환해야 한다', async () => {
      const mockUser = { id: 'user-1' };

      mockCreateServerSupabase.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      } as any);

      mockNotesDb.getById.mockResolvedValue(null);

      const result = await generateSummaryDraft('note-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('노트를 찾을 수 없습니다');
    });
  });

  describe('노트 내용 검증', () => {
    it('노트 내용이 없으면 에러를 반환해야 한다', async () => {
      const mockUser = { id: 'user-1' };
      const mockNote = {
        id: 'note-1',
        title: '테스트 노트',
        content: '',
        userId: 'user-1'
      };

      mockCreateServerSupabase.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      } as any);

      mockNotesDb.getById.mockResolvedValue(mockNote as any);

      const result = await generateSummaryDraft('note-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('요약할 내용이 없습니다');
    });
  });
});

describe('applySummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('성공 케이스', () => {
    it('성공적으로 요약을 적용해야 한다', async () => {
      const mockUser = { id: 'user-1' };

      mockCreateServerSupabase.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null
          })
        }
      } as any);

      mockNotesDb.upsertSummary.mockResolvedValue(undefined);

      const result = await applySummary('note-1', '적용할 요약');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ summary: '적용할 요약' });
      expect(mockNotesDb.upsertSummary).toHaveBeenCalledWith(
        'note-1',
        'gemini-2.0-flash-exp',
        '적용할 요약'
      );
    });
  });

  describe('인증 실패 케이스', () => {
    it('사용자가 로그인하지 않았으면 에러를 반환해야 한다', async () => {
      mockCreateServerSupabase.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated')
          })
        }
      } as any);

      const result = await applySummary('note-1', '적용할 요약');

      expect(result.success).toBe(false);
      expect(result.error).toBe('로그인이 필요합니다');
    });
  });
});

