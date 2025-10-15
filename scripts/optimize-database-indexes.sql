-- 데이터베이스 인덱스 최적화 스크립트
-- 노트 로딩 성능 향상을 위한 인덱스 생성

-- 1. 사용자별 노트 조회 최적화 인덱스
-- user_id와 deleted_at을 포함한 복합 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_deleted_created 
ON notes (user_id, deleted_at, created_at DESC);

-- 2. 사용자별 노트 조회 최적화 인덱스 (제목 정렬용)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_deleted_title 
ON notes (user_id, deleted_at, title);

-- 3. 삭제되지 않은 노트만 조회하는 인덱스
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_active_created 
ON notes (created_at DESC) 
WHERE deleted_at IS NULL;

-- 4. 사용자별 활성 노트 개수 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_active 
ON notes (user_id) 
WHERE deleted_at IS NULL;

-- 5. 노트 수정 시간 기반 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_updated 
ON notes (user_id, updated_at DESC) 
WHERE deleted_at IS NULL;

-- 6. 제목 검색 최적화 (텍스트 검색용)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_title_search 
ON notes USING gin (to_tsvector('korean', title)) 
WHERE deleted_at IS NULL;

-- 7. 내용 검색 최적화 (텍스트 검색용)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_content_search 
ON notes USING gin (to_tsvector('korean', content)) 
WHERE deleted_at IS NULL;

-- 8. 복합 검색 최적화 (제목 + 내용)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_fulltext_search 
ON notes USING gin (to_tsvector('korean', title || ' ' || content)) 
WHERE deleted_at IS NULL;

-- 9. 사용자별 최근 노트 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_recent 
ON notes (user_id, created_at DESC) 
WHERE deleted_at IS NULL;

-- 10. 태그 관련 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_note_tags_note_id 
ON note_tags (note_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_note_tags_tag 
ON note_tags (tag);

-- 11. 요약 관련 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_summaries_note_id 
ON summaries (note_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_summaries_created_at 
ON summaries (created_at DESC);

-- 12. 사용자별 통계 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_stats 
ON notes (user_id, created_at, deleted_at);

-- 인덱스 사용 통계 확인
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('notes', 'note_tags', 'summaries')
ORDER BY idx_scan DESC;

-- 테이블 크기 및 인덱스 크기 확인
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables 
WHERE tablename IN ('notes', 'note_tags', 'summaries')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
