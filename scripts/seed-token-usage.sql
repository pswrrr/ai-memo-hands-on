-- ============================================
-- 토큰 사용량 테스트 데이터 생성
-- ============================================
-- 작성일: 2025-10-15
-- 설명: 관리자 대시보드 테스트를 위한 토큰 사용량 목업 데이터 생성

-- 사용자 ID 조회 (실제 사용자 ID로 대체)
DO $$
DECLARE
  v_user_ids TEXT[] := ARRAY(
    SELECT id::TEXT FROM auth.users LIMIT 5
  );
  v_user_id TEXT;
  v_note_id UUID;
  i INTEGER;
  j INTEGER;
  v_input_tokens INTEGER;
  v_output_tokens INTEGER;
  v_total_tokens INTEGER;
  v_cost DECIMAL;
  v_processing_time INTEGER;
  v_created_at TIMESTAMP;
BEGIN

-- 각 사용자에 대해 다양한 토큰 사용량 데이터 생성
FOREACH v_user_id IN ARRAY v_user_ids
LOOP
  -- 오늘 데이터 (10~15개)
  FOR i IN 1..15 LOOP
    v_input_tokens := 500 + floor(random() * 3000)::INTEGER;
    v_output_tokens := 100 + floor(random() * 800)::INTEGER;
    v_total_tokens := v_input_tokens + v_output_tokens;
    v_cost := (v_input_tokens / 1000000.0 * 0.075) + (v_output_tokens / 1000000.0 * 0.30);
    v_processing_time := 1000 + floor(random() * 4000)::INTEGER;
    v_created_at := NOW() - (random() * INTERVAL '24 hours');
    
    INSERT INTO token_usage (
      user_id,
      model,
      operation,
      input_tokens,
      output_tokens,
      total_tokens,
      cost,
      processing_time,
      success,
      created_at
    ) VALUES (
      v_user_id,
      'gemini-2.0-flash-exp',
      CASE WHEN random() < 0.7 THEN 'summary_generation' ELSE 'tag_generation' END,
      v_input_tokens,
      v_output_tokens,
      v_total_tokens,
      v_cost,
      v_processing_time,
      random() > 0.05, -- 95% 성공률
      v_created_at
    );
  END LOOP;
  
  -- 최근 7일 데이터 (각 사용자당 30~50개)
  FOR i IN 1..40 LOOP
    v_input_tokens := 400 + floor(random() * 2500)::INTEGER;
    v_output_tokens := 80 + floor(random() * 600)::INTEGER;
    v_total_tokens := v_input_tokens + v_output_tokens;
    v_cost := (v_input_tokens / 1000000.0 * 0.075) + (v_output_tokens / 1000000.0 * 0.30);
    v_processing_time := 800 + floor(random() * 3500)::INTEGER;
    v_created_at := NOW() - ((random() * 7 + 1) * INTERVAL '1 day');
    
    INSERT INTO token_usage (
      user_id,
      model,
      operation,
      input_tokens,
      output_tokens,
      total_tokens,
      cost,
      processing_time,
      success,
      created_at
    ) VALUES (
      v_user_id,
      'gemini-2.0-flash-exp',
      CASE WHEN random() < 0.6 THEN 'summary_generation' ELSE 'tag_generation' END,
      v_input_tokens,
      v_output_tokens,
      v_total_tokens,
      v_cost,
      v_processing_time,
      random() > 0.08, -- 92% 성공률
      v_created_at
    );
  END LOOP;
  
  -- 최근 30일 데이터 (각 사용자당 50~80개)
  FOR i IN 1..65 LOOP
    v_input_tokens := 300 + floor(random() * 2000)::INTEGER;
    v_output_tokens := 60 + floor(random() * 500)::INTEGER;
    v_total_tokens := v_input_tokens + v_output_tokens;
    v_cost := (v_input_tokens / 1000000.0 * 0.075) + (v_output_tokens / 1000000.0 * 0.30);
    v_processing_time := 700 + floor(random() * 3000)::INTEGER;
    v_created_at := NOW() - ((random() * 30 + 7) * INTERVAL '1 day');
    
    INSERT INTO token_usage (
      user_id,
      model,
      operation,
      input_tokens,
      output_tokens,
      total_tokens,
      cost,
      processing_time,
      success,
      created_at
    ) VALUES (
      v_user_id,
      'gemini-2.0-flash-exp',
      CASE WHEN random() < 0.65 THEN 'summary_generation' ELSE 'tag_generation' END,
      v_input_tokens,
      v_output_tokens,
      v_total_tokens,
      v_cost,
      v_processing_time,
      random() > 0.1, -- 90% 성공률
      v_created_at
    );
  END LOOP;
END LOOP;

RAISE NOTICE '✅ 토큰 사용량 테스트 데이터 생성 완료!';
RAISE NOTICE '생성된 사용자 수: %', array_length(v_user_ids, 1);
RAISE NOTICE '사용자당 레코드 수: 약 120개';
RAISE NOTICE '총 레코드 수: 약 % 개', array_length(v_user_ids, 1) * 120;

END $$;

-- 생성된 데이터 확인
SELECT 
  period_label,
  COUNT(*) as record_count,
  SUM(total_tokens) as total_tokens,
  ROUND(SUM(cost)::numeric, 4) as total_cost,
  COUNT(DISTINCT user_id) as unique_users
FROM (
  SELECT 
    *,
    CASE 
      WHEN created_at >= NOW() - INTERVAL '1 day' THEN '오늘'
      WHEN created_at >= NOW() - INTERVAL '7 days' THEN '최근 7일'
      WHEN created_at >= NOW() - INTERVAL '30 days' THEN '최근 30일'
      ELSE '30일 이전'
    END as period_label
  FROM token_usage
) subquery
GROUP BY period_label
ORDER BY 
  CASE period_label
    WHEN '오늘' THEN 1
    WHEN '최근 7일' THEN 2
    WHEN '최근 30일' THEN 3
    ELSE 4
  END;

-- 사용자별 통계
SELECT 
  user_id,
  COUNT(*) as request_count,
  SUM(total_tokens) as total_tokens,
  ROUND(SUM(cost)::numeric, 4) as total_cost,
  ROUND(AVG(processing_time)::numeric, 0) as avg_processing_time
FROM token_usage
WHERE created_at >= NOW() - INTERVAL '1 day'
GROUP BY user_id
ORDER BY total_tokens DESC
LIMIT 10;

