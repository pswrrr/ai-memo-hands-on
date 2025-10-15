// 향상된 데이터베이스 연결 테스트
// 통합 연결 관리 시스템의 성능과 안정성을 테스트합니다.

const { config } = require('dotenv');

// 환경 변수 로드
config({ path: '.env.local' });

async function testEnhancedConnection() {
  console.log('🔍 향상된 데이터베이스 연결 테스트 시작...\n');
  
  try {
    // 동적 import 사용 (ES 모듈)
    const { 
      getDatabaseConnection, 
      checkConnectionHealth, 
      getConnectionStatus,
      getNotes,
      createNote,
      updateNote,
      deleteNote,
      clearConnectionCache
    } = await import('../lib/db/connection-enhanced.js');
    
    console.log('1️⃣ 기본 연결 테스트...');
    const startTime = Date.now();
    const connection = await getDatabaseConnection();
    const duration = Date.now() - startTime;
    
    console.log(`✅ 연결 성공! (${duration}ms)`);
    console.log(`📊 연결 타입: ${connection.type}`);
    console.log(`📊 연결 상태: ${connection.isHealthy ? '건강' : '비정상'}`);
    
    console.log('\n2️⃣ 연결 상태 확인...');
    const isHealthy = await checkConnectionHealth();
    console.log(`📊 연결 상태: ${isHealthy ? '건강' : '비정상'}`);
    
    console.log('\n3️⃣ 연결 정보 조회...');
    const status = getConnectionStatus();
    console.log(`📊 연결 정보:`, {
      type: status?.type,
      isHealthy: status?.isHealthy,
      lastChecked: status?.lastChecked
    });
    
    console.log('\n4️⃣ 데이터 조회 테스트...');
    try {
      const notes = await getNotes('test-user-id', 5, 0);
      console.log(`✅ 데이터 조회 성공: ${notes.length}개 레코드`);
    } catch (error) {
      console.log(`⚠️ 데이터 조회 실패: ${error.message}`);
    }
    
    console.log('\n5️⃣ 연결 캐시 테스트...');
    const cachedStartTime = Date.now();
    const cachedConnection = await getDatabaseConnection();
    const cachedDuration = Date.now() - cachedStartTime;
    
    console.log(`✅ 캐시된 연결 사용: ${cachedDuration}ms`);
    console.log(`📊 캐시 효과: ${duration - cachedDuration}ms 단축`);
    
    console.log('\n6️⃣ 연결 재시도 테스트...');
    clearConnectionCache();
    const retryStartTime = Date.now();
    const retryConnection = await getDatabaseConnection();
    const retryDuration = Date.now() - retryStartTime;
    
    console.log(`✅ 재연결 성공: ${retryDuration}ms`);
    
    console.log('\n📋 테스트 완료!');
    console.log('\n💡 결과 요약:');
    console.log(`- 연결 타입: ${connection.type}`);
    console.log(`- 연결 상태: ${connection.isHealthy ? '정상' : '비정상'}`);
    console.log(`- 초기 연결 시간: ${duration}ms`);
    console.log(`- 캐시된 연결 시간: ${cachedDuration}ms`);
    console.log(`- 재연결 시간: ${retryDuration}ms`);
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.log('\n🔧 해결 방법:');
    console.log('1. 환경 변수 설정 확인');
    console.log('2. Supabase 서비스 상태 확인');
    console.log('3. 네트워크 연결 상태 확인');
  }
}

testEnhancedConnection().catch(console.error);
