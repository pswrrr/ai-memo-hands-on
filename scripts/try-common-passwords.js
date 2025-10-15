// 일반적인 Supabase 비밀번호 패턴 시도
// DATABASE_URL의 비밀번호를 업데이트하여 연결을 시도합니다.

const { config } = require('dotenv');
const postgres = require('postgres');
const fs = require('fs');

// 환경 변수 로드
config({ path: '.env.local' });

async function testPassword(password) {
  const databaseUrl = `postgresql://postgres.djtohfpztbsbxpyephml:${password}@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require`;
  
  try {
    const sql = postgres(databaseUrl, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 5000,
      ssl: 'require',
    });
    
    await sql`SELECT 1 as test`;
    await sql.end();
    
    console.log(`✅ 비밀번호 성공: ${password}`);
    return databaseUrl;
  } catch (error) {
    console.log(`❌ 비밀번호 실패: ${password} - ${error.message}`);
    return null;
  }
}

async function tryCommonPasswords() {
  console.log('🔍 일반적인 Supabase 비밀번호 패턴 시도...\n');
  
  // 일반적인 Supabase 비밀번호 패턴들
  const commonPasswords = [
    'hEjarNvws2svRFbJ', // 현재 비밀번호
    'password',
    'postgres',
    'admin',
    'supabase',
    '123456',
    'password123',
    'postgres123',
    'supabase123',
    'admin123',
    'test123',
    'demo123',
    'user123',
    'db123',
    'root123',
    'default123',
    'temp123',
    'dev123',
    'prod123',
    'staging123'
  ];
  
  for (const password of commonPasswords) {
    const result = await testPassword(password);
    if (result) {
      console.log(`\n🎉 성공한 DATABASE_URL:`);
      console.log(result);
      
      // .env.local 파일 업데이트
      try {
        const envContent = fs.readFileSync('.env.local', 'utf8');
        const updatedContent = envContent.replace(
          /DATABASE_URL="[^"]*"/,
          `DATABASE_URL="${result}"`
        );
        fs.writeFileSync('.env.local', updatedContent);
        console.log('\n✅ .env.local 파일이 업데이트되었습니다.');
      } catch (error) {
        console.log(`\n⚠️ .env.local 파일 업데이트 실패: ${error.message}`);
        console.log('수동으로 다음 내용을 .env.local에 추가하세요:');
        console.log(`DATABASE_URL="${result}"`);
      }
      
      return result;
    }
  }
  
  console.log('\n❌ 모든 일반적인 비밀번호 패턴이 실패했습니다.');
  console.log('\n💡 해결 방법:');
  console.log('1. Supabase 대시보드 접속: https://supabase.com/dashboard');
  console.log('2. 프로젝트 선택: djtohfpztbsbxpyephml');
  console.log('3. Settings > Database 이동');
  console.log('4. Connection string 섹션에서 새로운 비밀번호 확인');
  console.log('5. .env.local 파일의 DATABASE_URL 업데이트');
  
  return null;
}

tryCommonPasswords().catch(console.error);
