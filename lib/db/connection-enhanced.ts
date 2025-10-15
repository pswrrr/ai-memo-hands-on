// 향상된 데이터베이스 연결 관리
// DATABASE_URL 직접 연결 실패 시 Supabase 클라이언트를 통한 대안 연결 제공
// DrizzleORM과 Supabase 클라이언트를 모두 지원하는 통합 연결 관리

import { createServerSupabase } from '@/lib/supabase-server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, desc, asc } from 'drizzle-orm';
import { notes, noteTags, summaries, tokenUsage } from './schema';

// 연결 상태 관리
interface ConnectionInfo {
  type: 'direct' | 'supabase';
  connection: any;
  sql?: any;
  isHealthy: boolean;
  lastChecked: Date;
}

let connectionInfo: ConnectionInfo | null = null;
const CONNECTION_TIMEOUT = 10000; // 10초
const HEALTH_CHECK_INTERVAL = 300000; // 5분

// 연결 상태 확인
export function getConnectionStatus() {
  return connectionInfo;
}

// 연결 캐시 초기화
export function clearConnectionCache() {
  connectionInfo = null;
}

// 데이터베이스 연결 획득
export async function getDatabaseConnection(): Promise<ConnectionInfo> {
  // 캐시된 연결이 있고 건강한 경우 반환
  if (connectionInfo && connectionInfo.isHealthy) {
    const timeSinceLastCheck = Date.now() - connectionInfo.lastChecked.getTime();
    if (timeSinceLastCheck < HEALTH_CHECK_INTERVAL) {
      return connectionInfo;
    }
  }

  // 1. DATABASE_URL 직접 연결 시도
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      console.log('🔄 DATABASE_URL 직접 연결 시도...');
      
      const sql = postgres(databaseUrl, {
        max: 5,
        idle_timeout: 20,
        connect_timeout: CONNECTION_TIMEOUT,
        ssl: 'require',
      });
      
      const db = drizzle(sql);
      
      // 연결 테스트 (타임아웃 설정)
      const testPromise = sql`SELECT 1 as test, now() as current_time`;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
      );
      
      await Promise.race([testPromise, timeoutPromise]);
      
      connectionInfo = {
        type: 'direct',
        connection: db,
        sql,
        isHealthy: true,
        lastChecked: new Date()
      };
      
      console.log('✅ DATABASE_URL 직접 연결 성공');
      return connectionInfo;
    }
  } catch (error) {
    console.log('⚠️ DATABASE_URL 직접 연결 실패:', error instanceof Error ? error.message : '알 수 없는 오류');
  }

  // 2. Supabase 클라이언트를 통한 연결
  try {
    console.log('🔄 Supabase 클라이언트 연결 시도...');
    
    const supabase = await createServerSupabase();
    
    // 연결 테스트
    const { data, error } = await supabase
      .from('notes')
      .select('count')
      .limit(1);
    
    if (error) {
      throw new Error(`Supabase 연결 실패: ${error.message}`);
    }
    
    connectionInfo = {
      type: 'supabase',
      connection: supabase,
      isHealthy: true,
      lastChecked: new Date()
    };
    
    console.log('✅ Supabase 클라이언트 연결 성공');
    return connectionInfo;
  } catch (error) {
    console.error('❌ 모든 데이터베이스 연결 방법 실패:', error);
    throw new Error('데이터베이스 연결을 설정할 수 없습니다.');
  }
}

// 통합 쿼리 실행 함수
export async function executeQuery(query: string, params: any[] = []) {
  const connection = await getDatabaseConnection();
  
  if (connection.type === 'direct') {
    // DrizzleORM을 통한 직접 쿼리 실행
    return await connection.sql.unsafe(query, params);
  } else {
    // Supabase 클라이언트를 통한 쿼리 실행
    const { data, error } = await connection.connection.rpc('execute_sql', {
      query_text: query,
      params: params
    });
    
    if (error) {
      throw new Error(`쿼리 실행 실패: ${error.message}`);
    }
    
    return data;
  }
}

// 테이블 존재 확인
export async function checkTableExists(tableName: string): Promise<boolean> {
  const connection = await getDatabaseConnection();
  
  if (connection.type === 'direct') {
    const result = await connection.sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      )
    `;
    return result[0]?.exists || false;
  } else {
    try {
      const { data, error } = await connection.connection
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error || error.code !== 'PGRST116';
    } catch {
      return false;
    }
  }
}

// 연결 상태 모니터링
export async function checkConnectionHealth(): Promise<boolean> {
  try {
    const connection = await getDatabaseConnection();
    
    if (connection.type === 'direct') {
      await connection.sql`SELECT 1`;
    } else {
      await connection.connection.from('notes').select('count').limit(1);
    }
    
    if (connectionInfo) {
      connectionInfo.isHealthy = true;
      connectionInfo.lastChecked = new Date();
    }
    
    return true;
  } catch (error) {
    console.error('❌ 연결 상태 확인 실패:', error);
    if (connectionInfo) {
      connectionInfo.isHealthy = false;
    }
    return false;
  }
}

// 연결 정보 가져오기
export function getConnectionInfo() {
  return connectionInfo;
}

// 연결 재시도 로직
export async function reconnectDatabase(): Promise<ConnectionInfo> {
  console.log('🔄 데이터베이스 재연결 시도...');
  clearConnectionCache();
  return await getDatabaseConnection();
}

// 통합 데이터베이스 작업 함수들
export async function getNotes(userId: string, limit: number = 10, offset: number = 0) {
  const connection = await getDatabaseConnection();
  
  if (connection.type === 'direct') {
    return await connection.connection
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.updatedAt))
      .limit(limit)
      .offset(offset);
  } else {
    const { data, error } = await connection.connection
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  }
}

export async function createNote(noteData: any) {
  const connection = await getDatabaseConnection();
  
  if (connection.type === 'direct') {
    return await connection.connection.insert(notes).values(noteData).returning();
  } else {
    const { data, error } = await connection.connection
      .from('notes')
      .insert(noteData)
      .select();
    
    if (error) throw error;
    return data;
  }
}

export async function updateNote(id: string, noteData: any) {
  const connection = await getDatabaseConnection();
  
  if (connection.type === 'direct') {
    return await connection.connection
      .update(notes)
      .set(noteData)
      .where(eq(notes.id, id))
      .returning();
  } else {
    const { data, error } = await connection.connection
      .from('notes')
      .update(noteData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  }
}

export async function deleteNote(id: string) {
  const connection = await getDatabaseConnection();
  
  if (connection.type === 'direct') {
    return await connection.connection
      .delete(notes)
      .where(eq(notes.id, id))
      .returning();
  } else {
    const { data, error } = await connection.connection
      .from('notes')
      .delete()
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  }
}

// 연결 상태 모니터링 시작
export function startConnectionMonitoring() {
  setInterval(async () => {
    try {
      await checkConnectionHealth();
    } catch (error) {
      console.error('연결 상태 모니터링 오류:', error);
    }
  }, HEALTH_CHECK_INTERVAL);
}

// 초기화 시 연결 모니터링 시작
if (typeof window === 'undefined') {
  startConnectionMonitoring();
}
