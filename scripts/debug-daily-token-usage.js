// 일간 토큰 사용량 디버깅 스크립트
const postgres = require('postgres');

// 환경 변수 로드
require('dotenv').config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres.djtohfpztbsbxpyephml:BpklBPjFD7zNibEF@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function debugDailyTokenUsage() {
  console.log('🔍 일간 토큰 사용량 디버깅...\n');
  
  const sql = postgres(DATABASE_URL, {
    max: 15,
    idle_timeout: 10,
    connect_timeout: 30000,
    ssl: 'require',
  });

  try {
    // 1. 현재 시간 정보 확인
    console.log('🕐 시간대 정보:');
    const now = new Date();
    console.log(`로컬 시간: ${now.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`);
    console.log(`UTC 시간: ${now.toISOString()}`);
    console.log(`시간대 오프셋: ${now.getTimezoneOffset()}분`);
    console.log('');

    // 2. 일간 필터링 시간 범위 확인
    console.log('📅 일간 필터링 시간 범위:');
    
    // 로컬 시간 기준 (기존 로직)
    const localStartDate = new Date(now);
    localStartDate.setHours(0, 0, 0, 0);
    const localEndDate = new Date(now);
    localEndDate.setHours(23, 59, 59, 999);
    
    console.log(`로컬 시작: ${localStartDate.toISOString()}`);
    console.log(`로컬 종료: ${localEndDate.toISOString()}`);
    
    // UTC 시간 기준
    const utcStartDate = new Date(now);
    utcStartDate.setUTCHours(0, 0, 0, 0);
    const utcEndDate = new Date(now);
    utcEndDate.setUTCHours(23, 59, 59, 999);
    
    console.log(`UTC 시작: ${utcStartDate.toISOString()}`);
    console.log(`UTC 종료: ${utcEndDate.toISOString()}`);
    console.log('');

    // 3. 데이터베이스의 최근 토큰 사용량 기록 확인
    console.log('📊 최근 토큰 사용량 기록:');
    const recentRecords = await sql`
      SELECT 
        id,
        user_id,
        operation,
        total_tokens,
        cost,
        created_at,
        success
      FROM token_usage
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    if (recentRecords.length > 0) {
      console.log(`✅ 최근 24시간 내 기록: ${recentRecords.length}개`);
      recentRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.operation} - ${record.total_tokens} 토큰 (${record.created_at})`);
      });
    } else {
      console.log('❌ 최근 24시간 내 기록이 없습니다.');
    }
    console.log('');

    // 4. 로컬 시간 기준 일간 조회
    console.log('📈 로컬 시간 기준 일간 조회:');
    const localDailyStats = await sql`
      SELECT 
        COUNT(*) as total_records,
        SUM(total_tokens) as total_tokens,
        SUM(cost::numeric) as total_cost,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(created_at) as earliest_record,
        MAX(created_at) as latest_record
      FROM token_usage
      WHERE created_at >= ${localStartDate.toISOString()}
        AND created_at <= ${localEndDate.toISOString()}
    `;
    
    if (localDailyStats[0].total_records > 0) {
      console.log(`✅ 로컬 시간 기준: ${localDailyStats[0].total_records}개 기록`);
      console.log(`   총 토큰: ${localDailyStats[0].total_tokens}`);
      console.log(`   총 비용: $${localDailyStats[0].total_cost}`);
      console.log(`   사용자 수: ${localDailyStats[0].unique_users}`);
      console.log(`   기간: ${localDailyStats[0].earliest_record} ~ ${localDailyStats[0].latest_record}`);
    } else {
      console.log('❌ 로컬 시간 기준으로는 기록이 없습니다.');
    }
    console.log('');

    // 5. UTC 시간 기준 일간 조회
    console.log('📈 UTC 시간 기준 일간 조회:');
    const utcDailyStats = await sql`
      SELECT 
        COUNT(*) as total_records,
        SUM(total_tokens) as total_tokens,
        SUM(cost::numeric) as total_cost,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(created_at) as earliest_record,
        MAX(created_at) as latest_record
      FROM token_usage
      WHERE created_at >= ${utcStartDate.toISOString()}
        AND created_at <= ${utcEndDate.toISOString()}
    `;
    
    if (utcDailyStats[0].total_records > 0) {
      console.log(`✅ UTC 시간 기준: ${utcDailyStats[0].total_records}개 기록`);
      console.log(`   총 토큰: ${utcDailyStats[0].total_tokens}`);
      console.log(`   총 비용: $${utcDailyStats[0].total_cost}`);
      console.log(`   사용자 수: ${utcDailyStats[0].unique_users}`);
      console.log(`   기간: ${utcDailyStats[0].earliest_record} ~ ${utcDailyStats[0].latest_record}`);
    } else {
      console.log('❌ UTC 시간 기준으로도 기록이 없습니다.');
    }
    console.log('');

    // 6. 한국 시간대 기준 일간 조회 (수정된 로직)
    console.log('📈 한국 시간대 기준 일간 조회:');
    const kstStartDate = new Date(now);
    kstStartDate.setHours(0, 0, 0, 0);
    kstStartDate.setMinutes(kstStartDate.getMinutes() - kstStartDate.getTimezoneOffset());
    const kstEndDate = new Date(now);
    kstEndDate.setHours(23, 59, 59, 999);
    kstEndDate.setMinutes(kstEndDate.getMinutes() - kstEndDate.getTimezoneOffset());
    
    console.log(`KST 시작: ${kstStartDate.toISOString()}`);
    console.log(`KST 종료: ${kstEndDate.toISOString()}`);
    
    const kstDailyStats = await sql`
      SELECT 
        COUNT(*) as total_records,
        SUM(total_tokens) as total_tokens,
        SUM(cost::numeric) as total_cost,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(created_at) as earliest_record,
        MAX(created_at) as latest_record
      FROM token_usage
      WHERE created_at >= ${kstStartDate.toISOString()}
        AND created_at <= ${kstEndDate.toISOString()}
    `;
    
    if (kstDailyStats[0].total_records > 0) {
      console.log(`✅ KST 시간 기준: ${kstDailyStats[0].total_records}개 기록`);
      console.log(`   총 토큰: ${kstDailyStats[0].total_tokens}`);
      console.log(`   총 비용: $${kstDailyStats[0].total_cost}`);
      console.log(`   사용자 수: ${kstDailyStats[0].unique_users}`);
      console.log(`   기간: ${kstDailyStats[0].earliest_record} ~ ${kstDailyStats[0].latest_record}`);
    } else {
      console.log('❌ KST 시간 기준으로도 기록이 없습니다.');
    }
    console.log('');

    // 7. 문제 진단 및 해결 방안
    console.log('🔍 문제 진단:');
    
    if (localDailyStats[0].total_records === 0 && utcDailyStats[0].total_records === 0 && kstDailyStats[0].total_records === 0) {
      console.log('❌ 모든 시간대 기준으로 일간 기록이 없습니다.');
      console.log('   → 오늘 생성된 토큰 사용량 기록이 없거나 시간대 문제');
    } else if (localDailyStats[0].total_records > 0 && utcDailyStats[0].total_records === 0) {
      console.log('⚠️ 로컬 시간 기준으로만 기록이 있습니다.');
      console.log('   → Vercel 서버(UTC)와 로컬 시간대(KST) 불일치');
    } else if (utcDailyStats[0].total_records > 0 && localDailyStats[0].total_records === 0) {
      console.log('⚠️ UTC 시간 기준으로만 기록이 있습니다.');
      console.log('   → 로컬 환경과 Vercel 환경의 시간대 차이');
    } else {
      console.log('✅ 모든 시간대 기준으로 기록이 있습니다.');
    }
    
    console.log('\n🎯 해결 방안:');
    console.log('1. API에서 UTC 시간 기준으로 일간 조회하도록 수정');
    console.log('2. 또는 클라이언트 시간대를 고려한 동적 시간 범위 계산');
    console.log('3. Vercel 환경 변수로 시간대 설정 추가');

  } catch (error) {
    console.error('❌ 디버깅 중 오류 발생:', error);
  } finally {
    await sql.end();
  }
}

// 메인 실행
async function main() {
  try {
    await debugDailyTokenUsage();
  } catch (error) {
    console.error('❌ 스크립트 실행 실패:', error);
  }
}

main();
