/**
 * 토큰 계산 함수 테스트
 */

import { GeminiClient } from '@/lib/ai/gemini';

describe('Token Calculator', () => {
  let client: GeminiClient;

  beforeEach(() => {
    client = new GeminiClient({
      apiKey: 'test-api-key'
    });
  });

  describe('calculateTokens', () => {
    it('빈 문자열의 토큰 수를 계산해야 한다', () => {
      const result = client.calculateTokens('');
      
      expect(result.count).toBe(0);
      expect(result.isWithinLimit).toBe(true);
      expect(result.truncatedText).toBeUndefined();
    });

    it('짧은 텍스트의 토큰 수를 계산해야 한다', () => {
      const text = 'Hello, world!';
      const result = client.calculateTokens(text);
      
      expect(result.count).toBeGreaterThan(0);
      expect(result.count).toBeLessThan(10);
      expect(result.isWithinLimit).toBe(true);
      expect(result.truncatedText).toBeUndefined();
    });

    it('한국어 텍스트의 토큰 수를 계산해야 한다', () => {
      const text = '안녕하세요, 세계!';
      const result = client.calculateTokens(text);
      
      expect(result.count).toBeGreaterThan(0);
      expect(result.isWithinLimit).toBe(true);
      expect(result.truncatedText).toBeUndefined();
    });

    it('긴 텍스트의 토큰 수를 계산해야 한다', () => {
      const text = 'A'.repeat(10000);
      const result = client.calculateTokens(text);
      
      expect(result.count).toBeGreaterThan(1000);
      expect(result.isWithinLimit).toBe(true);
      expect(result.truncatedText).toBeUndefined();
    });

    it('토큰 제한을 초과하는 텍스트를 감지해야 한다', () => {
      const text = 'A'.repeat(50000);
      const result = client.calculateTokens(text);
      
      expect(result.count).toBeGreaterThan(8000);
      expect(result.isWithinLimit).toBe(false);
      expect(result.truncatedText).toBeDefined();
      expect(result.truncatedText!.length).toBeLessThan(text.length);
    });

    it('정확한 토큰 제한을 확인해야 한다', () => {
      const text = 'A'.repeat(24000); // 대략 8000 토큰
      const result = client.calculateTokens(text);
      
      expect(result.count).toBeCloseTo(8000, 0);
      expect(result.isWithinLimit).toBe(true);
    });
  });

  describe('truncateText', () => {
    it('토큰 제한 내 텍스트는 변경하지 않아야 한다', () => {
      const text = 'Hello, world!';
      const result = client.truncateText(text);
      
      expect(result).toBe(text);
    });

    it('토큰 제한 초과 텍스트는 자르기해야 한다', () => {
      const text = 'A'.repeat(50000);
      const result = client.truncateText(text);
      
      expect(result.length).toBeLessThan(text.length);
      expect(result.length).toBeGreaterThan(0);
    });

    it('자른 텍스트의 토큰 수가 제한 내에 있어야 한다', () => {
      const text = 'A'.repeat(50000);
      const truncated = client.truncateText(text);
      const tokenCount = client.calculateTokens(truncated);
      
      expect(tokenCount.isWithinLimit).toBe(true);
    });

    it('여러 번 자르기해도 일관된 결과를 반환해야 한다', () => {
      const text = 'A'.repeat(50000);
      const result1 = client.truncateText(text);
      const result2 = client.truncateText(text);
      
      expect(result1).toBe(result2);
    });
  });

  describe('Edge Cases', () => {
    it('특수 문자가 포함된 텍스트를 처리해야 한다', () => {
      const text = 'Hello! @#$%^&*()_+{}|:"<>?[]\\;\',./';
      const result = client.calculateTokens(text);
      
      expect(result.count).toBeGreaterThan(0);
      expect(result.isWithinLimit).toBe(true);
    });

    it('개행 문자가 포함된 텍스트를 처리해야 한다', () => {
      const text = 'Line 1\nLine 2\nLine 3';
      const result = client.calculateTokens(text);
      
      expect(result.count).toBeGreaterThan(0);
      expect(result.isWithinLimit).toBe(true);
    });

    it('유니코드 문자가 포함된 텍스트를 처리해야 한다', () => {
      const text = 'Hello 🌍 World! 你好世界!';
      const result = client.calculateTokens(text);
      
      expect(result.count).toBeGreaterThan(0);
      expect(result.isWithinLimit).toBe(true);
    });

    it('매우 긴 단어를 처리해야 한다', () => {
      const text = 'A'.repeat(100000);
      const result = client.calculateTokens(text);
      
      expect(result.count).toBeGreaterThan(8000);
      expect(result.isWithinLimit).toBe(false);
      expect(result.truncatedText).toBeDefined();
    });
  });
});
