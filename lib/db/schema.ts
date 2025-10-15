import { pgTable, uuid, varchar, text, timestamp, pgEnum, integer, decimal, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const modelEnum = pgEnum('model', ['gemini-1.5-flash', 'gemini-1.5-pro']);

// Notes table
export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// Note tags table
export const noteTags = pgTable('note_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 100 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Summaries table
export const summaries = pgTable('summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  noteId: uuid('note_id').notNull().references(() => notes.id, { onDelete: 'cascade' }),
  model: modelEnum('model').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const notesRelations = relations(notes, ({ many }) => ({
  tags: many(noteTags),
  summaries: many(summaries),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, {
    fields: [noteTags.noteId],
    references: [notes.id],
  }),
}));

export const summariesRelations = relations(summaries, ({ one }) => ({
  note: one(notes, {
    fields: [summaries.noteId],
    references: [notes.id],
  }),
}));

// Token usage tables
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usageThresholds = pgTable('usage_thresholds', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  dailyLimit: integer('daily_limit').notNull().default(100000), // 일일 토큰 제한
  monthlyLimit: integer('monthly_limit').notNull().default(1000000), // 월간 토큰 제한
  alertEnabled: boolean('alert_enabled').notNull().default(true),
  alertThreshold: integer('alert_threshold').notNull().default(80), // 알림 임계값 (%)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usageAlerts = pgTable('usage_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  thresholdType: text('threshold_type').notNull(), // 'daily', 'monthly'
  thresholdValue: integer('threshold_value').notNull(),
  currentUsage: integer('current_usage').notNull(),
  alertSentAt: timestamp('alert_sent_at', { withTimezone: true }).defaultNow().notNull(),
  status: text('status').notNull().default('sent'), // 'sent', 'read', 'dismissed'
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tokenUsageStats = pgTable('token_usage_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id'),
  period: text('period').notNull(), // 'daily', 'weekly', 'monthly'
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
  totalTokens: integer('total_tokens').notNull().default(0),
  totalCost: decimal('total_cost', { precision: 10, scale: 6 }).default('0'),
  requestCount: integer('request_count').notNull().default(0),
  successCount: integer('success_count').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  avgProcessingTime: integer('avg_processing_time').default(0),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
});

// Types
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type NoteTag = typeof noteTags.$inferSelect;
export type NewNoteTag = typeof noteTags.$inferInsert;
export type Summary = typeof summaries.$inferSelect;
export type NewSummary = typeof summaries.$inferInsert;
export type TokenUsage = typeof tokenUsage.$inferSelect;
export type NewTokenUsage = typeof tokenUsage.$inferInsert;
export type UsageThreshold = typeof usageThresholds.$inferSelect;
export type NewUsageThreshold = typeof usageThresholds.$inferInsert;
export type UsageAlert = typeof usageAlerts.$inferSelect;
export type NewUsageAlert = typeof usageAlerts.$inferInsert;
export type TokenUsageStats = typeof tokenUsageStats.$inferSelect;
export type NewTokenUsageStats = typeof tokenUsageStats.$inferInsert;
