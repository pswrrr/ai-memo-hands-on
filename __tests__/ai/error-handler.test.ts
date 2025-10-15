/**
 * AI 에러 핸들링 테스트
 */

import {
  classifyError,
  createAIError,
  isRetryableError,
  getRetryDelay,
  handleAIError,
  getErrorRecoveryGuide
} from '../../lib/ai/error-handler';
import { AIErrorType } from '../../lib/ai/types';

describe('AI Error Handler', () => {
  describe('classifyError', () => {
    it('should classify TOKEN_LIMIT_EXCEEDED error correctly', () => {
      const error = { code: 'TOKEN_LIMIT_EXCEEDED' };
      expect(classifyError(error)).toBe(AIErrorType.TOKEN_LIMIT);
    });

    it('should classify MISSING_API_KEY error correctly', () => {
      const error = { code: 'MISSING_API_KEY' };
      expect(classifyError(error)).toBe(AIErrorType.AUTH_ERROR);
    });

    it('should classify INVALID_API_KEY error correctly', () => {
      const error = { code: 'INVALID_API_KEY' };
      expect(classifyError(error)).toBe(AIErrorType.AUTH_ERROR);
    });

    it('should classify API_CALL_FAILED error correctly', () => {
      const error = { code: 'API_CALL_FAILED' };
      expect(classifyError(error)).toBe(AIErrorType.API_ERROR);
    });

    it('should classify timeout errors correctly', () => {
      const error = { message: 'Request timeout' };
      expect(classifyError(error)).toBe(AIErrorType.TIMEOUT);
    });

    it('should classify quota errors correctly', () => {
      const error = { message: 'quota exceeded' };
      expect(classifyError(error)).toBe(AIErrorType.QUOTA_EXCEEDED);
    });

    it('should classify rate limit errors correctly', () => {
      const error = { message: 'rate limit exceeded' };
      expect(classifyError(error)).toBe(AIErrorType.QUOTA_EXCEEDED);
    });

    it('should classify unauthorized errors correctly', () => {
      const error = { message: 'unauthorized access' };
      expect(classifyError(error)).toBe(AIErrorType.AUTH_ERROR);
    });

    it('should classify unknown errors as UNKNOWN', () => {
      const error = { message: 'Some random error' };
      expect(classifyError(error)).toBe(AIErrorType.UNKNOWN);
    });
  });

  describe('createAIError', () => {
    it('should create AI error with correct type and messages', () => {
      const originalError = { code: 'TOKEN_LIMIT_EXCEEDED', message: 'Token limit exceeded' };
      const aiError = createAIError(originalError);

      expect(aiError.type).toBe(AIErrorType.TOKEN_LIMIT);
      expect(aiError.code).toBe('TOKEN_LIMIT_EXCEEDED');
      expect(aiError.message).toBe('Token limit exceeded');
      expect(aiError.userMessage).toContain('텍스트가 너무 길어서');
      expect(aiError.timestamp).toBeInstanceOf(Date);
      expect(aiError.retryable).toBe(false);
    });

    it('should create AI error with custom type', () => {
      const originalError = { message: 'Some error' };
      const aiError = createAIError(originalError, AIErrorType.API_ERROR);

      expect(aiError.type).toBe(AIErrorType.API_ERROR);
      expect(aiError.userMessage).toContain('AI 서비스에 일시적인 문제');
    });

    it('should include additional details', () => {
      const originalError = { message: 'Test error' };
      const additionalDetails = { userId: 'user123', noteId: 'note456' };
      const aiError = createAIError(originalError, AIErrorType.UNKNOWN, additionalDetails);

      expect(aiError.details).toMatchObject({
        originalError,
        userId: 'user123',
        noteId: 'note456'
      });
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      expect(isRetryableError(AIErrorType.API_ERROR)).toBe(true);
      expect(isRetryableError(AIErrorType.TIMEOUT)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(isRetryableError(AIErrorType.TOKEN_LIMIT)).toBe(false);
      expect(isRetryableError(AIErrorType.QUOTA_EXCEEDED)).toBe(false);
      expect(isRetryableError(AIErrorType.AUTH_ERROR)).toBe(false);
      expect(isRetryableError(AIErrorType.UNKNOWN)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return correct retry delays', () => {
      expect(getRetryDelay(AIErrorType.API_ERROR)).toBe(5);
      expect(getRetryDelay(AIErrorType.TIMEOUT)).toBe(10);
      expect(getRetryDelay(AIErrorType.QUOTA_EXCEEDED)).toBe(3600);
    });

    it('should return undefined for non-retryable errors', () => {
      expect(getRetryDelay(AIErrorType.TOKEN_LIMIT)).toBeUndefined();
      expect(getRetryDelay(AIErrorType.AUTH_ERROR)).toBeUndefined();
      expect(getRetryDelay(AIErrorType.UNKNOWN)).toBeUndefined();
    });
  });

  describe('handleAIError', () => {
    it('should handle error and return error result', async () => {
      const error = { code: 'API_CALL_FAILED', message: 'API call failed' };
      const context = { userId: 'user123', noteId: 'note456' };

      const result = await handleAIError(error, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe(AIErrorType.API_ERROR);
      expect(result.error?.details?.userId).toBe('user123');
      expect(result.error?.details?.noteId).toBe('note456');
    });

    it('should set retry information for retryable errors', async () => {
      const error = { message: 'Request timeout' };
      const result = await handleAIError(error);

      expect(result.error?.retryable).toBe(true);
      expect(result.error?.retryAfter).toBe(10);
      expect(result.nextRetryAt).toBeDefined();
    });

    it('should not set retry information for non-retryable errors', async () => {
      const error = { code: 'TOKEN_LIMIT_EXCEEDED' };
      const result = await handleAIError(error);

      expect(result.error?.retryable).toBe(false);
      expect(result.error?.retryAfter).toBeUndefined();
      expect(result.nextRetryAt).toBeUndefined();
    });
  });

  describe('getErrorRecoveryGuide', () => {
    it('should return recovery guide for API_ERROR', () => {
      const guide = getErrorRecoveryGuide(AIErrorType.API_ERROR);
      expect(guide).toContain('네트워크 연결을 확인해주세요.');
      expect(guide).toContain('잠시 후 다시 시도해주세요.');
    });

    it('should return recovery guide for TOKEN_LIMIT', () => {
      const guide = getErrorRecoveryGuide(AIErrorType.TOKEN_LIMIT);
      expect(guide).toContain('텍스트를 더 짧게 작성해주세요.');
      expect(guide).toContain('여러 개의 짧은 노트로 나누어 작성해주세요.');
    });

    it('should return recovery guide for TIMEOUT', () => {
      const guide = getErrorRecoveryGuide(AIErrorType.TIMEOUT);
      expect(guide).toContain('네트워크 속도를 확인해주세요.');
      expect(guide).toContain('텍스트를 더 짧게 작성해주세요.');
    });

    it('should return recovery guide for QUOTA_EXCEEDED', () => {
      const guide = getErrorRecoveryGuide(AIErrorType.QUOTA_EXCEEDED);
      expect(guide).toContain('내일 다시 시도해주세요.');
      expect(guide).toContain('수동으로 요약/태그를 작성해주세요.');
    });

    it('should return recovery guide for AUTH_ERROR', () => {
      const guide = getErrorRecoveryGuide(AIErrorType.AUTH_ERROR);
      expect(guide).toContain('로그아웃 후 다시 로그인해주세요.');
      expect(guide).toContain('브라우저 캐시를 삭제해주세요.');
    });

    it('should return recovery guide for UNKNOWN', () => {
      const guide = getErrorRecoveryGuide(AIErrorType.UNKNOWN);
      expect(guide).toContain('페이지를 새로고침해주세요.');
      expect(guide).toContain('문제가 지속되면 관리자에게 문의해주세요.');
    });
  });
});
