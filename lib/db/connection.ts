// 데이터베이스 연결 관리 유틸리티
// DATABASE_URL 직접 연결만 사용하는 단순화된 연결 관리
// 성능 최적화를 위한 캐싱 및 연결 풀링 개선

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import performanceMonitor from './performance-monitor';

// 연결 상태 캐시
let connectionStatus: 'unknown' | 'direct' = 'unknown';
let cachedConnection: any = null;
let lastHealthCheck: Date | null = null;
const HEALTH_CHECK_INTERVAL = 300000; // 5분
const CONNECTION_TIMEOUT = 30000; // 30초

export async function getDatabaseConnection() {
  // 캐시된 연결이 있고 건강한 경우 반환
  if (cachedConnection && connectionStatus !== 'unknown' && lastHealthCheck) {
    const timeSinceLastCheck = Date.now() - lastHealthCheck.getTime();
    if (timeSinceLastCheck < HEALTH_CHECK_INTERVAL) {
      return cachedConnection;
    }
  }

  // DATABASE_URL 직접 연결만 사용
  const databaseUrl = process.env.DATABASE_URL;
  
  // 빌드 시점에서는 기본값 사용
  const fallbackUrl = 'postgresql://postgres.djtohfpztbsbxpyephml:BpklBPjFD7zNibEF@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';
  const finalDatabaseUrl = databaseUrl || fallbackUrl;
  
  if (!databaseUrl) {
    console.warn('⚠️ DATABASE_URL 환경 변수가 설정되지 않았습니다. 기본값을 사용합니다.');
  }

  try {
    console.log('🔄 DATABASE_URL 직접 연결 시도...');
    const connectionStart = Date.now();
    
    const sql = postgres(finalDatabaseUrl, {
      max: 15, // 연결 풀 크기 증가 (5 → 15)
      idle_timeout: 10, // 유휴 시간 단축 (20 → 10초)
      connect_timeout: CONNECTION_TIMEOUT,
      ssl: 'require',
      // 성능 최적화 옵션 추가
      prepare: false, // prepared statements 비활성화로 초기 연결 속도 향상
      transform: {
        undefined: null, // undefined를 null로 변환하여 오류 방지
      },
      // 연결 재사용 최적화
      onnotice: () => {}, // 불필요한 notice 로그 제거
    });
    
    const db = drizzle(sql);
    
    // 연결 테스트 (타임아웃 설정)
    const testPromise = sql`SELECT 1 as test, now() as current_time`;
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
    );
    
    await Promise.race([testPromise, timeoutPromise]);
    
    const connectionTime = Date.now() - connectionStart;
    performanceMonitor.recordConnectionTime(connectionTime);
    
    connectionStatus = 'direct';
    cachedConnection = { type: 'direct', connection: db, sql };
    lastHealthCheck = new Date();
    console.log(`✅ DATABASE_URL 직접 연결 성공 (${connectionTime}ms)`);
    return cachedConnection;
  } catch (error) {
    console.error('❌ DATABASE_URL 직접 연결 실패:', error instanceof Error ? error.message : '알 수 없는 오류');
    throw new Error(`데이터베이스 연결 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

export function getConnectionStatus() {
  return connectionStatus;
}

export function clearConnectionCache() {
  connectionStatus = 'unknown';
  cachedConnection = null;
  lastHealthCheck = null;
}

// 연결 상태 모니터링
export async function checkConnectionHealth(): Promise<boolean> {
  try {
    const connection = await getDatabaseConnection();
    await connection.sql`SELECT 1`;
    lastHealthCheck = new Date();
    return true;
  } catch (error) {
    console.error('❌ 연결 상태 확인 실패:', error);
    clearConnectionCache();
    return false;
  }
}

// 연결 재시도
export async function reconnectDatabase() {
  console.log('🔄 데이터베이스 재연결 시도...');
  clearConnectionCache();
  return await getDatabaseConnection();
}

// 연결 정보 가져오기
export function getConnectionInfo() {
  return {
    status: connectionStatus,
    lastHealthCheck,
    isHealthy: lastHealthCheck && (Date.now() - lastHealthCheck.getTime()) < HEALTH_CHECK_INTERVAL
  };
}

// 직접 연결을 통한 쿼리 실행 헬퍼
export async function executeQuery(query: string, params: any[] = []) {
  const connection = await getDatabaseConnection();
  return await connection.sql.unsafe(query, params);
}

// 테이블 존재 확인 헬퍼
export async function checkTableExists(tableName: string): Promise<boolean> {
  const connection = await getDatabaseConnection();
  
  const result = await connection.sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    )
  `;
  return result[0]?.exists || false;
}
