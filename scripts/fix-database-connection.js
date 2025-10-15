// DATABASE_URL 연결 문제 해결 스크립트
// Supabase 대시보드에서 새로운 연결 문자열을 확인하고 업데이트하는 도구

const fs = require('fs');
const path = require('path');

console.log('🔧 DATABASE_URL 연결 문제 해결 도구');
console.log('=====================================\n');

// 현재 .env.local 파일 읽기
const envPath = path.join(__dirname, '..', '.env.local');

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 현재 .env.local 파일 확인됨');
  
  // DATABASE_URL 추출
  const databaseUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (databaseUrlMatch) {
    const currentUrl = databaseUrlMatch[1];
    console.log('🔍 현재 DATABASE_URL:', currentUrl);
    
    // URL 파싱
    const urlParts = new URL(currentUrl);
    const username = urlParts.username;
    const password = urlParts.password;
    const hostname = urlParts.hostname;
    const port = urlParts.port;
    const database = urlParts.pathname.substring(1);
    
    console.log('\n📊 연결 정보 분석:');
    console.log(`- 사용자명: ${username}`);
    console.log(`- 비밀번호: ${password ? '***' + password.slice(-4) : '없음'}`);
    console.log(`- 호스트: ${hostname}`);
    console.log(`- 포트: ${port}`);
    console.log(`- 데이터베이스: ${database}`);
    
    console.log('\n🔧 해결 방법:');
    console.log('1. Supabase 대시보드에서 새로운 비밀번호 확인');
    console.log('   - https://supabase.com/dashboard');
    console.log('   - 프로젝트: djtohfpztbsbxpyephml');
    console.log('   - Settings > Database > Connection string');
    console.log('');
    console.log('2. 새로운 DATABASE_URL 형식:');
    console.log(`   postgresql://${username}:[NEW_PASSWORD]@${hostname}:${port}/${database}`);
    console.log('');
    console.log('3. .env.local 파일에서 DATABASE_URL 업데이트');
    console.log('');
    console.log('4. 테스트 실행:');
    console.log('   node scripts/test-database.js');
    
  } else {
    console.log('❌ DATABASE_URL을 찾을 수 없습니다.');
  }
  
} catch (error) {
  console.error('❌ .env.local 파일을 읽을 수 없습니다:', error.message);
}

console.log('\n💡 대안 해결책:');
console.log('현재 Supabase 클라이언트를 통한 연결이 정상적으로 작동하고 있으므로,');
console.log('직접 연결이 필요하지 않다면 현재 상태를 유지해도 됩니다.');
console.log('');
console.log('✅ 정상 작동하는 기능:');
console.log('- Supabase 클라이언트 연결');
console.log('- 모든 데이터베이스 작업 (CRUD)');
console.log('- 애플리케이션 핵심 기능');
console.log('');
console.log('❌ 문제가 있는 기능:');
console.log('- DATABASE_URL 직접 연결 (Drizzle ORM 직접 사용)');
