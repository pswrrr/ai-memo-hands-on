/**
 * AI 관련 타입 정의
 */

// Gemini API 요청/응답 타입
export interface GeminiRequest {
  content: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GeminiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// API 에러 클래스
export class GeminiError extends Error {
  public code: string;
  public details?: any;

  constructor({ code, message, details }: { code: string; message: string; details?: any }) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.details = details;
  }
}

// 토큰 계산 결과
export interface TokenCount {
  count: number;
  isWithinLimit: boolean;
  truncatedText?: string;
}

// API 클라이언트 설정
export interface GeminiConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// 재시도 설정
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
}

// 요약 관련 타입
export interface SummaryResult {
  summary: string;
  bulletPoints: string[];
  quality: number;
  processingTime: number;
}

export interface QualityAssessment {
  score: number;
  criteria: {
    completeness: number;
    clarity: number;
    relevance: number;
    structure: number;
  };
}

// 태깅 결과 타입
export interface TaggingResult {
  tags: string[];
  processingTime: number;
}

// AI 에러 타입 정의
export enum AIErrorType {
  API_ERROR = 'API_ERROR',
  TOKEN_LIMIT = 'TOKEN_LIMIT',
  TIMEOUT = 'TIMEOUT',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  AUTH_ERROR = 'AUTH_ERROR',
  UNKNOWN = 'UNKNOWN'
}

// AI 에러 정보
export interface AIError {
  type: AIErrorType;
  code: string;
  message: string;
  userMessage: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
  retryAfter?: number; // 재시도까지 대기 시간 (초)
}

// 에러 처리 결과
export interface ErrorHandlingResult {
  success: boolean;
  error?: AIError;
  retryCount?: number;
  nextRetryAt?: Date;
}

// 에러 통계
export interface ErrorStats {
  totalErrors: number;
  errorsByType: Record<AIErrorType, number>;
  errorsByUser: Record<string, number>;
  lastErrorAt?: Date;
  errorRate: number; // 에러율 (에러 수 / 총 요청 수)
}

// 에러 알림 설정
export interface ErrorAlertConfig {
  enabled: boolean;
  threshold: number; // 에러 수 임계값
  timeWindow: number; // 시간 윈도우 (분)
  recipients: string[]; // 알림 받을 이메일 주소들
}
