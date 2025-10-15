/**
 * Gemini API 클라이언트 테스트
 */

import { GeminiClient, createGeminiClient, getGeminiClient, validateEnvironment } from '@/lib/ai/gemini';
import { GeminiError } from '@/lib/ai/types';

// 환경변수 모킹
const mockEnv = {
  GEMINI_API_KEY: 'test-api-key'
};

describe('GeminiClient', () => {
  let client: GeminiClient;

  beforeEach(() => {
    // 환경변수 모킹
    process.env.GEMINI_API_KEY = mockEnv.GEMINI_API_KEY;
    
    client = new GeminiClient({
      apiKey: mockEnv.GEMINI_API_KEY
    });
  });

  afterEach(() => {
    // 환경변수 정리
    delete process.env.GEMINI_API_KEY;
  });

  describe('calculateTokens', () => {
    it('텍스트 토큰 수를 올바르게 계산해야 한다', () => {
      const shortText = 'Hello world';
      const result = client.calculateTokens(shortText);
      
      expect(result.count).toBeGreaterThan(0);
      expect(result.isWithinLimit).toBe(true);
      expect(result.truncatedText).toBeUndefined();
    });

    it('긴 텍스트에 대해 토큰 제한을 확인해야 한다', () => {
      const longText = 'A'.repeat(50000); // 매우 긴 텍스트
      const result = client.calculateTokens(longText);
      
      expect(result.count).toBeGreaterThan(8000);
      expect(result.isWithinLimit).toBe(false);
      expect(result.truncatedText).toBeDefined();
    });
  });

  describe('truncateText', () => {
    it('토큰 제한 내 텍스트는 그대로 반환해야 한다', () => {
      const shortText = 'Hello world';
      const result = client.truncateText(shortText);
      
      expect(result).toBe(shortText);
    });

    it('토큰 제한 초과 텍스트는 자르기해야 한다', () => {
      const longText = 'A'.repeat(50000);
      const result = client.truncateText(longText);
      
      expect(result.length).toBeLessThan(longText.length);
    });
  });

  describe('validateApiKey', () => {
    it('유효한 API 키에 대해 true를 반환해야 한다', async () => {
      // @google/genai API 호출을 모킹
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: 'test response'
      });
      
      // @ts-ignore - private 메서드 접근
      client.client.models.generateContent = mockGenerateContent;
      
      const result = await client.validateApiKey();
      expect(result).toBe(true);
    });

    it('유효하지 않은 API 키에 대해 false를 반환해야 한다', async () => {
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('Invalid API key'));
      
      // @ts-ignore - private 메서드 접근
      client.client.models.generateContent = mockGenerateContent;
      
      const result = await client.validateApiKey();
      expect(result).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('연결 테스트가 성공해야 한다', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: 'test response'
      });
      
      // @ts-ignore - private 메서드 접근
      client.generateContent = mockGenerateContent;
      
      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('연결 테스트가 실패해야 한다', async () => {
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      // @ts-ignore - private 메서드 접근
      client.generateContent = mockGenerateContent;
      
      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });
});

describe('createGeminiClient', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = mockEnv.GEMINI_API_KEY;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('유효한 API 키로 클라이언트를 생성해야 한다', () => {
    const client = createGeminiClient();
    expect(client).toBeInstanceOf(GeminiClient);
  });

  it('API 키가 없으면 에러를 던져야 한다', () => {
    delete process.env.GEMINI_API_KEY;
    
    expect(() => createGeminiClient()).toThrow(GeminiError);
  });

  it('기본값 API 키면 에러를 던져야 한다', () => {
    process.env.GEMINI_API_KEY = 'your-gemini-api-key-here';
    
    expect(() => createGeminiClient()).toThrow(GeminiError);
  });
});

describe('getGeminiClient', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = mockEnv.GEMINI_API_KEY;
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  it('싱글톤 인스턴스를 반환해야 한다', () => {
    const client1 = getGeminiClient();
    const client2 = getGeminiClient();
    
    expect(client1).toBe(client2);
  });
});

describe('validateEnvironment', () => {
  it('필수 환경변수가 있으면 통과해야 한다', () => {
    process.env.GEMINI_API_KEY = mockEnv.GEMINI_API_KEY;
    
    expect(() => validateEnvironment()).not.toThrow();
  });

  it('필수 환경변수가 없으면 에러를 던져야 한다', () => {
    delete process.env.GEMINI_API_KEY;
    
    expect(() => validateEnvironment()).toThrow(GeminiError);
  });
});
