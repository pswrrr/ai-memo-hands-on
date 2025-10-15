-- ============================================
-- AI 요약 노트 생성을 위한 목업 SQL 쿼리 모음
-- ============================================
-- 작성일: 2025-10-15
-- 설명: AI 요약 기능을 테스트하고 개발하기 위한 다양한 쿼리 모음

-- ============================================
-- 1. 요약이 없는 노트 조회 (요약 생성 대상)
-- ============================================
-- 용도: AI 요약을 생성해야 할 노트 찾기
-- 시나리오: 사용자가 "요약 생성" 버튼을 클릭할 수 있는 노트 목록 표시

SELECT 
  n.id,
  n.title,
  n.content,
  n.created_at,
  n.updated_at,
  LENGTH(n.content) as content_length,
  (SELECT COUNT(*) FROM note_tags WHERE note_id = n.id) as tag_count
FROM notes n
LEFT JOIN summaries s ON n.id = s.note_id
WHERE n.deleted_at IS NULL  -- 삭제되지 않은 노트만
  AND s.id IS NULL  -- 요약이 없는 노트만
ORDER BY n.updated_at DESC;


-- ============================================
-- 2. 최근 수정된 노트 중 요약이 오래된 노트 조회
-- ============================================
-- 용도: 노트 내용이 변경되어 요약을 다시 생성해야 하는 노트 찾기
-- 시나리오: 자동 재요약 제안 기능

SELECT 
  n.id,
  n.title,
  n.updated_at as note_updated_at,
  s.created_at as summary_created_at,
  EXTRACT(EPOCH FROM (n.updated_at - s.created_at)) / 3600 as hours_since_summary,
  s.model as last_used_model
FROM notes n
INNER JOIN summaries s ON n.id = s.note_id
WHERE n.deleted_at IS NULL
  AND n.updated_at > s.created_at  -- 노트가 요약 이후 수정됨
  AND n.updated_at > NOW() - INTERVAL '7 days'  -- 최근 7일 이내 수정
ORDER BY n.updated_at DESC;


-- ============================================
-- 3. 특정 사용자의 모든 노트 및 요약 상태 조회
-- ============================================
-- 용도: 대시보드에서 사용자의 전체 노트 요약 현황 표시
-- 시나리오: 통계 페이지, 대시보드 위젯

SELECT 
  n.id,
  n.title,
  n.created_at,
  n.updated_at,
  CASE 
    WHEN s.id IS NOT NULL THEN '요약 있음'
    ELSE '요약 없음'
  END as summary_status,
  s.model,
  LENGTH(n.content) as original_length,
  LENGTH(s.content) as summary_length,
  ROUND(LENGTH(s.content)::numeric / NULLIF(LENGTH(n.content), 0) * 100, 2) as compression_ratio,
  array_agg(DISTINCT nt.tag ORDER BY nt.tag) FILTER (WHERE nt.tag IS NOT NULL) as tags
FROM notes n
LEFT JOIN summaries s ON n.id = s.note_id
LEFT JOIN note_tags nt ON n.id = nt.note_id
WHERE n.user_id = '6ec8af02-cca1-479e-9efb-0432af7c2b56'  -- 실제 사용자 ID로 교체
  AND n.deleted_at IS NULL
GROUP BY n.id, n.title, n.created_at, n.updated_at, n.content, s.id, s.model, s.content
ORDER BY n.updated_at DESC;


-- ============================================
-- 4. 긴 콘텐츠를 가진 노트 중 요약이 없는 노트 조회
-- ============================================
-- 용도: 요약이 특히 유용할 것으로 예상되는 긴 노트 우선 처리
-- 시나리오: "긴 노트 요약 제안" 알림 기능

SELECT 
  n.id,
  n.title,
  LENGTH(n.content) as content_length,
  LENGTH(n.content) / 500 as estimated_read_minutes,  -- 분당 500자 가정
  n.created_at
FROM notes n
LEFT JOIN summaries s ON n.id = s.note_id
WHERE n.deleted_at IS NULL
  AND s.id IS NULL
  AND LENGTH(n.content) > 1000  -- 1000자 이상인 노트
ORDER BY LENGTH(n.content) DESC;


-- ============================================
-- 5. AI 모델별 요약 통계 조회
-- ============================================
-- 용도: 어떤 AI 모델이 가장 많이 사용되었는지 분석
-- 시나리오: 관리자 대시보드, 비용 분석

SELECT 
  s.model,
  COUNT(*) as summary_count,
  AVG(LENGTH(s.content)) as avg_summary_length,
  MIN(s.created_at) as first_used,
  MAX(s.created_at) as last_used
FROM summaries s
INNER JOIN notes n ON s.note_id = n.id
WHERE n.deleted_at IS NULL
GROUP BY s.model
ORDER BY summary_count DESC;


-- ============================================
-- 6. 특정 태그를 가진 노트들의 요약 조회
-- ============================================
-- 용도: 특정 주제의 노트 요약들을 한번에 보기
-- 시나리오: 태그별 필터링 기능

SELECT 
  n.id,
  n.title,
  s.content as summary,
  s.model,
  array_agg(DISTINCT nt.tag ORDER BY nt.tag) as tags
FROM notes n
INNER JOIN note_tags nt ON n.id = nt.note_id
LEFT JOIN summaries s ON n.id = s.note_id
WHERE n.deleted_at IS NULL
  AND nt.tag IN ('학습', '업무')  -- 원하는 태그로 필터링
GROUP BY n.id, n.title, s.content, s.model
HAVING COUNT(DISTINCT nt.tag) > 0
ORDER BY n.updated_at DESC;


-- ============================================
-- 7. 최근 7일간 생성된 요약 조회
-- ============================================
-- 용도: 최근 AI 요약 활동 모니터링
-- 시나리오: 최근 활동 피드, 알림 센터

SELECT 
  n.id,
  n.title,
  s.content as summary,
  s.model,
  s.created_at as summarized_at,
  DATE_PART('day', NOW() - s.created_at) as days_ago
FROM summaries s
INNER JOIN notes n ON s.note_id = n.id
WHERE n.deleted_at IS NULL
  AND s.created_at > NOW() - INTERVAL '7 days'
ORDER BY s.created_at DESC;


-- ============================================
-- 8. 요약 재생성이 필요한 노트 조회 (다중 조건)
-- ============================================
-- 용도: 복합적인 조건으로 재요약 대상 식별
-- 시나리오: 자동 요약 업데이트 배치 작업

SELECT 
  n.id,
  n.title,
  n.updated_at as note_updated,
  s.created_at as summary_created,
  s.model as current_model,
  LENGTH(n.content) as current_content_length,
  CASE
    WHEN n.updated_at > s.created_at THEN '콘텐츠 변경됨'
    WHEN s.model = 'gemini-1.5-flash' THEN '모델 업그레이드 가능'
    WHEN s.created_at < NOW() - INTERVAL '30 days' THEN '요약이 오래됨'
    ELSE '재생성 불필요'
  END as regeneration_reason
FROM notes n
INNER JOIN summaries s ON n.id = s.note_id
WHERE n.deleted_at IS NULL
  AND (
    n.updated_at > s.created_at  -- 노트가 수정됨
    OR s.created_at < NOW() - INTERVAL '30 days'  -- 요약이 오래됨
  )
ORDER BY n.updated_at DESC;


-- ============================================
-- 9. 사용자별 요약 생성 통계 조회
-- ============================================
-- 용도: 사용자가 AI 요약 기능을 얼마나 활용하는지 분석
-- 시나리오: 사용자 프로필, 통계 페이지

SELECT 
  n.user_id,
  COUNT(DISTINCT n.id) as total_notes,
  COUNT(DISTINCT s.id) as summarized_notes,
  ROUND(COUNT(DISTINCT s.id)::numeric / NULLIF(COUNT(DISTINCT n.id), 0) * 100, 2) as summarization_rate,
  AVG(LENGTH(n.content)) as avg_note_length,
  AVG(LENGTH(s.content)) as avg_summary_length
FROM notes n
LEFT JOIN summaries s ON n.id = s.note_id
WHERE n.deleted_at IS NULL
GROUP BY n.user_id;


-- ============================================
-- 10. 노트 상세 페이지용 전체 정보 조회
-- ============================================
-- 용도: 노트 상세 페이지에 모든 정보 표시
-- 시나리오: 노트 편집/보기 페이지

SELECT 
  n.id,
  n.user_id,
  n.title,
  n.content,
  n.created_at,
  n.updated_at,
  s.id as summary_id,
  s.content as summary,
  s.model as summary_model,
  s.created_at as summary_created_at,
  array_agg(DISTINCT nt.tag ORDER BY nt.tag) FILTER (WHERE nt.tag IS NOT NULL) as tags,
  LENGTH(n.content) as content_length,
  LENGTH(n.content) - LENGTH(REPLACE(n.content, ' ', '')) as word_count_estimate
FROM notes n
LEFT JOIN summaries s ON n.id = s.note_id
LEFT JOIN note_tags nt ON n.id = nt.note_id
WHERE n.id = 'YOUR_NOTE_ID_HERE'  -- 실제 노트 ID로 교체
  AND n.deleted_at IS NULL
GROUP BY n.id, n.user_id, n.title, n.content, n.created_at, n.updated_at, 
         s.id, s.content, s.model, s.created_at;


-- ============================================
-- 11. 검색어로 노트 및 요약 검색 (Full-Text Search)
-- ============================================
-- 용도: 노트 내용이나 요약에서 특정 키워드 검색
-- 시나리오: 검색 기능, 전체 텍스트 검색

SELECT 
  n.id,
  n.title,
  n.content,
  s.content as summary,
  n.created_at,
  ts_rank(
    to_tsvector('simple', COALESCE(n.title, '') || ' ' || COALESCE(n.content, '') || ' ' || COALESCE(s.content, '')),
    plainto_tsquery('simple', 'React 검색어')  -- 실제 검색어로 교체
  ) as relevance_score
FROM notes n
LEFT JOIN summaries s ON n.id = s.note_id
WHERE n.deleted_at IS NULL
  AND (
    n.title ILIKE '%React%'  -- 실제 검색어로 교체
    OR n.content ILIKE '%React%'
    OR s.content ILIKE '%React%'
  )
ORDER BY relevance_score DESC;


-- ============================================
-- 12. 요약 압축률 분석 (높은 압축률 순)
-- ============================================
-- 용도: AI 요약이 원본 대비 얼마나 효과적으로 압축했는지 분석
-- 시나리오: AI 성능 모니터링, 품질 관리

SELECT 
  n.id,
  n.title,
  LENGTH(n.content) as original_length,
  LENGTH(s.content) as summary_length,
  ROUND(LENGTH(s.content)::numeric / NULLIF(LENGTH(n.content), 0) * 100, 2) as compression_ratio,
  s.model,
  s.created_at
FROM notes n
INNER JOIN summaries s ON n.id = s.note_id
WHERE n.deleted_at IS NULL
  AND LENGTH(n.content) > 100  -- 너무 짧은 노트 제외
ORDER BY compression_ratio ASC  -- 압축률이 높은 순 (낮은 비율)
LIMIT 20;


-- ============================================
-- 13. 월별 요약 생성 추이 분석
-- ============================================
-- 용도: 시간에 따른 AI 요약 사용 패턴 분석
-- 시나리오: 분석 대시보드, 트렌드 차트

SELECT 
  DATE_TRUNC('month', s.created_at) as month,
  COUNT(*) as summaries_generated,
  COUNT(DISTINCT n.user_id) as active_users,
  AVG(LENGTH(n.content)) as avg_note_length,
  AVG(LENGTH(s.content)) as avg_summary_length
FROM summaries s
INNER JOIN notes n ON s.note_id = n.id
WHERE n.deleted_at IS NULL
GROUP BY DATE_TRUNC('month', s.created_at)
ORDER BY month DESC;


-- ============================================
-- 14. 특정 노트의 요약 히스토리 조회 (재생성 이력)
-- ============================================
-- 용도: 한 노트에 대해 여러 번 요약을 생성한 경우 이력 조회
-- 시나리오: 요약 버전 관리, 비교 기능
-- 참고: 현재 스키마는 1:1 관계이므로, 이 쿼리는 히스토리 테이블이 추가될 경우를 대비한 예시

-- 현재 스키마에서는 최신 요약만 저장되지만, 
-- 향후 summary_history 테이블을 추가할 경우를 대비한 쿼리 구조:
/*
SELECT 
  sh.id,
  sh.note_id,
  n.title,
  sh.content as summary,
  sh.model,
  sh.created_at,
  ROW_NUMBER() OVER (PARTITION BY sh.note_id ORDER BY sh.created_at DESC) as version
FROM summary_history sh
INNER JOIN notes n ON sh.note_id = n.id
WHERE sh.note_id = 'YOUR_NOTE_ID_HERE'
ORDER BY sh.created_at DESC;
*/

-- 현재 스키마에서는 단순히 최신 요약만 조회:
SELECT 
  s.id,
  s.note_id,
  n.title,
  s.content as summary,
  s.model,
  s.created_at as generated_at
FROM summaries s
INNER JOIN notes n ON s.note_id = n.id
WHERE s.note_id = 'YOUR_NOTE_ID_HERE'
  AND n.deleted_at IS NULL;


-- ============================================
-- 15. 요약이 있는 노트와 없는 노트의 비율 조회
-- ============================================
-- 용도: 전체 시스템의 요약 커버리지 파악
-- 시나리오: 운영 대시보드, KPI 모니터링

WITH summary_stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE s.id IS NOT NULL) as notes_with_summary,
    COUNT(*) FILTER (WHERE s.id IS NULL) as notes_without_summary,
    COUNT(*) as total_notes
  FROM notes n
  LEFT JOIN summaries s ON n.id = s.note_id
  WHERE n.deleted_at IS NULL
)
SELECT 
  notes_with_summary,
  notes_without_summary,
  total_notes,
  ROUND(notes_with_summary::numeric / NULLIF(total_notes, 0) * 100, 2) as coverage_percentage,
  CASE 
    WHEN notes_with_summary::numeric / NULLIF(total_notes, 0) > 0.7 THEN '우수'
    WHEN notes_with_summary::numeric / NULLIF(total_notes, 0) > 0.5 THEN '양호'
    WHEN notes_with_summary::numeric / NULLIF(total_notes, 0) > 0.3 THEN '보통'
    ELSE '개선 필요'
  END as coverage_status
FROM summary_stats;


-- ============================================
-- 보너스: 실전 활용 예시
-- ============================================

-- 16. 대시보드 위젯용 종합 통계
SELECT 
  (SELECT COUNT(*) FROM notes WHERE deleted_at IS NULL) as total_active_notes,
  (SELECT COUNT(*) FROM summaries s INNER JOIN notes n ON s.note_id = n.id WHERE n.deleted_at IS NULL) as total_summaries,
  (SELECT COUNT(DISTINCT tag) FROM note_tags nt INNER JOIN notes n ON nt.note_id = n.id WHERE n.deleted_at IS NULL) as unique_tags,
  (SELECT AVG(LENGTH(content)) FROM notes WHERE deleted_at IS NULL) as avg_note_length;

-- 17. 최근 활동 피드 (노트 생성 및 요약 생성)
SELECT 
  'note_created' as activity_type,
  n.id,
  n.title,
  n.created_at as activity_time
FROM notes n
WHERE n.deleted_at IS NULL
  AND n.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'summary_created' as activity_type,
  n.id,
  n.title,
  s.created_at as activity_time
FROM summaries s
INNER JOIN notes n ON s.note_id = n.id
WHERE n.deleted_at IS NULL
  AND s.created_at > NOW() - INTERVAL '7 days'

ORDER BY activity_time DESC
LIMIT 20;

