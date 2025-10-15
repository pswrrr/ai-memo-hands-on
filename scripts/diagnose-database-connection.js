// DATABASE_URL 직접 연결 진단 스크립트
// Supabase PostgreSQL 연결 문제를 상세히 분석합니다.

const postgres = require('postgres');
const { config } = require('dotenv');

// 환경 변수 로드
config({ path: '.env.local' });

async function diagnoseDatabaseConnection() {
  console.log('🔍 DATABASE_URL 직접 연결 진단 시작...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL이 설정되지 않았습니다.');
    return;
  }
  
  console.log('📋 현재 DATABASE_URL 분석:');
  console.log(`URL: ${databaseUrl.replace(/:[^:@]*@/, ':***@')}`); // 비밀번호 마스킹
  
  // URL 파싱
  try {
    const url = new URL(databaseUrl);
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
  
  console.log('\n🧪 연결 테스트 시작...\n');
  
  // 1. 기본 연결 테스트
  console.log('1️⃣ 기본 연결 테스트...');
  try {
    const sql = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    const startTime = Date.now();
    const result = await sql`SELECT 1 as test, now() as current_time`;
    const duration = Date.now() - startTime;
    
    console.log(`✅ 기본 연결 성공! (${duration}ms)`);
    console.log(`📊 결과: ${JSON.stringify(result[0])}`);
    
    await sql.end();
    
  } catch (error) {
    console.log(`❌ 기본 연결 실패: ${error.message}`);
    console.log(`🔍 오류 코드: ${error.code || 'N/A'}`);
    console.log(`🔍 오류 세부사항: ${error.detail || 'N/A'}`);
    
    // 구체적인 오류 분석
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔑 비밀번호 인증 실패 - 해결 방법:');
      console.log('1. Supabase 대시보드에서 새로운 데이터베이스 비밀번호 확인');
      console.log('2. Settings > Database > Connection string에서 업데이트된 비밀번호 복사');
      console.log('3. .env.local 파일의 DATABASE_URL 업데이트');
    } else if (error.message.includes('CONNECT_TIMEOUT')) {
      console.log('\n⏰ 연결 타임아웃 - 해결 방법:');
      console.log('1. 네트워크 연결 상태 확인');
      console.log('2. 방화벽 설정 확인');
      console.log('3. Supabase 서비스 상태 확인');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n🌐 DNS 해결 실패 - 해결 방법:');
      console.log('1. 인터넷 연결 상태 확인');
      console.log('2. DNS 서버 설정 확인');
    }
  }
  
  // 2. SSL 모드별 연결 테스트
  console.log('\n2️⃣ SSL 모드별 연결 테스트...');
  
  const sslModes = ['require', 'prefer', 'allow', 'disable'];
  
  for (const sslMode of sslModes) {
    console.log(`\n🔐 SSL 모드: ${sslMode}`);
    try {
      const testUrl = `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}sslmode=${sslMode}`;
      const sql = postgres(testUrl, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
      });
      
      const startTime = Date.now();
      await sql`SELECT 1 as test`;
      const duration = Date.now() - startTime;
      
      console.log(`✅ SSL 모드 ${sslMode} 성공! (${duration}ms)`);
      await sql.end();
      break; // 성공한 SSL 모드 발견 시 중단
      
    } catch (error) {
      console.log(`❌ SSL 모드 ${sslMode} 실패: ${error.message}`);
    }
  }
  
  // 3. 연결 풀 설정 테스트
  console.log('\n3️⃣ 연결 풀 설정 테스트...');
  try {
    const sql = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 30,
      ssl: 'require',
    });
    
    const startTime = Date.now();
    const result = await sql`SELECT version() as version, current_database() as database`;
    const duration = Date.now() - startTime;
    
    console.log(`✅ 연결 풀 설정 성공! (${duration}ms)`);
    console.log(`📊 PostgreSQL 버전: ${result[0].version.split(' ')[0]}`);
    console.log(`📊 데이터베이스: ${result[0].database}`);
    
    await sql.end();
    
  } catch (error) {
    console.log(`❌ 연결 풀 설정 실패: ${error.message}`);
  }
  
  console.log('\n📋 진단 완료!');
  console.log('\n💡 권장 해결 방법:');
  console.log('1. Supabase 대시보드에서 새로운 연결 문자열 확인');
  console.log('2. SSL 모드 명시적 설정 (sslmode=require)');
  console.log('3. 연결 타임아웃 설정 조정');
  console.log('4. Supabase 클라이언트를 통한 대안 연결 사용 (현재 정상 작동)');
}

diagnoseDatabaseConnection().catch(console.error);
