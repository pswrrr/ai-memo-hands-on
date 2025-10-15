// notes 테이블 구조 및 데이터 분석 스크립트
// INSERT 쿼리 오류 디버깅을 위한 도구

const https = require('https');
const http = require('http');

async function debugNotesTable() {
  const baseUrl = 'http://localhost:3000';
  const testUrl = `${baseUrl}/api/test/database`;
  
  console.log('🔍 notes 테이블 구조 분석');
  console.log('==========================\n');

  try {
    // 1. 데이터베이스 연결 테스트
    console.log('1. 데이터베이스 연결 상태 확인...');
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (!data.success) {
      console.log('❌ 데이터베이스 연결 실패');
      return;
    }
    
    console.log('✅ 데이터베이스 연결 정상\n');

    // 2. notes 테이블 구조 확인을 위한 API 호출
    console.log('2. notes 테이블 구조 확인...');
    const structureUrl = `${baseUrl}/api/debug/table-structure`;
    
    try {
      const structureResponse = await fetch(structureUrl);
      if (structureResponse.ok) {
        const structureData = await structureResponse.json();
        console.log('📊 테이블 구조:', JSON.stringify(structureData, null, 2));
      } else {
        console.log('⚠️ 테이블 구조 API 없음, 직접 분석 진행');
      }
    } catch (error) {
      console.log('⚠️ 테이블 구조 API 호출 실패, 직접 분석 진행');
    }

    // 3. INSERT 쿼리 문제 분석
    console.log('\n3. INSERT 쿼리 문제 분석:');
    console.log('실패한 쿼리:');
    console.log('INSERT INTO "notes" ("id", "user_id", "title", "content", "created_at", "updated_at", "deleted_at")');
    console.log('VALUES (default, $1, $2, $3, default, default, default)');
    console.log('PARAMS: 882d1de1-b828-4281-9768-0a4065c3dd22, 123, 123');
    
    console.log('\n🔍 문제점 분석:');
    console.log('1. user_id: 882d1de1-b828-4281-9768-0a4065c3dd22 (UUID 형식)');
    console.log('2. title: 123 (문자열)');
    console.log('3. content: 123 (문자열)');
    
    console.log('\n💡 가능한 원인:');
    console.log('1. title 길이 제한 (255자) 초과');
    console.log('2. content 타입 불일치');
    console.log('3. user_id 형식 문제');
    console.log('4. 데이터베이스 제약조건 위반');
    
    console.log('\n🔧 해결 방법:');
    console.log('1. title 길이 확인 (현재: 3자, 제한: 255자)');
    console.log('2. content가 NULL 허용인지 확인');
    console.log('3. user_id가 올바른 UUID 형식인지 확인');
    console.log('4. 데이터베이스 연결 방법 확인 (Supabase vs 직접 연결)');

  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error.message);
  }
}

// fetch가 없는 경우 polyfill 추가
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

debugNotesTable();
