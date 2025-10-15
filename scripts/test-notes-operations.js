// notes 작업 함수 테스트 스크립트
// 새로운 notes-operations.ts 함수들 테스트

const https = require('https');
const http = require('http');

async function testNotesOperations() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Notes 작업 함수 테스트');
  console.log('==========================\n');

  try {
    // 1. INSERT 테스트
    console.log('1. INSERT 테스트...');
    
    const insertData = {
      user_id: '882d1de1-b828-4281-9768-0a4065c3dd22',
      title: 'Notes Operations Test',
      content: 'Testing the new notes operations functions'
    };
    
    const insertUrl = `${baseUrl}/api/test/notes-operations/insert`;
    const insertResponse = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(insertData)
    });
    
    if (insertResponse.ok) {
      const insertResult = await insertResponse.json();
      console.log('✅ INSERT 성공:', insertResult);
      
      // 2. SELECT 테스트
      console.log('\n2. SELECT 테스트...');
      
      const selectUrl = `${baseUrl}/api/test/notes-operations/select?user_id=${insertData.user_id}&limit=5`;
      const selectResponse = await fetch(selectUrl);
      
      if (selectResponse.ok) {
        const selectResult = await selectResponse.json();
        console.log('✅ SELECT 성공:', selectResult);
        
        // 3. UPDATE 테스트 (첫 번째 노트 업데이트)
        if (selectResult.data && selectResult.data.length > 0) {
          const noteId = selectResult.data[0].id;
          console.log(`\n3. UPDATE 테스트 (노트 ID: ${noteId})...`);
          
          const updateData = {
            note_id: noteId,
            title: 'Updated Notes Operations Test',
            content: 'This note has been updated successfully'
          };
          
          const updateUrl = `${baseUrl}/api/test/notes-operations/update`;
          const updateResponse = await fetch(updateUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
          });
          
          if (updateResponse.ok) {
            const updateResult = await updateResponse.json();
            console.log('✅ UPDATE 성공:', updateResult);
          } else {
            const updateError = await updateResponse.text();
            console.log('❌ UPDATE 실패:', updateError);
          }
        }
      } else {
        const selectError = await selectResponse.text();
        console.log('❌ SELECT 실패:', selectError);
      }
    } else {
      const insertError = await insertResponse.text();
      console.log('❌ INSERT 실패:', insertError);
    }

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error.message);
  }
}

// fetch가 없는 경우 polyfill 추가
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testNotesOperations();
