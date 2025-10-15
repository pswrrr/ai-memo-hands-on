# Vercel 배포 환경에서 토큰 사용량 업데이트 문제 해결

## 문제 상황
- 개발환경에서는 토큰 사용량이 정상적으로 업데이트됨
- Vercel 배포 환경에서는 토큰 사용량 업데이트가 안 됨

## 원인 분석

### 1. 환경 차이점
- **개발환경**: 로컬 서버, 지속적인 연결
- **Vercel**: 서버리스 함수, 콜드 스타트, 제한된 연결 풀

### 2. 주요 원인
1. **데이터베이스 연결 풀 제한**: Vercel 서버리스 함수의 연결 풀 크기 제한
2. **콜드 스타트 지연**: 함수 초기화 시간으로 인한 타임아웃
3. **환경 변수 차이**: Vercel 환경에서의 환경 변수 설정 차이
4. **에러 처리 부족**: 실패 시 재시도 로직 부재

## 해결 방안

### 1. 토큰 추적 시스템 개선

#### 수정된 파일: `lib/ai/token-tracker.ts`
```typescript
// Vercel 환경 대응 토큰 추적
async recordTokenUsage(record: TokenUsageRecord): Promise<void> {
  try {
    // 환경 변수 확인
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL이 설정되지 않았습니다.');
      return;
    }

    // 데이터베이스 연결 테스트
    await this.testDatabaseConnection();
    
    // 토큰 사용량 기록
    const insertResult = await db.insert(tokenUsage).values({...});
    
    // 성공 로깅
    console.log(`✅ 토큰 사용량 기록 성공`, {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV
      }
    });
    
  } catch (error) {
    // Vercel 환경에서의 재시도 로직
    if (this.isVercelEnvironment()) {
      await this.retryTokenUsageRecord(record);
    }
  }
}
```

### 2. 데이터베이스 연결 최적화

#### 수정된 파일: `lib/db/connection.ts`
```typescript
// Vercel 환경 감지 및 최적화
const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);

const sql = postgres(finalDatabaseUrl, {
  max: isVercel ? 5 : 15, // Vercel에서는 연결 풀 크기 제한
  idle_timeout: isVercel ? 5 : 10, // Vercel에서는 더 짧은 유휴 시간
  connect_timeout: isVercel ? 15000 : CONNECTION_TIMEOUT,
  // Vercel 환경 특별 설정
  ...(isVercel && {
    max_lifetime: 60 * 10, // 10분 (Vercel 서버리스 함수 수명 고려)
    backoff: 'exponential', // 지수 백오프
    on_parameter_error: 'ignore', // 파라미터 오류 무시
  }),
});
```

### 3. 디버깅 API 추가

#### 새 파일: `app/api/debug/token-tracking/route.ts`
```typescript
// Vercel 배포 환경에서 토큰 추적 상태 확인
export async function GET(request: NextRequest) {
  // 환경 변수 확인
  const environment = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    DATABASE_URL_SET: !!process.env.DATABASE_URL,
    // ...
  };

  // 데이터베이스 연결 테스트
  // 토큰 사용량 테이블 확인
  // 최근 사용량 기록 확인
  
  return NextResponse.json({
    environment,
    database: { connectionStatus, tableExists },
    tokenUsage: { recent, total, recentUsers },
    recommendations: generateRecommendations(data)
  });
}
```

## 배포 및 테스트

### 1. 코드 변경사항 배포
```bash
git add .
git commit -m "Fix Vercel token tracking issues

- Add Vercel environment detection
- Implement retry logic for token usage recording
- Optimize database connection for serverless functions
- Add debugging API for token tracking status"
git push origin main
```

### 2. Vercel 환경 변수 확인
Vercel 대시보드에서 다음 환경 변수들이 설정되어 있는지 확인:
- `DATABASE_URL`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. 디버깅 API 테스트
배포 후 다음 URL로 접근하여 토큰 추적 상태 확인:
```
https://your-app.vercel.app/api/debug/token-tracking
```

### 4. 토큰 사용량 테스트
1. Vercel 배포된 앱에서 AI 요약 생성
2. AI 태그 생성
3. 관리자 페이지에서 토큰 사용량 확인

## 예상 결과

### 성공 시
- 토큰 사용량이 실시간으로 기록됨
- 관리자 페이지에서 최신 데이터 확인 가능
- 디버깅 API에서 정상 상태 표시

### 실패 시
- 디버깅 API에서 구체적인 오류 원인 확인
- Vercel 로그에서 상세한 에러 메시지 확인
- 환경 변수 재설정 또는 재배포 필요

## 추가 최적화

### 1. 연결 풀 모니터링
```typescript
// 연결 풀 상태 모니터링
const poolStats = await sql`
  SELECT count(*) as active_connections, state
  FROM pg_stat_activity 
  WHERE datname = current_database()
  GROUP BY state
`;
```

### 2. 에러 알림 시스템
```typescript
// 토큰 추적 실패 시 알림
if (isVercelEnvironment() && retryCount >= maxRetries) {
  await sendAlert({
    type: 'token_tracking_failure',
    environment: 'vercel',
    error: error.message
  });
}
```

### 3. 성능 모니터링
```typescript
// 토큰 추적 성능 모니터링
const performanceMetrics = {
  connectionTime: Date.now() - startTime,
  retryCount,
  success: recordId ? true : false,
  environment: 'vercel'
};
```

## 문제 해결 체크리스트

- [ ] Vercel 환경 변수 설정 확인
- [ ] 데이터베이스 연결 테스트
- [ ] 토큰 사용량 테이블 존재 확인
- [ ] AI 요약/태그 생성 테스트
- [ ] 관리자 페이지 데이터 확인
- [ ] 디버깅 API 응답 확인
- [ ] Vercel 로그 모니터링

이 수정사항들을 통해 Vercel 배포 환경에서도 토큰 사용량이 정상적으로 업데이트될 것입니다.
