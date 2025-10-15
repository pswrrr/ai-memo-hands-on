// 관리자 권한 확인 및 설정 스크립트
const postgres = require('postgres');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.djtohfpztbsbxpyephml:BpklBPjFD7zNibEF@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function checkAndSetAdminPermissions() {
  console.log('🔍 관리자 권한 확인 및 설정...\n');
  
  const sql = postgres(DATABASE_URL, {
    max: 15,
    idle_timeout: 10,
    connect_timeout: 30000,
    ssl: 'require',
  });

  try {
    // 1. 현재 사용자 확인
    console.log('📊 현재 사용자 정보:');
    const users = await sql`
      SELECT 
        id, 
        email, 
        raw_user_meta_data,
        created_at
      FROM auth.users 
      ORDER BY created_at DESC
      LIMIT 5
    `;
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.id})`);
      console.log(`   메타데이터: ${JSON.stringify(user.raw_user_meta_data)}`);
      console.log(`   생성일: ${user.created_at}`);
      console.log('');
    });

    // 2. 관리자 권한이 있는 사용자 확인
    console.log('👑 관리자 권한이 있는 사용자:');
    const adminUsers = await sql`
      SELECT 
        id, 
        email, 
        raw_user_meta_data
      FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    `;
    
    if (adminUsers.length > 0) {
      adminUsers.forEach(admin => {
        console.log(`- ${admin.email} (${admin.id})`);
      });
    } else {
      console.log('❌ 관리자 권한이 있는 사용자가 없습니다.');
    }

    // 3. 토큰 사용량 데이터 확인
    console.log('\n📈 토큰 사용량 데이터:');
    const tokenUsage = await sql`
      SELECT 
        COUNT(*) as total_records,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as total_cost,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(created_at) as earliest_record,
        MAX(created_at) as latest_record
      FROM token_usage
    `;
    
    if (tokenUsage[0].total_records > 0) {
      console.log(`✅ 토큰 사용량 기록: ${tokenUsage[0].total_records}개`);
      console.log(`   총 토큰: ${tokenUsage[0].total_tokens || 0}`);
      console.log(`   총 비용: $${tokenUsage[0].total_cost || 0}`);
      console.log(`   사용자 수: ${tokenUsage[0].unique_users}`);
      console.log(`   기간: ${tokenUsage[0].earliest_record} ~ ${tokenUsage[0].latest_record}`);
    } else {
      console.log('❌ 토큰 사용량 데이터가 없습니다.');
    }

    // 4. 최근 사용자에게 관리자 권한 부여 (선택사항)
    if (adminUsers.length === 0 && users.length > 0) {
      console.log('\n🔧 관리자 권한 설정...');
      const latestUser = users[0];
      
      console.log(`최신 사용자 ${latestUser.email}에게 관리자 권한을 부여하시겠습니까?`);
      console.log('자동으로 관리자 권한을 부여합니다...');
      
      await sql`
        UPDATE auth.users 
        SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
        WHERE id = ${latestUser.id}
      `;
      
      console.log(`✅ ${latestUser.email}에게 관리자 권한을 부여했습니다.`);
    }

    // 5. 관리자 권한 확인
    console.log('\n🔍 업데이트된 관리자 권한:');
    const updatedAdmins = await sql`
      SELECT 
        id, 
        email, 
        raw_user_meta_data
      FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    `;
    
    if (updatedAdmins.length > 0) {
      updatedAdmins.forEach(admin => {
        console.log(`✅ ${admin.email} - 관리자 권한 확인됨`);
      });
    } else {
      console.log('❌ 관리자 권한이 설정되지 않았습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await sql.end();
  }
}

// 메인 실행
async function main() {
  try {
    await checkAndSetAdminPermissions();
    
    console.log('\n🎯 다음 단계:');
    console.log('1. 관리자 권한이 부여된 계정으로 로그인');
    console.log('2. /admin/token-usage 페이지 접근');
    console.log('3. 토큰 사용량 데이터 확인');
    
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  }
}

main();
