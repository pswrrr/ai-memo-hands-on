/**
 * 토큰 사용량 추적 서비스
 */

import { db } from '../db';
import { tokenUsage, usageThresholds, usageAlerts, tokenUsageStats } from '../db/schema/token-usage';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { aiLogger } from '../utils/logger';

// 토큰 사용량 기록 인터페이스
export interface TokenUsageRecord {
  userId: string;
  noteId?: string;
  model: string;
  operation: 'summary_generation' | 'tag_generation';
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost?: number;
  processingTime?: number;
  success: boolean;
  errorMessage?: string;
}

// 사용량 통계 인터페이스
export interface UsageStats {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgProcessingTime: number;
  period: {
    start: Date;
    end: Date;
  };
}

// 임계값 설정 인터페이스
export interface ThresholdConfig {
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  alertEnabled: boolean;
  alertThreshold: number; // 퍼센트
}

// 알림 정보 인터페이스
export interface AlertInfo {
  thresholdType: 'daily' | 'monthly';
  thresholdValue: number;
  currentUsage: number;
  percentage: number;
  message: string;
}

export class TokenTrackerService {
  // Gemini API 토큰 비용 (USD per 1M tokens)
  private readonly TOKEN_COSTS = {
    'gemini-2.0-flash-exp': {
      input: 0.075, // $0.075 per 1M input tokens
      output: 0.30   // $0.30 per 1M output tokens
    }
  };

  /**
   * 토큰 사용량 기록 (Vercel 환경 대응)
   */
  async recordTokenUsage(record: TokenUsageRecord): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 환경 변수 확인
      if (!process.env.DATABASE_URL) {
        console.warn('⚠️ DATABASE_URL이 설정되지 않았습니다.');
        return;
      }

      const cost = this.calculateCost(record.model, record.inputTokens, record.outputTokens);
      
      // 데이터베이스 연결 테스트
      await this.testDatabaseConnection();
      
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
      console.log(`✅ 토큰 사용량 기록 성공 (${Date.now() - startTime}ms)`, {
        recordId,
        userId: record.userId,
        operation: record.operation,
        totalTokens: record.totalTokens,
        cost: cost,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          VERCEL_ENV: process.env.VERCEL_ENV
        }
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
        console.warn('⚠️ 로깅 실패 (메인 기능에 영향 없음):', logError);
      }

      // 임계값 확인 및 알림 (에러가 발생해도 메인 기능에 영향 없음)
      try {
        await this.checkThresholdsAndAlert(record.userId);
      } catch (alertError) {
        console.warn('⚠️ 알림 확인 실패 (메인 기능에 영향 없음):', alertError);
      }
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      console.error('❌ 토큰 사용량 기록 실패:', {
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

      // Vercel 환경에서의 재시도 로직
      if (this.isVercelEnvironment()) {
        console.log('🔄 Vercel 환경에서 재시도 로직 실행...');
        await this.retryTokenUsageRecord(record);
      }
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
   * Vercel 환경 확인
   */
  private isVercelEnvironment(): boolean {
    return !!(process.env.VERCEL || process.env.VERCEL_ENV);
  }

  /**
   * 재시도 로직 (Vercel 환경 전용)
   */
  private async retryTokenUsageRecord(record: TokenUsageRecord): Promise<void> {
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
        return;
        
      } catch (retryError) {
        console.error(`❌ Vercel: 재시도 ${attempt} 실패:`, retryError);
        
        if (attempt === maxRetries) {
          console.error('❌ Vercel: 모든 재시도 실패');
          return;
        }
      }
    }
  }

  /**
   * 비용 계산
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = this.TOKEN_COSTS[model as keyof typeof this.TOKEN_COSTS];
    if (!costs) return 0;

    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;
    
    return inputCost + outputCost;
  }

  /**
   * 사용자별 일일 사용량 조회
   */
  async getUserDailyUsage(userId: string, date: Date): Promise<UsageStats> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await db
      .select({
        totalTokens: sql<number>`sum(${tokenUsage.totalTokens})`,
        totalCost: sql<number>`sum(${tokenUsage.cost})`,
        requestCount: sql<number>`count(*)`,
        successCount: sql<number>`sum(case when ${tokenUsage.success} then 1 else 0 end)`,
        errorCount: sql<number>`sum(case when not ${tokenUsage.success} then 1 else 0 end)`,
        avgProcessingTime: sql<number>`avg(${tokenUsage.processingTime})`
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, userId),
          gte(tokenUsage.createdAt, startOfDay),
          lte(tokenUsage.createdAt, endOfDay)
        )
      );

    const stats = result[0] || {
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      avgProcessingTime: 0
    };

    return {
      totalTokens: stats.totalTokens || 0,
      totalCost: stats.totalCost || 0,
      requestCount: stats.requestCount || 0,
      successCount: stats.successCount || 0,
      errorCount: stats.errorCount || 0,
      avgProcessingTime: stats.avgProcessingTime || 0,
      period: {
        start: startOfDay,
        end: endOfDay
      }
    };
  }

  /**
   * 사용자별 월간 사용량 조회
   */
  async getUserMonthlyUsage(userId: string, year: number, month: number): Promise<UsageStats> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const result = await db
      .select({
        totalTokens: sql<number>`sum(${tokenUsage.totalTokens})`,
        totalCost: sql<number>`sum(${tokenUsage.cost})`,
        requestCount: sql<number>`count(*)`,
        successCount: sql<number>`sum(case when ${tokenUsage.success} then 1 else 0 end)`,
        errorCount: sql<number>`sum(case when not ${tokenUsage.success} then 1 else 0 end)`,
        avgProcessingTime: sql<number>`avg(${tokenUsage.processingTime})`
      })
      .from(tokenUsage)
      .where(
        and(
          eq(tokenUsage.userId, userId),
          gte(tokenUsage.createdAt, startOfMonth),
          lte(tokenUsage.createdAt, endOfMonth)
        )
      );

    const stats = result[0] || {
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      avgProcessingTime: 0
    };

    return {
      totalTokens: stats.totalTokens || 0,
      totalCost: stats.totalCost || 0,
      requestCount: stats.requestCount || 0,
      successCount: stats.successCount || 0,
      errorCount: stats.errorCount || 0,
      avgProcessingTime: stats.avgProcessingTime || 0,
      period: {
        start: startOfMonth,
        end: endOfMonth
      }
    };
  }

  /**
   * 전체 시스템 사용량 조회
   */
  async getSystemUsage(period: 'daily' | 'weekly' | 'monthly', date: Date): Promise<UsageStats> {
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = date.getDay();
        startDate = new Date(date);
        startDate.setDate(date.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        startDate = new Date(date.getFullYear(), date.getMonth(), 1);
        endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    const result = await db
      .select({
        totalTokens: sql<number>`sum(${tokenUsage.totalTokens})`,
        totalCost: sql<number>`sum(${tokenUsage.cost})`,
        requestCount: sql<number>`count(*)`,
        successCount: sql<number>`sum(case when ${tokenUsage.success} then 1 else 0 end)`,
        errorCount: sql<number>`sum(case when not ${tokenUsage.success} then 1 else 0 end)`,
        avgProcessingTime: sql<number>`avg(${tokenUsage.processingTime})`
      })
      .from(tokenUsage)
      .where(
        and(
          gte(tokenUsage.createdAt, startDate),
          lte(tokenUsage.createdAt, endDate)
        )
      );

    const stats = result[0] || {
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      avgProcessingTime: 0
    };

    return {
      totalTokens: stats.totalTokens || 0,
      totalCost: stats.totalCost || 0,
      requestCount: stats.requestCount || 0,
      successCount: stats.successCount || 0,
      errorCount: stats.errorCount || 0,
      avgProcessingTime: stats.avgProcessingTime || 0,
      period: {
        start: startDate,
        end: endDate
      }
    };
  }

  /**
   * 임계값 설정 조회
   */
  async getThresholdConfig(userId: string): Promise<ThresholdConfig | null> {
    const result = await db
      .select()
      .from(usageThresholds)
      .where(eq(usageThresholds.userId, userId))
      .limit(1);

    if (result.length === 0) return null;

    const config = result[0];
    return {
      userId: config.userId,
      dailyLimit: config.dailyLimit,
      monthlyLimit: config.monthlyLimit,
      alertEnabled: config.alertEnabled,
      alertThreshold: config.alertThreshold
    };
  }

  /**
   * 임계값 설정 저장
   */
  async setThresholdConfig(config: ThresholdConfig): Promise<void> {
    await db
      .insert(usageThresholds)
      .values({
        userId: config.userId,
        dailyLimit: config.dailyLimit,
        monthlyLimit: config.monthlyLimit,
        alertEnabled: config.alertEnabled,
        alertThreshold: config.alertThreshold
      })
      .onConflictDoUpdate({
        target: usageThresholds.userId,
        set: {
          dailyLimit: config.dailyLimit,
          monthlyLimit: config.monthlyLimit,
          alertEnabled: config.alertEnabled,
          alertThreshold: config.alertThreshold,
          updatedAt: new Date()
        }
      });
  }

  /**
   * 임계값 확인 및 알림
   */
  private async checkThresholdsAndAlert(userId: string): Promise<void> {
    const config = await this.getThresholdConfig(userId);
    if (!config || !config.alertEnabled) return;

    // 일일 사용량 확인
    const dailyUsage = await this.getUserDailyUsage(userId, new Date());
    const dailyPercentage = (dailyUsage.totalTokens / config.dailyLimit) * 100;

    if (dailyPercentage >= config.alertThreshold) {
      await this.sendAlert({
        userId,
        thresholdType: 'daily',
        thresholdValue: config.dailyLimit,
        currentUsage: dailyUsage.totalTokens,
        percentage: dailyPercentage,
        message: `일일 토큰 사용량이 ${dailyPercentage.toFixed(1)}%에 도달했습니다.`
      });
    }

    // 월간 사용량 확인
    const now = new Date();
    const monthlyUsage = await this.getUserMonthlyUsage(userId, now.getFullYear(), now.getMonth() + 1);
    const monthlyPercentage = (monthlyUsage.totalTokens / config.monthlyLimit) * 100;

    if (monthlyPercentage >= config.alertThreshold) {
      await this.sendAlert({
        userId,
        thresholdType: 'monthly',
        thresholdValue: config.monthlyLimit,
        currentUsage: monthlyUsage.totalTokens,
        percentage: monthlyPercentage,
        message: `월간 토큰 사용량이 ${monthlyPercentage.toFixed(1)}%에 도달했습니다.`
      });
    }
  }

  /**
   * 알림 발송
   */
  private async sendAlert(alertInfo: AlertInfo): Promise<void> {
    try {
      await db.insert(usageAlerts).values({
        userId: alertInfo.userId,
        thresholdType: alertInfo.thresholdType,
        thresholdValue: alertInfo.thresholdValue,
        currentUsage: alertInfo.currentUsage,
        message: alertInfo.message
      });

      // TODO: 실제 알림 발송 (이메일, 푸시 알림 등)
      console.log(`Alert sent to user ${alertInfo.userId}: ${alertInfo.message}`);
      
    } catch (error) {
      console.error('알림 발송 실패:', error);
    }
  }

  /**
   * 사용량 통계 캐시 업데이트
   */
  async updateUsageStatsCache(userId: string, period: 'daily' | 'weekly' | 'monthly'): Promise<void> {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;

    switch (period) {
      case 'daily':
        periodStart = new Date(now);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(now);
        periodEnd.setHours(23, 59, 59, 999);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - dayOfWeek);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        break;
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
    }

    const stats = await this.getSystemUsage(period, now);

    await db
      .insert(tokenUsageStats)
      .values({
        userId,
        period,
        periodStart,
        periodEnd,
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost.toString(),
        requestCount: stats.requestCount,
        successCount: stats.successCount,
        errorCount: stats.errorCount,
        avgProcessingTime: Math.round(stats.avgProcessingTime)
      })
      .onConflictDoUpdate({
        target: [tokenUsageStats.userId, tokenUsageStats.period, tokenUsageStats.periodStart],
        set: {
          totalTokens: stats.totalTokens,
          totalCost: stats.totalCost.toString(),
          requestCount: stats.requestCount,
          successCount: stats.successCount,
          errorCount: stats.errorCount,
          avgProcessingTime: Math.round(stats.avgProcessingTime),
          lastUpdated: new Date()
        }
      });
  }
}

// 전역 토큰 추적 서비스 인스턴스
export const tokenTracker = new TokenTrackerService();

