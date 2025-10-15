// 최적화된 데이터베이스 연결 관리자
// 성능 향상을 위한 캐싱 및 연결 풀링 최적화

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// 쿼리 결과 캐시
interface QueryCache {
  [key: string]: {
    result: any;
    timestamp: number;
    ttl: number;
  };
}

// 연결 상태 관리
interface ConnectionState {
  connection: any;
  sql: any;
  lastUsed: Date;
  isHealthy: boolean;
}

class OptimizedDatabaseManager {
  private connectionState: ConnectionState | null = null;
  private queryCache: QueryCache = {};
  private readonly CACHE_TTL = 300000; // 5분
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1분
  private readonly MAX_RETRIES = 3;
  private retryCount = 0;

  constructor() {
    // 주기적 캐시 정리
    setInterval(() => this.cleanupCache(), this.CACHE_TTL);
  }

  async getConnection(): Promise<ConnectionState> {
    // 기존 연결이 건강한 경우 재사용
    if (this.connectionState && this.isConnectionHealthy()) {
      this.connectionState.lastUsed = new Date();
      return this.connectionState;
    }

    // 새 연결 생성
    return await this.createNewConnection();
  }

  private async createNewConnection(): Promise<ConnectionState> {
    const databaseUrl = process.env.DATABASE_URL;
    const fallbackUrl = 'postgresql://postgres.djtohfpztbsbxpyephml:BpklBPjFD7zNibEF@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require';
    const finalDatabaseUrl = databaseUrl || fallbackUrl;

    try {
      console.log('🚀 최적화된 데이터베이스 연결 생성...');
      
      const sql = postgres(finalDatabaseUrl, {
        max: 20, // 더 큰 연결 풀
        idle_timeout: 5, // 빠른 연결 재사용
        connect_timeout: 15000, // 연결 타임아웃 단축
        ssl: 'require',
        prepare: false, // prepared statements 비활성화
        transform: {
          undefined: null,
        },
        onnotice: () => {}, // 로그 최소화
        // 연결 풀 최적화
        max_lifetime: 60 * 30, // 30분
        backoff: 'exponential', // 지수 백오프
      });

      const db = drizzle(sql);

      // 빠른 연결 테스트
      const start = Date.now();
      await sql`SELECT 1`;
      const connectionTime = Date.now() - start;
      
      console.log(`✅ 최적화된 연결 생성 완료 (${connectionTime}ms)`);

      this.connectionState = {
        connection: db,
        sql,
        lastUsed: new Date(),
        isHealthy: true,
      };

      this.retryCount = 0;
      return this.connectionState;

    } catch (error) {
      console.error('❌ 최적화된 연결 생성 실패:', error);
      this.retryCount++;
      
      if (this.retryCount < this.MAX_RETRIES) {
        console.log(`🔄 재시도 ${this.retryCount}/${this.MAX_RETRIES}...`);
        await this.delay(1000 * this.retryCount); // 지수 백오프
        return await this.createNewConnection();
      }
      
      throw error;
    }
  }

  private isConnectionHealthy(): boolean {
    if (!this.connectionState) return false;
    
    const timeSinceLastUse = Date.now() - this.connectionState.lastUsed.getTime();
    return timeSinceLastUse < this.HEALTH_CHECK_INTERVAL && this.connectionState.isHealthy;
  }

  // 캐시된 쿼리 실행
  async executeCachedQuery<T>(
    queryKey: string, 
    queryFn: () => Promise<T>, 
    ttl: number = this.CACHE_TTL
  ): Promise<T> {
    // 캐시 확인
    const cached = this.queryCache[queryKey];
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`📦 캐시된 결과 사용: ${queryKey}`);
      return cached.result;
    }

    // 쿼리 실행
    const start = Date.now();
    const result = await queryFn();
    const executionTime = Date.now() - start;
    
    console.log(`⚡ 쿼리 실행: ${queryKey} (${executionTime}ms)`);

    // 캐시 저장
    this.queryCache[queryKey] = {
      result,
      timestamp: Date.now(),
      ttl,
    };

    return result;
  }

  // 일반 쿼리 실행 (캐시 없음)
  async executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    const connection = await this.getConnection();
    return await queryFn();
  }

  // 배치 쿼리 실행
  async executeBatchQueries<T>(queries: (() => Promise<T>)[]): Promise<T[]> {
    const connection = await this.getConnection();
    
    console.log(`🔄 배치 쿼리 실행: ${queries.length}개`);
    const start = Date.now();
    
    const results = await Promise.all(queries.map(query => query()));
    
    const executionTime = Date.now() - start;
    console.log(`✅ 배치 쿼리 완료: ${executionTime}ms (평균: ${(executionTime / queries.length).toFixed(2)}ms/쿼리)`);
    
    return results;
  }

  // 캐시 정리
  private cleanupCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const key in this.queryCache) {
      const cached = this.queryCache[key];
      if (now - cached.timestamp > cached.ttl) {
        delete this.queryCache[key];
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 캐시 정리: ${cleanedCount}개 항목 제거`);
    }
  }

  // 연결 상태 확인
  async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      await connection.sql`SELECT 1`;
      this.connectionState!.isHealthy = true;
      return true;
    } catch (error) {
      console.error('❌ 연결 상태 확인 실패:', error);
      this.connectionState!.isHealthy = false;
      return false;
    }
  }

  // 연결 종료
  async close(): Promise<void> {
    if (this.connectionState) {
      await this.connectionState.sql.end();
      this.connectionState = null;
    }
    this.queryCache = {};
  }

  // 유틸리티 메서드
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 통계 정보
  getStats() {
    return {
      hasConnection: !!this.connectionState,
      isHealthy: this.connectionState?.isHealthy || false,
      cacheSize: Object.keys(this.queryCache).length,
      lastUsed: this.connectionState?.lastUsed,
    };
  }
}

// 싱글톤 인스턴스
const dbManager = new OptimizedDatabaseManager();

export default dbManager;

// 편의 함수들
export async function getOptimizedConnection() {
  return await dbManager.getConnection();
}

export async function executeCachedQuery<T>(
  queryKey: string, 
  queryFn: () => Promise<T>, 
  ttl?: number
): Promise<T> {
  return await dbManager.executeCachedQuery(queryKey, queryFn, ttl);
}

export async function executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  return await dbManager.executeQuery(queryFn);
}

export async function executeBatchQueries<T>(queries: (() => Promise<T>)[]): Promise<T[]> {
  return await dbManager.executeBatchQueries(queries);
}

export async function healthCheck(): Promise<boolean> {
  return await dbManager.healthCheck();
}

export function getStats() {
  return dbManager.getStats();
}
