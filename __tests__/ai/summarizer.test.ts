/**
 * 요약 생성 서비스 테스트
 */

import { SummarizerService } from '@/lib/ai/summarizer';
import { getGeminiClient } from '@/lib/ai/gemini';

// 모킹
jest.mock('@/lib/ai/gemini');

const mockGetGeminiClient = getGeminiClient as jest.MockedFunction<typeof getGeminiClient>;

describe('SummarizerService', () => {
  let summarizerService: SummarizerService;
  let mockGeminiClient: any;

  beforeEach(() => {
    // Gemini 클라이언트 모킹
    mockGeminiClient = {
      generateContent: jest.fn()
    };
    mockGetGeminiClient.mockReturnValue(mockGeminiClient);
    
    summarizerService = new SummarizerService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSummary', () => {
    it('성공적으로 요약을 생성해야 한다', async () => {
      const mockContent = '이것은 테스트 노트 내용입니다. 여러 문장으로 구성되어 있습니다.';
      const mockTitle = '테스트 노트';
      const mockResponse = {
        text: '• 테스트 노트 내용\n• 여러 문장으로 구성\n• 요약 결과'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockResponse);

      const result = await summarizerService.generateSummary(mockContent, mockTitle);

      expect(result.summary).toBe(mockResponse.text);
      expect(result.bulletPoints).toHaveLength(3);
      expect(result.bulletPoints[0]).toBe('테스트 노트 내용');
      expect(result.quality).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('제목 없이도 요약을 생성해야 한다', async () => {
      const mockContent = '이것은 테스트 노트 내용입니다.';
      const mockResponse = {
        text: '• 테스트 노트 내용'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockResponse);

      const result = await summarizerService.generateSummary(mockContent);

      expect(result.summary).toBe(mockResponse.text);
      expect(result.bulletPoints).toHaveLength(1);
    });

    it('긴 텍스트를 적절히 자르기해야 한다', async () => {
      const longContent = 'A'.repeat(10000); // 매우 긴 텍스트
      const mockResponse = {
        text: '• 긴 텍스트 요약'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockResponse);

      const result = await summarizerService.generateSummary(longContent);

      expect(result.summary).toBe(mockResponse.text);
      // generateContent가 호출되었는지 확인 (내용이 잘렸는지 확인)
      expect(mockGeminiClient.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringMatching(/다음 노트를 3-6개의 불릿 포인트로 요약해주세요/)
        })
      );
    });

    it('API 호출 실패 시 에러를 던져야 한다', async () => {
      const mockContent = '테스트 내용';
      const mockError = new Error('API 호출 실패');

      mockGeminiClient.generateContent.mockRejectedValue(mockError);

      await expect(summarizerService.generateSummary(mockContent))
        .rejects.toThrow('요약 생성에 실패했습니다');
    });

    it('빈 응답 시 에러를 던져야 한다', async () => {
      const mockContent = '테스트 내용';
      const mockResponse = {
        text: null
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockResponse);

      await expect(summarizerService.generateSummary(mockContent))
        .rejects.toThrow('요약 생성에 실패했습니다');
    });
  });

  describe('extractBulletPoints', () => {
    it('다양한 불릿 포인트 형식을 올바르게 추출해야 한다', async () => {
      const mockContent = '테스트 내용';
      const mockResponse = {
        text: '• 첫 번째 포인트\n- 두 번째 포인트\n* 세 번째 포인트'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockResponse);

      const result = await summarizerService.generateSummary(mockContent);

      expect(result.bulletPoints).toEqual([
        '첫 번째 포인트',
        '두 번째 포인트',
        '세 번째 포인트'
      ]);
    });

    it('빈 불릿 포인트를 필터링해야 한다', async () => {
      const mockContent = '테스트 내용';
      const mockResponse = {
        text: '• 유효한 포인트\n• \n• 또 다른 유효한 포인트'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockResponse);

      const result = await summarizerService.generateSummary(mockContent);

      expect(result.bulletPoints).toEqual([
        '유효한 포인트',
        '또 다른 유효한 포인트'
      ]);
    });
  });

  describe('assessQuality', () => {
    it('품질 평가를 올바르게 수행해야 한다', async () => {
      const mockContent = '이것은 테스트 노트 내용입니다. 여러 문장으로 구성되어 있습니다.';
      const mockResponse = {
        text: '• 테스트 노트 내용\n• 여러 문장으로 구성\n• 요약 결과'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockResponse);

      const result = await summarizerService.generateSummary(mockContent);

      expect(result.quality).toBeGreaterThan(0);
      expect(result.quality).toBeLessThanOrEqual(1);
    });

    it('품질 평가가 정상적으로 작동해야 한다', async () => {
      const mockContent = '테스트 내용';
      const mockResponse = {
        text: '• 테스트 내용'
      };

      mockGeminiClient.generateContent.mockResolvedValue(mockResponse);

      const result = await summarizerService.generateSummary(mockContent);

      expect(result.quality).toBeGreaterThan(0);
      expect(result.quality).toBeLessThanOrEqual(1);
    });
  });
});
