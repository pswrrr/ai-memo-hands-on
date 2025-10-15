/**
 * Google Gemini API 클라이언트 및 서비스 함수
 */

import { GoogleGenAI } from '@google/genai';
import {
  GeminiRequest,
  GeminiResponse,
  GeminiError,
  TokenCount,
  GeminiConfig,
  RetryConfig
} from './types';

// 상수 정의
const MAX_TOKENS = 8000;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MODEL = 'gemini-2.0-flash-exp';

// 재시도 설정
const RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2
};

/**
 * Gemini API 클라이언트 클래스
 */
export class GeminiClient {
  private client: GoogleGenAI;
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = {
      model: DEFAULT_MODEL,
      maxTokens: MAX_TOKENS,
      temperature: DEFAULT_TEMPERATURE,
      ...config
    };

    this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
  }

  /**
   * API 키 유효성 검증
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.client.models.generateContent({
        model: this.config.model!,
        contents: 'test',
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // 사고 기능 비활성화
          },
        }
      });
      return !!response.text;
    } catch (error) {
      console.error('API 키 검증 실패:', error);
      return false;
    }
  }

  /**
   * 텍스트 토큰 계산 (대략적 추정)
   */
  calculateTokens(text: string): TokenCount {
    // 대략적인 토큰 계산: 영어 기준 1토큰 ≈ 4문자, 한국어 기준 1토큰 ≈ 2문자
    const estimatedTokens = Math.ceil(text.length / 3);
    const isWithinLimit = estimatedTokens <= MAX_TOKENS;
    
    let truncatedText: string | undefined;
    if (!isWithinLimit) {
      // 토큰 제한에 맞춰 텍스트 자르기 (대략 80% 지점에서 자르기)
      const truncateAt = Math.floor(text.length * 0.8);
      truncatedText = text.substring(0, truncateAt);
    }

    return {
      count: estimatedTokens,
      isWithinLimit,
      truncatedText
    };
  }

  /**
   * 텍스트를 토큰 제한에 맞게 자르기
   */
  truncateText(text: string): string {
    const tokenCount = this.calculateTokens(text);
    if (tokenCount.isWithinLimit) {
      return text;
    }
    
    // 토큰 제한에 맞춰 텍스트를 더 정확하게 자르기
    const targetLength = Math.floor(text.length * (MAX_TOKENS / tokenCount.count));
    return text.substring(0, targetLength);
  }

  /**
   * Gemini API 호출 (재시도 로직 포함)
   */
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    const { content, maxTokens, temperature } = request;
    
    // 토큰 제한 검증
    const tokenCount = this.calculateTokens(content);
    if (!tokenCount.isWithinLimit) {
      throw new GeminiError({
        code: 'TOKEN_LIMIT_EXCEEDED',
        message: `텍스트가 토큰 제한(${MAX_TOKENS})을 초과합니다. 현재: ${tokenCount.count}토큰`
      });
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model: this.config.model!,
          contents: content,
          config: {
            thinkingConfig: {
              thinkingBudget: 0, // 사고 기능 비활성화
            },
          }
        });

        return {
          text: response.text || '',
          usage: {
            promptTokens: tokenCount.count,
            completionTokens: Math.ceil((response.text || '').length / 3),
            totalTokens: tokenCount.count + Math.ceil((response.text || '').length / 3)
          }
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`API 호출 실패 (시도 ${attempt}/${RETRY_CONFIG.maxAttempts}):`, error);

        if (attempt < RETRY_CONFIG.maxAttempts) {
          const delay = RETRY_CONFIG.delayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new GeminiError({
      code: 'API_CALL_FAILED',
      message: `API 호출이 ${RETRY_CONFIG.maxAttempts}번 시도 후 실패했습니다. 마지막 에러: ${lastError?.message}`,
      details: lastError
    });
  }

  /**
   * API 연결 테스트
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.generateContent({
        content: '안녕하세요. 연결 테스트입니다.'
      });
      return !!result.text;
    } catch (error) {
      console.error('API 연결 테스트 실패:', error);
      return false;
    }
  }
}

/**
 * Gemini API 클라이언트 인스턴스 생성
 */
export function createGeminiClient(): GeminiClient {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new GeminiError({
      code: 'MISSING_API_KEY',
      message: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.'
    });
  }

  if (apiKey === 'your-gemini-api-key-here') {
    throw new GeminiError({
      code: 'INVALID_API_KEY',
      message: 'GEMINI_API_KEY가 기본값으로 설정되어 있습니다. 실제 API 키로 변경해주세요.'
    });
  }

  return new GeminiClient({ apiKey });
}

/**
 * 전역 Gemini 클라이언트 인스턴스 (싱글톤)
 */
let globalGeminiClient: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!globalGeminiClient) {
    globalGeminiClient = createGeminiClient();
  }
  return globalGeminiClient;
}

/**
 * 환경변수 로딩 및 검증
 */
export function validateEnvironment(): void {
  const requiredEnvVars = ['GEMINI_API_KEY'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new GeminiError({
        code: 'MISSING_ENV_VAR',
        message: `${envVar} 환경변수가 설정되지 않았습니다.`
      });
    }
  }
}
