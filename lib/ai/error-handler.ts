/**
 * AI 처리 에러 핸들링 서비스
 */

import { AIError, AIErrorType, ErrorHandlingResult, ErrorStats, ErrorAlertConfig } from './types';

// AIErrorType을 re-export
export { AIErrorType };

// 에러 메시지 매핑 테이블
const ERROR_MESSAGES: Record<AIErrorType, { user: string; technical: string }> = {
  [AIErrorType.API_ERROR]: {
    user: 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
    technical: 'Gemini API 호출 실패'
  },
  [AIErrorType.TOKEN_LIMIT]: {
    user: '텍스트가 너무 길어서 처리할 수 없습니다. 텍스트를 줄여서 다시 시도해주세요.',
    technical: '토큰 제한 초과 (8k 토큰)'
  },
  [AIErrorType.TIMEOUT]: {
    user: '요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.',
    technical: '요청 타임아웃 (30초 초과)'
  },
  [AIErrorType.QUOTA_EXCEEDED]: {
    user: '일일 사용 한도를 초과했습니다. 내일 다시 시도하거나 관리자에게 문의해주세요.',
    technical: 'API 할당량 초과'
  },
  [AIErrorType.AUTH_ERROR]: {
    user: '인증에 문제가 발생했습니다. 로그아웃 후 다시 로그인해주세요.',
    technical: 'API 키 인증 실패'
  },
  [AIErrorType.UNKNOWN]: {
    user: '예상치 못한 오류가 발생했습니다. 문제가 지속되면 관리자에게 문의해주세요.',
    technical: '알 수 없는 에러'
  }
};

// 에러 분류 함수
export function classifyError(error: any): AIErrorType {
  if (error?.code) {
    switch (error.code) {
      case 'TOKEN_LIMIT_EXCEEDED':
        return AIErrorType.TOKEN_LIMIT;
      case 'MISSING_API_KEY':
      case 'INVALID_API_KEY':
        return AIErrorType.AUTH_ERROR;
      case 'API_CALL_FAILED':
        return AIErrorType.API_ERROR;
      default:
        if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
          return AIErrorType.TIMEOUT;
        }
        if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
          return AIErrorType.QUOTA_EXCEEDED;
        }
        return AIErrorType.API_ERROR;
    }
  }

  if (error?.message) {
    const message = error.message.toLowerCase();
    if (message.includes('timeout') || message.includes('timed out')) {
      return AIErrorType.TIMEOUT;
    }
    if (message.includes('quota') || message.includes('rate limit') || message.includes('rate_limit')) {
      return AIErrorType.QUOTA_EXCEEDED;
    }
    if (message.includes('unauthorized') || message.includes('forbidden') || message.includes('auth')) {
      return AIErrorType.AUTH_ERROR;
    }
  }

  return AIErrorType.UNKNOWN;
}

// AI 에러 생성
export function createAIError(
  error: any,
  type?: AIErrorType,
  additionalDetails?: any
): AIError {
  const errorType = type || classifyError(error);
  const messages = ERROR_MESSAGES[errorType];
  
  return {
    type: errorType,
    code: error?.code || 'UNKNOWN_ERROR',
    message: error?.message || messages.technical,
    userMessage: messages.user,
    details: {
      originalError: error,
      ...additionalDetails
    },
    timestamp: new Date(),
    retryable: isRetryableError(errorType),
    retryAfter: getRetryDelay(errorType)
  };
}

// 재시도 가능한 에러인지 확인
export function isRetryableError(errorType: AIErrorType): boolean {
  const retryableErrors = [
    AIErrorType.API_ERROR,
    AIErrorType.TIMEOUT
  ];
  
  return retryableErrors.includes(errorType);
}

// 재시도 지연 시간 계산
export function getRetryDelay(errorType: AIErrorType): number | undefined {
  switch (errorType) {
    case AIErrorType.API_ERROR:
      return 5; // 5초 후 재시도
    case AIErrorType.TIMEOUT:
      return 10; // 10초 후 재시도
    case AIErrorType.QUOTA_EXCEEDED:
      return 3600; // 1시간 후 재시도
    default:
      return undefined;
  }
}

// 에러 처리 메인 함수
export async function handleAIError(
  error: any,
  context?: {
    userId?: string;
    noteId?: string;
    operation?: string;
  }
): Promise<ErrorHandlingResult> {
  const aiError = createAIError(error, undefined, context);
  
  // 에러 로깅
  await logError(aiError, context);
  
  // 에러 통계 업데이트
  await updateErrorStats(aiError, context);
  
  // 알림 발송 (필요한 경우)
  await checkAndSendAlert(aiError, context);
  
  return {
    success: false,
    error: aiError,
    retryCount: 0,
    nextRetryAt: aiError.retryAfter ? new Date(Date.now() + aiError.retryAfter * 1000) : undefined
  };
}

// 에러 로깅
async function logError(error: AIError, context?: any): Promise<void> {
  const logEntry = {
    timestamp: error.timestamp.toISOString(),
    type: error.type,
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    context,
    retryable: error.retryable,
    retryAfter: error.retryAfter
  };
  
  // 콘솔 로깅 (개발 환경)
  if (process.env.NODE_ENV === 'development') {
    console.error('AI Error:', logEntry);
  }
  
  // TODO: 실제 로깅 시스템에 저장 (예: 데이터베이스, 로그 파일 등)
  // await saveErrorLog(logEntry);
}

// 에러 통계 업데이트
async function updateErrorStats(error: AIError, context?: any): Promise<void> {
  // TODO: 에러 통계를 데이터베이스에 저장
  // await updateErrorStatsInDB(error, context);
}

// 알림 발송 확인
async function checkAndSendAlert(error: AIError, context?: any): Promise<void> {
  // TODO: 에러 임계값 확인 및 알림 발송
  // await checkErrorThresholdsAndSendAlert(error, context);
}

// 에러 통계 조회
export async function getErrorStats(
  timeRange?: { start: Date; end: Date },
  userId?: string
): Promise<ErrorStats> {
  // TODO: 실제 데이터베이스에서 에러 통계 조회
  return {
    totalErrors: 0,
    errorsByType: {
      [AIErrorType.API_ERROR]: 0,
      [AIErrorType.TOKEN_LIMIT]: 0,
      [AIErrorType.TIMEOUT]: 0,
      [AIErrorType.QUOTA_EXCEEDED]: 0,
      [AIErrorType.AUTH_ERROR]: 0,
      [AIErrorType.UNKNOWN]: 0
    },
    errorsByUser: {},
    errorRate: 0
  };
}

// 에러 복구 가이드 생성
export function getErrorRecoveryGuide(errorType: AIErrorType): string[] {
  const guides: Record<AIErrorType, string[]> = {
    [AIErrorType.API_ERROR]: [
      '네트워크 연결을 확인해주세요.',
      '잠시 후 다시 시도해주세요.',
      '문제가 지속되면 관리자에게 문의해주세요.'
    ],
    [AIErrorType.TOKEN_LIMIT]: [
      '텍스트를 더 짧게 작성해주세요.',
      '불필요한 내용을 제거해주세요.',
      '여러 개의 짧은 노트로 나누어 작성해주세요.'
    ],
    [AIErrorType.TIMEOUT]: [
      '네트워크 속도를 확인해주세요.',
      '텍스트를 더 짧게 작성해주세요.',
      '잠시 후 다시 시도해주세요.'
    ],
    [AIErrorType.QUOTA_EXCEEDED]: [
      '내일 다시 시도해주세요.',
      '관리자에게 사용량 증가를 요청해주세요.',
      '수동으로 요약/태그를 작성해주세요.'
    ],
    [AIErrorType.AUTH_ERROR]: [
      '로그아웃 후 다시 로그인해주세요.',
      '브라우저 캐시를 삭제해주세요.',
      '문제가 지속되면 관리자에게 문의해주세요.'
    ],
    [AIErrorType.UNKNOWN]: [
      '페이지를 새로고침해주세요.',
      '잠시 후 다시 시도해주세요.',
      '문제가 지속되면 관리자에게 문의해주세요.'
    ]
  };
  
  return guides[errorType] || guides[AIErrorType.UNKNOWN];
}
