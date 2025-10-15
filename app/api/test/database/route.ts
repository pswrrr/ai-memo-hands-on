import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseConnection, getConnectionStatus, checkTableExists } from '@/lib/db/connection';
import { notes, noteTags, summaries, tokenUsage } from '@/lib/db/schema';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  duration?: number;
}

export async function GET(request: NextRequest) {
  const results: TestResult[] = [];
  
  try {
    // 1. 환경 변수 확인
    const envTest = await testEnvironmentVariables();
    results.push(envTest);

    // 2. DATABASE_URL 직접 연결 테스트
    const dbTest = await testDatabaseConnection();
    results.push(dbTest);

    // 3. 스키마 테스트 (직접 연결을 통한)
    const schemaTest = await testSchema();
    results.push(schemaTest);

    // 4. 권한 테스트
    const permissionTest = await testPermissions();
    results.push(permissionTest);

    // 5. 샘플 쿼리 테스트 (직접 연결을 통한)
    const queryTest = await testSampleQueries();
    results.push(queryTest);

    // 전체 테스트 성공 여부 판단
    const hasCriticalErrors = results.some(result => result.status === 'error');
    
    return NextResponse.json({ 
      success: !hasCriticalErrors, 
      results,
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        success: results.filter(r => r.status === 'success').length,
        warning: results.filter(r => r.status === 'warning').length,
        error: results.filter(r => r.status === 'error').length,
        criticalErrors: hasCriticalErrors
      }
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      results 
    }, { status: 500 });
  }
}

async function testEnvironmentVariables(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const requiredEnvVars = [
      'DATABASE_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return {
        test: '환경 변수 확인',
        status: 'error',
        message: `필수 환경 변수가 누락되었습니다: ${missingVars.join(', ')}`,
        duration: Date.now() - startTime
      };
    }

    return {
      test: '환경 변수 확인',
      status: 'success',
      message: '모든 필수 환경 변수가 설정되어 있습니다.',
      details: `확인된 변수: ${requiredEnvVars.join(', ')}`,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: '환경 변수 확인',
      status: 'error',
      message: '환경 변수 확인 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      duration: Date.now() - startTime
    };
  }
}

async function testDatabaseConnection(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const connection = await getDatabaseConnection();
    const connectionType = getConnectionStatus();
    
    if (connectionType === 'direct') {
      return {
        test: 'DATABASE_URL 직접 연결',
        status: 'success',
        message: 'DATABASE_URL 직접 연결 성공',
        details: 'Drizzle ORM을 통한 직접 연결이 정상적으로 작동합니다.',
        duration: Date.now() - startTime
      };
    } else {
      return {
        test: 'DATABASE_URL 직접 연결',
        status: 'error',
        message: 'DATABASE_URL 직접 연결 실패',
        details: 'DATABASE_URL 환경 변수를 확인하고 연결 문자열이 올바른지 확인하세요.',
        duration: Date.now() - startTime
      };
    }
  } catch (error) {
    return {
      test: 'DATABASE_URL 직접 연결',
      status: 'error',
      message: 'DATABASE_URL 직접 연결 실패',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      duration: Date.now() - startTime
    };
  }
}

async function testSchema(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // 주요 테이블 존재 확인 (직접 연결을 통한)
    const tables = ['notes', 'note_tags', 'summaries', 'token_usage', 'usage_thresholds', 'usage_alerts', 'token_usage_stats'];
    const existingTables = [];
    const missingTables = [];

    for (const table of tables) {
      try {
        const exists = await checkTableExists(table);
        if (exists) {
          existingTables.push(table);
        } else {
          missingTables.push(table);
        }
      } catch (error) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      return {
        test: '스키마 확인',
        status: 'warning',
        message: `일부 테이블이 누락되었습니다: ${missingTables.join(', ')}`,
        details: `존재하는 테이블: ${existingTables.join(', ')}`,
        duration: Date.now() - startTime
      };
    }

    return {
      test: '스키마 확인',
      status: 'success',
      message: '모든 필수 테이블이 존재합니다.',
      details: `확인된 테이블: ${existingTables.join(', ')}`,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: '스키마 확인',
      status: 'error',
      message: '스키마 확인 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      duration: Date.now() - startTime
    };
  }
}

async function testPermissions(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const connection = await getDatabaseConnection();
    
    // 읽기 권한 테스트
    await connection.sql`SELECT id FROM notes LIMIT 1`;

    return {
      test: '권한 확인',
      status: 'success',
      message: '데이터베이스 읽기 권한 확인됨',
      details: 'notes 테이블에 대한 읽기 권한이 정상적으로 설정되어 있습니다.',
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: '권한 확인',
      status: 'error',
      message: '데이터베이스 읽기 권한이 없습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      duration: Date.now() - startTime
    };
  }
}

async function testSampleQueries(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const connection = await getDatabaseConnection();
    
    // 여러 샘플 쿼리 실행 (직접 연결을 통한)
    const results = [];
    
    // 1. notes 테이블 레코드 수 확인
    try {
      const notesCount = await connection.sql`SELECT COUNT(*) as count FROM notes`;
      results.push(`notes 테이블 레코드 수: ${notesCount[0]?.count || 0}`);
    } catch (error) {
      results.push(`notes 테이블 레코드 수: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 2. note_tags 테이블 레코드 수 확인
    try {
      const tagsCount = await connection.sql`SELECT COUNT(*) as count FROM note_tags`;
      results.push(`note_tags 테이블 레코드 수: ${tagsCount[0]?.count || 0}`);
    } catch (error) {
      results.push(`note_tags 테이블 레코드 수: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 3. summaries 테이블 레코드 수 확인
    try {
      const summariesCount = await connection.sql`SELECT COUNT(*) as count FROM summaries`;
      results.push(`summaries 테이블 레코드 수: ${summariesCount[0]?.count || 0}`);
    } catch (error) {
      results.push(`summaries 테이블 레코드 수: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    // 4. 최근 notes 조회 (실제 데이터 확인)
    try {
      const recentNotes = await connection.sql`
        SELECT id, title, created_at 
        FROM notes 
        ORDER BY created_at DESC 
        LIMIT 3
      `;
      results.push(`최근 notes 조회: ${recentNotes.length}개 레코드`);
      if (recentNotes.length > 0) {
        results.push(`  - 최신 노트: ${recentNotes[0].title} (${recentNotes[0].created_at})`);
      }
    } catch (error) {
      results.push(`최근 notes 조회: 오류 - ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    return {
      test: '샘플 쿼리 실행',
      status: 'success',
      message: '샘플 쿼리 실행 성공',
      details: results.join('\n'),
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      test: '샘플 쿼리 실행',
      status: 'error',
      message: '샘플 쿼리 실행 중 오류 발생',
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      duration: Date.now() - startTime
    };
  }
}
