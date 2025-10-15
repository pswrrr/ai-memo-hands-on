-- ============================================
-- 토큰 사용량 추적 테이블 생성 마이그레이션
-- ============================================
-- 작성일: 2025-10-15
-- 설명: AI 토큰 사용량 모니터링을 위한 테이블 생성

-- 1. 토큰 사용량 기록 테이블
CREATE TABLE IF NOT EXISTS token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  note_id UUID,
  model TEXT NOT NULL DEFAULT 'gemini-2.0-flash-exp',
  operation TEXT NOT NULL, -- 'summary_generation', 'tag_generation'
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  cost DECIMAL(10, 6), -- 비용 (USD)
  processing_time INTEGER, -- 처리 시간 (ms)
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. 사용량 임계값 설정 테이블
CREATE TABLE IF NOT EXISTS usage_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  daily_limit INTEGER NOT NULL DEFAULT 100000,
  monthly_limit INTEGER NOT NULL DEFAULT 1000000,
  alert_enabled BOOLEAN NOT NULL DEFAULT true,
  alert_threshold INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. 사용량 알림 기록 테이블
CREATE TABLE IF NOT EXISTS usage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  threshold_type TEXT NOT NULL, -- 'daily', 'monthly'
  threshold_value INTEGER NOT NULL,
  current_usage INTEGER NOT NULL,
  alert_sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'read', 'dismissed'
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. 토큰 사용량 통계 테이블 (캐시용)
CREATE TABLE IF NOT EXISTS token_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 6) DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  avg_processing_time INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period, period_start)
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_user_created ON token_usage(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_thresholds_user_id ON usage_thresholds(user_id);

CREATE INDEX IF NOT EXISTS idx_usage_alerts_user_id ON usage_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_sent_at ON usage_alerts(alert_sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_token_usage_stats_user_id ON token_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_stats_period ON token_usage_stats(period);
CREATE INDEX IF NOT EXISTS idx_token_usage_stats_period_start ON token_usage_stats(period_start DESC);

-- 6. 확인 쿼리
SELECT 
  schemaname, 
  tablename, 
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('token_usage', 'usage_thresholds', 'usage_alerts', 'token_usage_stats')
ORDER BY tablename;

