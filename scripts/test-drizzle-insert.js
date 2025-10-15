// Drizzle ORM INSERT 테스트 스크립트
// 직접 연결을 통한 INSERT 테스트

const https = require('https');
const http = require('http');

async function testDrizzleInsert() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🔧 Drizzle ORM INSERT 테스트');
  console.log('============================\n');

  try {
    // 1. Drizzle ORM을 통한 INSERT 테스트
    console.log('1. Drizzle ORM을 통한 INSERT 테스트...');
    
    const testData = {
      user_id: '882d1de1-b828-4281-9768-0a4065c3dd22',
      title: 'Drizzle Test Note',
      content: 'This is a Drizzle ORM test note'
    };
    
    const drizzleUrl = `${baseUrl}/api/test/drizzle-insert`;
    const response = await fetch(drizzleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Drizzle INSERT 성공:', result);
    } else {
      const error = await response.text();
      console.log('❌ Drizzle INSERT 실패:', error);
    }

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error.message);
  }
}

// fetch가 없는 경우 polyfill 추가
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testDrizzleInsert();
