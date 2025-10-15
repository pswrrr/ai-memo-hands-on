// 데이터베이스 연결 성능 분석 스크립트
const { performance } = require('perf_hooks');
const postgres = require('postgres');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.djtohfpztbsbxpyephml:BpklBPjFD7zNibEF@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function measureConnectionPerformance() {
  console.log('🔍 데이터베이스 연결 성능 분석 시작...\n');
  
  const results = {
    connectionTimes: [],
    queryTimes: [],
    totalTests: 10
  };

  for (let i = 0; i < results.totalTests; i++) {
    console.log(`테스트 ${i + 1}/${results.totalTests}`);
    
    try {
      // 연결 시간 측정
      const connectionStart = performance.now();
      const sql = postgres(DATABASE_URL, {
        max: 5,
        idle_timeout: 20,
        connect_timeout: 30000,
        ssl: 'require',
      });
      
      // 연결 테스트
      await sql`SELECT 1 as test, now() as current_time`;
      const connectionEnd = performance.now();
      const connectionTime = connectionEnd - connectionStart;
      results.connectionTimes.push(connectionTime);
      
      console.log(`  ✅ 연결 시간: ${connectionTime.toFixed(2)}ms`);
      
      // 쿼리 성능 측정
      const queryStart = performance.now();
      await sql`SELECT COUNT(*) FROM notes`;
      const queryEnd = performance.now();
      const queryTime = queryEnd - queryStart;
      results.queryTimes.push(queryTime);
      
      console.log(`  ✅ 쿼리 시간: ${queryTime.toFixed(2)}ms`);
      
      await sql.end();
      
    } catch (error) {
      console.log(`  ❌ 테스트 ${i + 1} 실패:`, error.message);
    }
    
    // 테스트 간 간격
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 결과 분석
  console.log('\n📊 성능 분석 결과:');
  console.log('='.repeat(50));
  
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
    
    console.log(`\n쿼리 시간 통계:`);
    console.log(`  평균: ${avgQueryTime.toFixed(2)}ms`);
    console.log(`  최소: ${minQueryTime.toFixed(2)}ms`);
    console.log(`  최대: ${maxQueryTime.toFixed(2)}ms`);
  }
  
  // 성능 개선 권장사항
  console.log('\n💡 성능 개선 권장사항:');
  console.log('='.repeat(50));
  
  if (results.connectionTimes.length > 0) {
    const avgConnectionTime = results.connectionTimes.reduce((a, b) => a + b, 0) / results.connectionTimes.length;
    
    if (avgConnectionTime > 1000) {
      console.log('⚠️  연결 시간이 1초를 초과합니다. 다음을 고려하세요:');
      console.log('   - 연결 풀 크기 증가 (max: 10-20)');
      console.log('   - idle_timeout 감소 (10-15초)');
      console.log('   - 연결 재사용 최적화');
    } else if (avgConnectionTime > 500) {
      console.log('⚠️  연결 시간이 500ms를 초과합니다. 연결 풀링 최적화를 고려하세요.');
    } else {
      console.log('✅ 연결 성능이 양호합니다.');
    }
  }
  
  if (results.queryTimes.length > 0) {
    const avgQueryTime = results.queryTimes.reduce((a, b) => a + b, 0) / results.queryTimes.length;
    
    if (avgQueryTime > 200) {
      console.log('⚠️  쿼리 시간이 200ms를 초과합니다. 다음을 고려하세요:');
      console.log('   - 인덱스 최적화');
      console.log('   - 쿼리 캐싱');
      console.log('   - 데이터베이스 튜닝');
    } else {
      console.log('✅ 쿼리 성능이 양호합니다.');
    }
  }
}

// 연결 풀 최적화 테스트
async function testConnectionPoolOptimization() {
  console.log('\n🔧 연결 풀 최적화 테스트...');
  
  const poolConfigs = [
    { max: 5, idle_timeout: 20, name: '현재 설정' },
    { max: 10, idle_timeout: 15, name: '풀 크기 증가' },
    { max: 15, idle_timeout: 10, name: '고성능 설정' },
    { max: 20, idle_timeout: 5, name: '최대 성능' }
  ];
  
  for (const config of poolConfigs) {
    console.log(`\n테스트: ${config.name} (max: ${config.max}, idle: ${config.idle_timeout}s)`);
    
    try {
      const start = performance.now();
      const sql = postgres(DATABASE_URL, {
        max: config.max,
        idle_timeout: config.idle_timeout,
        connect_timeout: 30000,
        ssl: 'require',
      });
      
      // 동시 연결 테스트
      const promises = [];
      for (let i = 0; i < Math.min(config.max, 5); i++) {
        promises.push(sql`SELECT 1 as test, now() as current_time`);
      }
      
      await Promise.all(promises);
      const end = performance.now();
      
      console.log(`  ✅ 동시 연결 시간: ${(end - start).toFixed(2)}ms`);
      await sql.end();
      
    } catch (error) {
      console.log(`  ❌ 실패:`, error.message);
    }
  }
}

// 메인 실행
async function main() {
  try {
    await measureConnectionPerformance();
    await testConnectionPoolOptimization();
    
    console.log('\n🎯 최적화 권장사항:');
    console.log('1. 연결 풀 크기를 10-15로 증가');
    console.log('2. idle_timeout을 10-15초로 설정');
    console.log('3. 연결 재사용을 위한 캐싱 강화');
    console.log('4. 쿼리 결과 캐싱 도입');
    console.log('5. 데이터베이스 인덱스 최적화');
    
  } catch (error) {
    console.error('❌ 성능 분석 실패:', error);
  }
}

main();
