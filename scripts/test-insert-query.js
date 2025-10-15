// INSERT 쿼리 테스트 스크립트
// notes 테이블에 데이터 삽입 테스트

const https = require('https');
const http = require('http');

async function testInsertQuery() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 INSERT 쿼리 테스트');
  console.log('===================\n');

  try {
    // 1. 간단한 INSERT 테스트
    console.log('1. 간단한 INSERT 테스트...');
    
    const testData = {
      user_id: '882d1de1-b828-4281-9768-0a4065c3dd22',
      title: 'Test Note',
      content: 'This is a test note content'
    };
    
    const insertUrl = `${baseUrl}/api/test/insert-note`;
    const response = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ INSERT 성공:', result);
    } else {
      const error = await response.text();
      console.log('❌ INSERT 실패:', error);
    }

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error.message);
  }
}

// fetch가 없는 경우 polyfill 추가
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testInsertQuery();
