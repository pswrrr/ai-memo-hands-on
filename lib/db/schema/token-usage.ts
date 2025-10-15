/**
 * 토큰 사용량 관련 데이터베이스 스키마
 */

import { pgTable, text, integer, timestamp, decimal, boolean, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 토큰 사용량 기록 테이블
export const tokenUsage = pgTable('token_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  noteId: uuid('note_id'),
  model: text('model').notNull().default('gemini-2.0-flash-exp'),
  operation: text('operation').notNull(), // 'summary_generation', 'tag_generation'
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),
  cost: decimal('cost', { precision: 10, scale: 6 }), // 비용 (USD)
  processingTime: integer('processing_time'), // 처리 시간 (ms)
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// 사용량 임계값 설정 테이블
export const usageThresholds = pgTable('usage_thresholds', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  dailyLimit: integer('daily_limit').notNull().default(100000), // 일일 토큰 제한
  monthlyLimit: integer('monthly_limit').notNull().default(1000000), // 월간 토큰 제한
  alertEnabled: boolean('alert_enabled').notNull().default(true),
  alertThreshold: integer('alert_threshold').notNull().default(80), // 알림 임계값 (%)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// 사용량 알림 기록 테이블
export const usageAlerts = pgTable('usage_alerts', {
  id: uuid('id').primaryKey().primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  thresholdType: text('threshold_type').notNull(), // 'daily', 'monthly'
  thresholdValue: integer('threshold_value').notNull(),
  currentUsage: integer('current_usage').notNull(),
  alertSentAt: timestamp('alert_sent_at').notNull().defaultNow(),
  status: text('status').notNull().default('sent'), // 'sent', 'read', 'dismissed'
  message: text('message'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// 토큰 사용량 통계 테이블 (캐시용)
export const tokenUsageStats = pgTable('token_usage_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'),
  period: text('period').notNull(), // 'daily', 'weekly', 'monthly'
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  totalTokens: integer('total_tokens').notNull().default(0),
  totalCost: decimal('total_cost', { precision: 10, scale: 6 }).default('0'),
  requestCount: integer('request_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  avgProcessingTime: integer('avg_processing_time').default(0),
  lastUpdated: timestamp('last_updated').notNull().defaultNow()
});

// 관계 정의
export const tokenUsageRelations = relations(tokenUsage, ({ one }) => ({
  // 필요시 다른 테이블과의 관계 정의
}));

export const usageThresholdsRelations = relations(usageThresholds, ({ one }) => ({
  // 필요시 다른 테이블과의 관계 정의
}));

export const usageAlertsRelations = relations(usageAlerts, ({ one }) => ({
  // 필요시 다른 테이블과의 관계 정의
}));

export const tokenUsageStatsRelations = relations(tokenUsageStats, ({ one }) => ({
  // 필요시 다른 테이블과의 관계 정의
}));

// 인덱스 정의 (성능 최적화)
export const tokenUsageIndexes = {
  userId: 'idx_token_usage_user_id',
  createdAt: 'idx_token_usage_created_at',
  userIdCreatedAt: 'idx_token_usage_user_created'
};

export const usageThresholdsIndexes = {
  userId: 'idx_usage_thresholds_user_id'
};

export const usageAlertsIndexes = {
  userId: 'idx_usage_alerts_user_id',
  alertSentAt: 'idx_usage_alerts_sent_at'
};

export const tokenUsageStatsIndexes = {
  userId: 'idx_token_usage_stats_user_id',
  period: 'idx_token_usage_stats_period',
  periodStart: 'idx_token_usage_stats_period_start'
};

