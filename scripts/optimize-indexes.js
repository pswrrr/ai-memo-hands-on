// 데이터베이스 인덱스 최적화 스크립트
const postgres = require('postgres');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.djtohfpztbsbxpyephml:BpklBPjFD7zNibEF@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function optimizeIndexes() {
  console.log('🔧 데이터베이스 인덱스 최적화 시작...\n');
  
  const sql = postgres(DATABASE_URL, {
    max: 15,
    idle_timeout: 10,
    connect_timeout: 30000,
    ssl: 'require',
  });

  try {
    // 기존 인덱스 확인
    console.log('📊 현재 인덱스 상태:');
    const existingIndexes = await sql`
      SELECT indexname, tablename, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('notes', 'note_tags', 'summaries')
      ORDER BY tablename, indexname
    `;
    
    existingIndexes.forEach(idx => {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    });

    console.log('\n🔧 인덱스 생성 중...');

    // 1. 사용자별 노트 조회 최적화 인덱스
    console.log('1. 사용자별 노트 조회 최적화 인덱스 생성...');
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_deleted_created 
      ON notes (user_id, deleted_at, created_at DESC)
    `;

    // 2. 제목 정렬용 인덱스
    console.log('2. 제목 정렬용 인덱스 생성...');
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_deleted_title 
      ON notes (user_id, deleted_at, title)
    `;

    // 3. 활성 노트 조회 인덱스
    console.log('3. 활성 노트 조회 인덱스 생성...');
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_active_created 
      ON notes (created_at DESC) 
      WHERE deleted_at IS NULL
    `;

    // 4. 사용자별 활성 노트 개수 조회 최적화
    console.log('4. 사용자별 활성 노트 개수 조회 인덱스 생성...');
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_active 
      ON notes (user_id) 
      WHERE deleted_at IS NULL
    `;

    // 5. 노트 수정 시간 기반 조회 최적화
    console.log('5. 노트 수정 시간 기반 조회 인덱스 생성...');
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_updated 
      ON notes (user_id, updated_at DESC) 
      WHERE deleted_at IS NULL
    `;

    // 6. 사용자별 최근 노트 조회 최적화
    console.log('6. 사용자별 최근 노트 조회 인덱스 생성...');
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_recent 
      ON notes (user_id, created_at DESC) 
      WHERE deleted_at IS NULL
    `;

    // 7. 태그 관련 조회 최적화
    console.log('7. 태그 관련 조회 인덱스 생성...');
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_note_tags_note_id 
      ON note_tags (note_id)
    `;

    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_note_tags_tag 
      ON note_tags (tag)
    `;

    // 8. 요약 관련 조회 최적화
    console.log('8. 요약 관련 조회 인덱스 생성...');
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_summaries_note_id 
      ON summaries (note_id)
    `;

    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_summaries_created_at 
      ON summaries (created_at DESC)
    `;

    // 9. 사용자별 통계 조회 최적화
    console.log('9. 사용자별 통계 조회 인덱스 생성...');
    await sql`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notes_user_stats 
      ON notes (user_id, created_at, deleted_at)
    `;

    console.log('\n✅ 인덱스 생성 완료!');

    // 인덱스 사용 통계 확인
    console.log('\n📊 인덱스 사용 통계:');
    const indexStats = await sql`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      WHERE tablename IN ('notes', 'note_tags', 'summaries')
      ORDER BY idx_scan DESC
    `;

    indexStats.forEach(stat => {
      console.log(`  ${stat.indexname}: ${stat.idx_scan}회 스캔, ${stat.idx_tup_read}개 튜플 읽음`);
    });

    // 테이블 크기 확인
    console.log('\n📏 테이블 크기:');
    const tableSizes = await sql`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
        pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
      FROM pg_tables 
      WHERE tablename IN ('notes', 'note_tags', 'summaries')
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    tableSizes.forEach(size => {
      console.log(`  ${size.tablename}: 테이블 ${size.table_size}, 인덱스 ${size.index_size}, 총 ${size.total_size}`);
    });

    console.log('\n🎯 최적화 완료! 노트 로딩 성능이 향상되었습니다.');

  } catch (error) {
    console.error('❌ 인덱스 최적화 실패:', error);
  } finally {
    await sql.end();
  }
}

// 성능 테스트
async function testPerformance() {
  console.log('\n⚡ 성능 테스트 시작...');
  
  const sql = postgres(DATABASE_URL, {
    max: 15,
    idle_timeout: 10,
    connect_timeout: 30000,
    ssl: 'require',
  });

  try {
    const testUserId = '0a300da7-1fd4-435e-a111-66a567b8836a';
    
    // 테스트 쿼리 실행
    const startTime = Date.now();
    
    const result = await sql`
      SELECT 
        id, title, content, created_at, updated_at,
        (SELECT COUNT(*) FROM notes WHERE user_id = ${testUserId} AND deleted_at IS NULL) as total_count
      FROM notes 
      WHERE user_id = ${testUserId} 
      AND deleted_at IS NULL 
      ORDER BY created_at DESC 
      LIMIT 10 OFFSET 0
    `;
    
    const executionTime = Date.now() - startTime;
    
    console.log(`✅ 테스트 쿼리 실행 시간: ${executionTime}ms`);
    console.log(`📊 조회된 노트 수: ${result.length}개`);
    
    // 쿼리 실행 계획 분석
    console.log('\n📋 쿼리 실행 계획:');
    const explainResult = await sql`
      EXPLAIN (ANALYZE, BUFFERS) 
      SELECT id, title, content, created_at, updated_at
      FROM notes 
      WHERE user_id = ${testUserId} 
      AND deleted_at IS NULL 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    explainResult.forEach(row => {
      console.log(`  ${row['QUERY PLAN']}`);
    });

  } catch (error) {
    console.error('❌ 성능 테스트 실패:', error);
  } finally {
    await sql.end();
  }
}

// 메인 실행
async function main() {
  try {
    await optimizeIndexes();
    await testPerformance();
    
    console.log('\n🎯 최적화 권장사항:');
    console.log('1. 노트 목록 캐싱 도입 (가장 큰 효과)');
    console.log('2. 페이지네이션 최적화');
    console.log('3. 쿼리 최적화 (필요한 필드만 선택)');
    console.log('4. 연결 풀 최적화');
    console.log('5. 프론트엔드 로딩 상태 개선');
    
  } catch (error) {
    console.error('❌ 최적화 실패:', error);
  }
}

main();
