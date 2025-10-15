// Vercel 배포 환경 디버깅 스크립트
const postgres = require('postgres');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.djtohfpztbsbxpyephml:BpklBPjFD7zNibEF@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function debugVercelEnvironment() {
  console.log('🔍 Vercel 배포 환경 디버깅...\n');
  
  const sql = postgres(DATABASE_URL, {
    max: 15,
    idle_timeout: 10,
    connect_timeout: 30000,
    ssl: 'require',
  });

  try {
    // 1. 환경 변수 확인
    console.log('📋 환경 변수 확인:');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '설정됨' : '설정되지 않음'}`);
    console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '설정됨' : '설정되지 않음'}`);
    console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '설정되지 않음'}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '설정되지 않음'}`);
    console.log('');

    // 2. 데이터베이스 연결 테스트
    console.log('🔗 데이터베이스 연결 테스트:');
    const connectionTest = await sql`SELECT 1 as test, now() as current_time`;
    console.log(`✅ 연결 성공: ${connectionTest[0].test}, 시간: ${connectionTest[0].current_time}`);
    console.log('');

    // 3. 토큰 사용량 테이블 확인
    console.log('📊 토큰 사용량 테이블 확인:');
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'token_usage'
      );
    `;
    console.log(`token_usage 테이블 존재: ${tableExists[0].exists}`);
    console.log('');

    // 4. 최근 토큰 사용량 기록 확인
    console.log('📈 최근 토큰 사용량 기록:');
    const recentUsage = await sql`
      SELECT 
        COUNT(*) as total_records,
        MAX(created_at) as latest_record,
        COUNT(DISTINCT user_id) as unique_users,
        SUM(total_tokens) as total_tokens,
        SUM(cost::numeric) as total_cost
      FROM token_usage
      WHERE created_at >= NOW() - INTERVAL '1 hour'
    `;
    
    if (recentUsage[0].total_records > 0) {
      console.log(`✅ 최근 1시간 내 기록: ${recentUsage[0].total_records}개`);
      console.log(`   최신 기록: ${recentUsage[0].latest_record}`);
      console.log(`   사용자 수: ${recentUsage[0].unique_users}`);
      console.log(`   총 토큰: ${recentUsage[0].total_tokens}`);
      console.log(`   총 비용: $${recentUsage[0].total_cost}`);
    } else {
      console.log('❌ 최근 1시간 내 토큰 사용량 기록이 없습니다.');
    }
    console.log('');

    // 5. 토큰 사용량 테이블 스키마 확인
    console.log('🏗️ 토큰 사용량 테이블 스키마:');
    const schema = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'token_usage'
      ORDER BY ordinal_position
    `;
    
    if (schema.length > 0) {
      console.log('✅ 테이블 스키마:');
      schema.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('❌ token_usage 테이블이 존재하지 않습니다.');
    }
    console.log('');

    // 6. 최근 사용자 활동 확인
    console.log('👥 최근 사용자 활동:');
    const recentUsers = await sql`
      SELECT 
        user_id,
        COUNT(*) as request_count,
        SUM(total_tokens) as total_tokens,
        MAX(created_at) as last_activity
      FROM token_usage
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY user_id
      ORDER BY last_activity DESC
      LIMIT 5
    `;
    
    if (recentUsers.length > 0) {
      console.log('✅ 최근 24시간 활동 사용자:');
      recentUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.user_id}: ${user.request_count}회 요청, ${user.total_tokens} 토큰, ${user.last_activity}`);
      });
    } else {
      console.log('❌ 최근 24시간 내 사용자 활동이 없습니다.');
    }
    console.log('');

    // 7. 데이터베이스 인덱스 확인
    console.log('🔍 데이터베이스 인덱스 확인:');
    const indexes = await sql`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'token_usage'
      ORDER BY indexname
    `;
    
    if (indexes.length > 0) {
      console.log('✅ token_usage 테이블 인덱스:');
      indexes.forEach(idx => {
        console.log(`   ${idx.indexname}: ${idx.indexdef}`);
      });
    } else {
      console.log('❌ token_usage 테이블에 인덱스가 없습니다.');
    }
    console.log('');

    // 8. Vercel 환경 특성 확인
    console.log('🌐 Vercel 환경 특성:');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`VERCEL: ${process.env.VERCEL}`);
    console.log(`VERCEL_ENV: ${process.env.VERCEL_ENV}`);
    console.log(`VERCEL_REGION: ${process.env.VERCEL_REGION}`);
    console.log('');

    // 9. 연결 풀 상태 확인
    console.log('🏊 연결 풀 상태:');
    const poolStats = await sql`
      SELECT 
        count(*) as active_connections,
        state,
        query
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state, query
      ORDER BY count(*) DESC
    `;
    
    if (poolStats.length > 0) {
      console.log('✅ 데이터베이스 연결 상태:');
      poolStats.forEach(stat => {
        console.log(`   ${stat.state}: ${stat.active_connections}개 연결`);
      });
    }

  } catch (error) {
    console.error('❌ 디버깅 중 오류 발생:', error);
  } finally {
    await sql.end();
  }
}

// 메인 실행
async function main() {
  try {
    await debugVercelEnvironment();
    
    console.log('\n🎯 Vercel 배포 환경 문제 해결 가이드:');
    console.log('1. Vercel 대시보드에서 환경 변수 확인');
    console.log('2. DATABASE_URL이 올바르게 설정되었는지 확인');
    console.log('3. 토큰 사용량 테이블이 존재하는지 확인');
    console.log('4. AI 요청 시 토큰 추적이 작동하는지 확인');
    console.log('5. 관리자 페이지 API 엔드포인트 테스트');
    
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  }
}

main();
