// DATABASE_URL 업데이트 및 테스트 스크립트
// Supabase 대시보드에서 새로운 연결 문자열을 확인하고 업데이트합니다.

const { config } = require('dotenv');
const postgres = require('postgres');

// 환경 변수 로드
config({ path: '.env.local' });

async function testDatabaseUrl(databaseUrl) {
  console.log(`🔍 DATABASE_URL 테스트: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`);
  
  try {
    const sql = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10000,
      ssl: 'require',
    });
    
    const startTime = Date.now();
    const result = await sql`SELECT 1 as test, now() as current_time`;
    const duration = Date.now() - startTime;
    
    console.log(`✅ 연결 성공! (${duration}ms)`);
    console.log(`📊 결과: ${JSON.stringify(result[0])}`);
    
    await sql.end();
    return true;
  } catch (error) {
    console.log(`❌ 연결 실패: ${error.message}`);
    return false;
  }
}

async function updateDatabaseUrl() {
  console.log('🔍 DATABASE_URL 업데이트 및 테스트 시작...\n');
  
  const currentUrl = process.env.DATABASE_URL;
  if (!currentUrl) {
    console.log('❌ DATABASE_URL이 설정되지 않았습니다.');
    return;
  }
  
  console.log('📋 현재 DATABASE_URL 분석:');
  console.log(`URL: ${currentUrl.replace(/:[^:@]*@/, ':***@')}`);
  
  // URL 파싱
  try {
    const url = new URL(currentUrl);
    console.log(`\n🔍 URL 구성 요소:`);
    console.log(`- 프로토콜: ${url.protocol}`);
    console.log(`- 호스트: ${url.hostname}`);
    console.log(`- 포트: ${url.port}`);
    console.log(`- 사용자: ${url.username}`);
    console.log(`- 데이터베이스: ${url.pathname.slice(1)}`);
    console.log(`- SSL 모드: ${url.searchParams.get('sslmode') || '미설정'}`);
  } catch (error) {
    console.log(`❌ URL 파싱 실패: ${error.message}`);
    return;
  }
  
  console.log('\n🧪 현재 DATABASE_URL 테스트...');
  const currentTest = await testDatabaseUrl(currentUrl);
  
  if (currentTest) {
    console.log('\n✅ 현재 DATABASE_URL이 정상적으로 작동합니다!');
    return;
  }
  
  console.log('\n⚠️ 현재 DATABASE_URL이 작동하지 않습니다.');
  console.log('\n💡 해결 방법:');
  console.log('1. Supabase 대시보드 접속: https://supabase.com/dashboard');
  console.log('2. 프로젝트 선택: djtohfpztbsbxpyephml');
  console.log('3. Settings > Database 이동');
  console.log('4. Connection string 섹션에서 새로운 비밀번호 확인');
  console.log('5. .env.local 파일의 DATABASE_URL 업데이트');
  
  console.log('\n📋 현재 DATABASE_URL 형식:');
  console.log('postgresql://postgres.djtohfpztbsbxpyephml:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require');
  
  console.log('\n🔧 수동 업데이트 방법:');
  console.log('1. Supabase 대시보드에서 새로운 연결 문자열 복사');
  console.log('2. .env.local 파일에서 DATABASE_URL 업데이트');
  console.log('3. node scripts/update-database-url.js 다시 실행');
}

updateDatabaseUrl().catch(console.error);
