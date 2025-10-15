/**
 * 로깅 서비스
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(entry: LogEntry): string {
    const { level, message, timestamp, context, userId, sessionId, requestId, error } = entry;
    
    const logData = {
      timestamp: timestamp.toISOString(),
      level,
      message,
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
      ...(requestId && { requestId }),
      ...(context && { context }),
      ...(error && { error })
    };

    return JSON.stringify(logData, null, 2);
  }

  private async writeToConsole(entry: LogEntry): Promise<void> {
    if (!this.config.enableConsole) return;

    const formatted = this.formatLogEntry(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.enableFile) return;

    // TODO: 파일 로깅 구현
    // 실제 환경에서는 winston, pino 등의 로깅 라이브러리 사용
    console.log('File logging not implemented yet');
  }

  private async writeToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry)
      });
    } catch (error) {
      console.error('Failed to send log to remote endpoint:', error);
    }
  }

  private async log(level: LogLevel, message: string, context?: Record<string, any>): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    // 병렬로 모든 로깅 대상에 전송
    await Promise.allSettled([
      this.writeToConsole(entry),
      this.writeToFile(entry),
      this.writeToRemote(entry)
    ]);
  }

  async debug(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, context);
  }

  async info(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.INFO, message, context);
  }

  async warn(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.WARN, message, context);
  }

  async error(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.ERROR, message, context);
  }

  // AI 관련 특화 로깅 메서드들
  async logAIError(error: any, context?: Record<string, any>): Promise<void> {
    await this.error('AI processing error', {
      ...context,
      error: {
        name: error?.name || 'UnknownError',
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        code: error?.code
      }
    });
  }

  async logAIRequest(request: any, context?: Record<string, any>): Promise<void> {
    await this.info('AI request initiated', {
      ...context,
      request: {
        type: request?.type,
        contentLength: request?.content?.length,
        model: request?.model
      }
    });
  }

  async logAIResponse(response: any, context?: Record<string, any>): Promise<void> {
    await this.info('AI response received', {
      ...context,
      response: {
        success: response?.success,
        processingTime: response?.processingTime,
        tokenUsage: response?.tokenUsage
      }
    });
  }

  async logTokenUsage(usage: any, context?: Record<string, any>): Promise<void> {
    await this.info('Token usage recorded', {
      ...context,
      usage: {
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        totalTokens: usage?.totalTokens,
        cost: usage?.cost
      }
    });
  }
}

// 기본 로거 인스턴스
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableFile: false,
  enableRemote: false
};

export const logger = new Logger(defaultConfig);

// 특화된 로거들
export const aiLogger = {
  error: (error: any, context?: Record<string, any>) => logger.logAIError(error, context),
  request: (request: any, context?: Record<string, any>) => logger.logAIRequest(request, context),
  response: (response: any, context?: Record<string, any>) => logger.logAIResponse(response, context),
  tokenUsage: (usage: any, context?: Record<string, any>) => logger.logTokenUsage(usage, context)
};

// 유틸리티 함수들
export function createRequestLogger(requestId: string) {
  return {
    debug: (message: string, context?: Record<string, any>) => 
      logger.debug(message, { ...context, requestId }),
    info: (message: string, context?: Record<string, any>) => 
      logger.info(message, { ...context, requestId }),
    warn: (message: string, context?: Record<string, any>) => 
      logger.warn(message, { ...context, requestId }),
    error: (message: string, context?: Record<string, any>) => 
      logger.error(message, { ...context, requestId })
  };
}

export function createUserLogger(userId: string) {
  return {
    debug: (message: string, context?: Record<string, any>) => 
      logger.debug(message, { ...context, userId }),
    info: (message: string, context?: Record<string, any>) => 
      logger.info(message, { ...context, userId }),
    warn: (message: string, context?: Record<string, any>) => 
      logger.warn(message, { ...context, userId }),
    error: (message: string, context?: Record<string, any>) => 
      logger.error(message, { ...context, userId })
  };
}

