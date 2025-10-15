/**
 * ?�큰 ?�용??추적 ?�비??
 */

import { db } from '../db';
import { tokenUsage, usageThresholds, usageAlerts, tokenUsageStats } from '../db/schema/token-usage';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { aiLogger } from '../utils/logger';

// ?�큰 ?�용??기록 ?�터?�이??
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

// ?�용???�계 ?�터?�이??
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

// ?�계�??�정 ?�터?�이??
export interface ThresholdConfig {
  userId: string;
  dailyLimit: number;
  monthlyLimit: number;
  alertEnabled: boolean;
  alertThreshold: number; // ?�센??
}

// ?�림 ?�보 ?�터?�이??
export interface AlertInfo {
  thresholdType: 'daily' | 'monthly';
  thresholdValue: number;
  currentUsage: number;
  percentage: number;
  message: string;
}

export class TokenTrackerService {
  // Gemini API ?�큰 비용 (USD per 1M tokens)
  private readonly TOKEN_COSTS = {
    'gemini-2.0-flash-exp': {
      input: 0.075, // $0.075 per 1M input tokens
      output: 0.30   // $0.30 per 1M output tokens
    }
  };

  /**
   * ?�큰 ?�용??기록
   */
  async recordTokenUsage(record: TokenUsageRecord): Promise<void> {
    try {
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

      // 로깅
      await aiLogger.tokenUsage({
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        totalTokens: record.totalTokens,
        cost,
        operation: record.operation
      }, { userId: record.userId, noteId: record.noteId });

      // ?�계�??�인 �??�림
      await this.checkThresholdsAndAlert(record.userId);
      
    } catch (error) {
      console.error('?�큰 ?�용??기록 ?�패:', error);
      // ?�러가 발생?�도 메인 기능???�향??주�? ?�도�???
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
   * ?�용?�별 ?�일 ?�용??조회
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
   * ?�용?�별 ?�간 ?�용??조회
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
   * ?�체 ?�스???�용??조회
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
   * ?�계�??�정 조회
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
   * ?�계�??�정 ?�??
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
   * ?�계�??�인 �??�림
   */
  private async checkThresholdsAndAlert(userId: string): Promise<void> {
    const config = await this.getThresholdConfig(userId);
    if (!config || !config.alertEnabled) return;

    // ?�일 ?�용???�인
    const dailyUsage = await this.getUserDailyUsage(userId, new Date());
    const dailyPercentage = (dailyUsage.totalTokens / config.dailyLimit) * 100;

    if (dailyPercentage >= config.alertThreshold) {
      await this.sendAlert({
        userId,
        thresholdType: 'daily',
        thresholdValue: config.dailyLimit,
        currentUsage: dailyUsage.totalTokens,
        percentage: dailyPercentage,
        message: `?�일 ?�큰 ?�용?�이 ${dailyPercentage.toFixed(1)}%???�달?�습?�다.`
      });
    }

    // ?�간 ?�용???�인
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
        message: `?�간 ?�큰 ?�용?�이 ${monthlyPercentage.toFixed(1)}%???�달?�습?�다.`
      });
    }
  }

  /**
   * ?�림 발송
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

      // TODO: ?�제 ?�림 발송 (?�메?? ?�시 ?�림 ??
      
    } catch (error) {
      console.error('?�림 발송 ?�패:', error);
    }
  }

  /**
   * ?�용???�계 캐시 ?�데?�트
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

// ?�역 ?�큰 추적 ?�비???�스?�스
export const tokenTracker = new TokenTrackerService();


