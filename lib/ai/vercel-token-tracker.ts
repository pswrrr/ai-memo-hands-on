/**
 * Vercel 배포 환경을 위한 토큰 추적 시스템
 * 환경별 차이점을 고려한 안정적인 토큰 사용량 기록
 */

import { db } from '@/lib/db';
import { tokenUsage } from '@/lib/db/schema';
import { aiLogger } from '@/lib/utils/logger';

export interface VercelTokenUsageRecord {
  userId: string;
  noteId?: string;
  model: string;
  operation: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
}

export class VercelTokenTrackerService {
  // Gemini API 토큰 비용 (USD per 1M tokens)
  private readonly TOKEN_COSTS = {
    'gemini-2.0-flash-exp': {
      input: 0.075, // $0.075 per 1M input tokens
      output: 0.30   // $0.30 per 1M output tokens
    }
  };

  /**
   * Vercel 환경에서 토큰 사용량 기록 (강화된 에러 처리)
   */
  async recordTokenUsage(record: VercelTokenUsageRecord): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // 환경 변수 확인
      if (!process.env.DATABASE_URL) {
        console.warn('⚠️ Vercel: DATABASE_URL이 설정되지 않았습니다.');
        return false;
      }

      // 비용 계산
      const cost = this.calculateCost(record.model, record.inputTokens, record.outputTokens);
      
      // 데이터베이스 연결 테스트
      await this.testDatabaseConnection();
      
      // 토큰 사용량 기록
      const insertResult = await db.insert(tokenUsage).values({
        userId: record.userId,
        noteId: record.noteId,
        model: record.model,
        operation: record.operation,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        totalTokens: record.totalTokens,
        cost: cost.toString(),
        processingTime: record.processingTime,
        success: record.success,
        errorMessage: record.errorMessage
      }).returning({ id: tokenUsage.id });

      const recordId = insertResult[0]?.id;
      
      if (!recordId) {
        throw new Error('토큰 사용량 기록 삽입 실패');
      }

      // 성공 로깅
      console.log(`✅ Vercel: 토큰 사용량 기록 성공 (${Date.now() - startTime}ms)`, {
        recordId,
        userId: record.userId,
        operation: record.operation,
        totalTokens: record.totalTokens,
        cost: cost
      });

      // 로깅 (에러가 발생해도 메인 기능에 영향 없음)
      try {
        await aiLogger.tokenUsage({
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          totalTokens: record.totalTokens,
          cost,
          operation: record.operation
        }, { userId: record.userId, noteId: record.noteId });
      } catch (logError) {
        console.warn('⚠️ Vercel: 로깅 실패 (메인 기능에 영향 없음):', logError);
      }

      return true;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ Vercel: 토큰 사용량 기록 실패:', {
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        stack: error instanceof Error ? error.stack : undefined,
        record: {
          userId: record.userId,
          operation: record.operation,
          totalTokens: record.totalTokens
        },
        processingTime,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          VERCEL_ENV: process.env.VERCEL_ENV,
          DATABASE_URL_SET: !!process.env.DATABASE_URL
        }
      });

      // Vercel 환경에서의 특별한 에러 처리
      if (this.isVercelEnvironment()) {
        console.log('🔄 Vercel: 재시도 로직 실행...');
        return await this.retryTokenUsageRecord(record);
      }

      return false;
    }
  }

  /**
   * 데이터베이스 연결 테스트
   */
  private async testDatabaseConnection(): Promise<void> {
    try {
      await db.execute('SELECT 1');
    } catch (error) {
      throw new Error(`데이터베이스 연결 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 재시도 로직 (Vercel 환경 전용)
   */
  private async retryTokenUsageRecord(record: VercelTokenUsageRecord): Promise<boolean> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1초

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Vercel: 재시도 ${attempt}/${maxRetries}...`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        
        const cost = this.calculateCost(record.model, record.inputTokens, record.outputTokens);
        
        await db.insert(tokenUsage).values({
          userId: record.userId,
          noteId: record.noteId,
          model: record.model,
          operation: record.operation,
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          totalTokens: record.totalTokens,
          cost: cost.toString(),
          processingTime: record.processingTime,
          success: record.success,
          errorMessage: record.errorMessage
        });

        console.log(`✅ Vercel: 재시도 성공 (${attempt}번째 시도)`);
        return true;
        
      } catch (retryError) {
        console.error(`❌ Vercel: 재시도 ${attempt} 실패:`, retryError);
        
        if (attempt === maxRetries) {
          console.error('❌ Vercel: 모든 재시도 실패');
          return false;
        }
      }
    }

    return false;
  }

  /**
   * 비용 계산
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = this.TOKEN_COSTS[model as keyof typeof this.TOKEN_COSTS];
    if (!costs) {
      console.warn(`⚠️ Vercel: 알 수 없는 모델: ${model}`);
      return 0;
    }

    const inputCost = (inputTokens / 1000000) * costs.input;
    const outputCost = (outputTokens / 1000000) * costs.output;
    
    return Math.round((inputCost + outputCost) * 1000000) / 1000000; // 소수점 6자리까지
  }

  /**
   * Vercel 환경 확인
   */
  private isVercelEnvironment(): boolean {
    return !!(process.env.VERCEL || process.env.VERCEL_ENV);
  }

  /**
   * Vercel 환경 진단
   */
  async diagnoseVercelEnvironment(): Promise<void> {
    console.log('🔍 Vercel 환경 진단:');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`VERCEL: ${process.env.VERCEL}`);
    console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV}`);
    console.log(`VERCEL_REGION: ${process.env.VERCEL_REGION}`);
    console.log(`DATABASE_URL 설정: ${!!process.env.DATABASE_URL}`);
    console.log(`GEMINI_API_KEY 설정: ${!!process.env.GEMINI_API_KEY}`);
    
    try {
      await this.testDatabaseConnection();
      console.log('✅ 데이터베이스 연결 정상');
    } catch (error) {
      console.error('❌ 데이터베이스 연결 실패:', error);
    }
  }
}

// 싱글톤 인스턴스
export const vercelTokenTracker = new VercelTokenTrackerService();
