// 데이터베이스 연결 테스트 스크립트
// Node.js 환경에서 직접 API 엔드포인트를 테스트합니다.

const https = require('https');
const http = require('http');

async function testDatabaseAPI() {
  const baseUrl = 'http://localhost:3000';
  const testUrl = `${baseUrl}/api/test/database`;
  
  console.log('🔍 데이터베이스 연결 테스트 시작...');
  console.log(`📡 테스트 URL: ${testUrl}`);
  console.log('');

  try {
    const response = await fetch(testUrl);
    const data = await response.json();
    
    console.log('✅ API 응답 상태:', response.status);
    console.log('📊 응답 데이터:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n🎉 모든 핵심 테스트가 성공적으로 완료되었습니다!');
      
      // 테스트 요약 정보 표시
      if (data.summary) {
        console.log(`\n📊 테스트 요약: ${data.summary.success}/${data.summary.total} 성공`);
        if (data.summary.warning > 0) {
          console.log(`⚠️  경고: ${data.summary.warning}개`);
        }
        if (data.summary.error > 0) {
          console.log(`❌ 오류: ${data.summary.error}개`);
        }
      }
      
      // 각 테스트 결과 요약
      if (data.results) {
        console.log('\n📋 테스트 결과 요약:');
        data.results.forEach((result, index) => {
          const status = result.status === 'success' ? '✅' : 
                        result.status === 'error' ? '❌' : '⚠️';
          const critical = result.test === '데이터베이스 직접 연결' ? ' (비선택적)' : '';
          console.log(`${index + 1}. ${status} ${result.test}${critical}: ${result.message}`);
          if (result.details) {
            console.log(`   📝 세부사항: ${result.details}`);
          }
          if (result.duration) {
            console.log(`   ⏱️  실행시간: ${result.duration}ms`);
          }
        });
      }
    } else {
      console.log('\n❌ 핵심 테스트 실패:', data.error);
      if (data.summary && data.summary.criticalErrors) {
        console.log('🚨 중요한 데이터베이스 연결 문제가 있습니다.');
      }
    }
    
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error.message);
    console.log('\n🔧 해결 방법:');
    console.log('1. 개발 서버가 실행 중인지 확인하세요 (pnpm dev)');
    console.log('2. 포트 3000이 사용 가능한지 확인하세요');
    console.log('3. 환경 변수가 올바르게 설정되었는지 확인하세요');
  }
}

// fetch가 없는 경우 polyfill 추가
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testDatabaseAPI();
