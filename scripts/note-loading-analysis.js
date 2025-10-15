// 노트 로딩 성능 분석 스크립트
const { performance } = require('perf_hooks');
const postgres = require('postgres');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.djtohfpztbsbxpyephml:BpklBPjFD7zNibEF@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function analyzeNoteLoadingPerformance() {
  console.log('🔍 노트 로딩 성능 분석 시작...\n');
  
  const results = {
    connectionTimes: [],
    queryTimes: [],
    totalNotes: 0,
    pageLoadTimes: [],
    totalTests: 5
  };

  for (let i = 0; i < results.totalTests; i++) {
    console.log(`테스트 ${i + 1}/${results.totalTests}`);
    
    try {
      // 연결 시간 측정
      const connectionStart = performance.now();
      const sql = postgres(DATABASE_URL, {
        max: 15,
        idle_timeout: 10,
        connect_timeout: 30000,
        ssl: 'require',
        prepare: false,
      });
      
      // 연결 테스트
      await sql`SELECT 1 as test, now() as current_time`;
      const connectionEnd = performance.now();
      const connectionTime = connectionEnd - connectionStart;
      results.connectionTimes.push(connectionTime);
      
      console.log(`  ✅ 연결 시간: ${connectionTime.toFixed(2)}ms`);
      
      // 노트 목록 쿼리 성능 측정
      const queryStart = performance.now();
      const noteResult = await sql`
        SELECT 
          id, title, content, created_at, updated_at,
          (SELECT COUNT(*) FROM notes WHERE user_id = n.user_id AND deleted_at IS NULL) as total_count
        FROM notes n 
        WHERE user_id = '0a300da7-1fd4-435e-a111-66a567b8836a' 
        AND deleted_at IS NULL 
        ORDER BY created_at DESC 
        LIMIT 10 OFFSET 0
      `;
      const queryEnd = performance.now();
      const queryTime = queryEnd - queryStart;
      results.queryTimes.push(queryTime);
      results.totalNotes = noteResult.length;
      
      console.log(`  ✅ 노트 쿼리 시간: ${queryTime.toFixed(2)}ms (${noteResult.length}개 노트)`);
      
      // 페이지 로딩 시뮬레이션 (연결 + 쿼리)
      const pageLoadStart = performance.now();
      await sql`SELECT 1`; // 연결 확인
      await sql`
        SELECT id, title, content, created_at, updated_at
        FROM notes 
        WHERE user_id = '0a300da7-1fd4-435e-a111-66a567b8836a' 
        AND deleted_at IS NULL 
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      const pageLoadEnd = performance.now();
      const pageLoadTime = pageLoadEnd - pageLoadStart;
      results.pageLoadTimes.push(pageLoadTime);
      
      console.log(`  ✅ 페이지 로딩 시간: ${pageLoadTime.toFixed(2)}ms`);
      
      await sql.end();
      
    } catch (error) {
      console.log(`  ❌ 테스트 ${i + 1} 실패:`, error.message);
    }
    
    // 테스트 간 간격
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 결과 분석
  console.log('\n📊 노트 로딩 성능 분석 결과:');
  console.log('='.repeat(60));
  
  if (results.connectionTimes.length > 0) {
    const avgConnectionTime = results.connectionTimes.reduce((a, b) => a + b, 0) / results.connectionTimes.length;
    const minConnectionTime = Math.min(...results.connectionTimes);
    const maxConnectionTime = Math.max(...results.connectionTimes);
    
    console.log(`연결 시간 통계:`);
    console.log(`  평균: ${avgConnectionTime.toFixed(2)}ms`);
    console.log(`  최소: ${minConnectionTime.toFixed(2)}ms`);
    console.log(`  최대: ${maxConnectionTime.toFixed(2)}ms`);
  }
  
  if (results.queryTimes.length > 0) {
    const avgQueryTime = results.queryTimes.reduce((a, b) => a + b, 0) / results.queryTimes.length;
    const minQueryTime = Math.min(...results.queryTimes);
    const maxQueryTime = Math.max(...results.queryTimes);
    
    console.log(`\n노트 쿼리 시간 통계:`);
    console.log(`  평균: ${avgQueryTime.toFixed(2)}ms`);
    console.log(`  최소: ${minQueryTime.toFixed(2)}ms`);
    console.log(`  최대: ${maxQueryTime.toFixed(2)}ms`);
  }
  
  if (results.pageLoadTimes.length > 0) {
    const avgPageLoadTime = results.pageLoadTimes.reduce((a, b) => a + b, 0) / results.pageLoadTimes.length;
    const minPageLoadTime = Math.min(...results.pageLoadTimes);
    const maxPageLoadTime = Math.max(...results.pageLoadTimes);
    
    console.log(`\n페이지 로딩 시간 통계:`);
    console.log(`  평균: ${avgPageLoadTime.toFixed(2)}ms`);
    console.log(`  최소: ${minPageLoadTime.toFixed(2)}ms`);
    console.log(`  최대: ${maxPageLoadTime.toFixed(2)}ms`);
  }
  
  console.log(`\n총 노트 수: ${results.totalNotes}개`);
  
  // 성능 개선 권장사항
  console.log('\n💡 노트 로딩 성능 개선 권장사항:');
  console.log('='.repeat(60));
  
  if (results.pageLoadTimes.length > 0) {
    const avgPageLoadTime = results.pageLoadTimes.reduce((a, b) => a + b, 0) / results.pageLoadTimes.length;
    
    if (avgPageLoadTime > 1000) {
      console.log('⚠️  페이지 로딩 시간이 1초를 초과합니다. 다음을 고려하세요:');
      console.log('   - 노트 목록 캐싱 도입');
      console.log('   - 페이지네이션 최적화');
      console.log('   - 인덱스 최적화');
      console.log('   - 연결 풀링 개선');
    } else if (avgPageLoadTime > 500) {
      console.log('⚠️  페이지 로딩 시간이 500ms를 초과합니다. 캐싱을 고려하세요.');
    } else {
      console.log('✅ 페이지 로딩 성능이 양호합니다.');
    }
  }
  
  // 구체적인 최적화 방안
  console.log('\n🎯 구체적인 최적화 방안:');
  console.log('1. 노트 목록 캐싱 (Redis 또는 메모리 캐시)');
  console.log('2. 페이지네이션 최적화 (OFFSET 대신 커서 기반)');
  console.log('3. 데이터베이스 인덱스 최적화');
  console.log('4. 연결 풀 크기 조정');
  console.log('5. 쿼리 최적화 (SELECT 필드 최소화)');
  console.log('6. 프론트엔드 로딩 상태 개선');
  console.log('7. 서버 사이드 렌더링 최적화');
}

// 인덱스 최적화 테스트
async function testIndexOptimization() {
  console.log('\n🔧 인덱스 최적화 테스트...');
  
  try {
    const sql = postgres(DATABASE_URL, {
      max: 15,
      idle_timeout: 10,
      connect_timeout: 30000,
      ssl: 'require',
    });
    
    // 현재 인덱스 확인
    console.log('\n현재 인덱스 상태:');
    const indexes = await sql`
      SELECT 
        indexname, 
        tablename, 
        indexdef 
      FROM pg_indexes 
      WHERE tablename = 'notes' 
      ORDER BY indexname
    `;
    
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    });
    
    // 쿼리 실행 계획 분석
    console.log('\n쿼리 실행 계획 분석:');
    const explainResult = await sql`
      EXPLAIN (ANALYZE, BUFFERS) 
      SELECT id, title, content, created_at, updated_at
      FROM notes 
      WHERE user_id = '0a300da7-1fd4-435e-a111-66a567b8836a' 
      AND deleted_at IS NULL 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    
    console.log('실행 계획:');
    explainResult.forEach(row => {
      console.log(`  ${row['QUERY PLAN']}`);
    });
    
    await sql.end();
    
  } catch (error) {
    console.error('인덱스 분석 실패:', error);
  }
}

// 메인 실행
async function main() {
  try {
    await analyzeNoteLoadingPerformance();
    await testIndexOptimization();
    
    console.log('\n🎯 최적화 우선순위:');
    console.log('1. 노트 목록 캐싱 (가장 큰 효과)');
    console.log('2. 페이지네이션 최적화');
    console.log('3. 데이터베이스 인덱스 최적화');
    console.log('4. 연결 풀 최적화');
    console.log('5. 쿼리 최적화');
    
  } catch (error) {
    console.error('❌ 성능 분석 실패:', error);
  }
}

main();
