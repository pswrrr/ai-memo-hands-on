# DATABASE_URL 비밀번호 인증 실패 해결 방법

## 문제 상황
```
password authentication failed for user "postgres"
```

## 원인 분석
- Supabase 데이터베이스 비밀번호가 변경되었거나 만료됨
- DATABASE_URL의 비밀번호가 올바르지 않음

## 해결 방법

### 방법 1: Supabase 대시보드에서 새로운 연결 문자열 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트: djtohfpztbsbxpyephml

2. **데이터베이스 설정 확인**
   - Settings > Database
   - Connection string 섹션에서 새로운 비밀번호 확인

3. **DATABASE_URL 업데이트**
   ```bash
   # .env.local 파일에서 DATABASE_URL 수정
   DATABASE_URL="postgresql://postgres.djtohfpztbsbxpyephml:[NEW_PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
   ```

### 방법 2: Supabase CLI를 통한 연결 문자열 생성

```bash
# Supabase CLI 설치 (이미 설치되어 있다면 생략)
npm install -g supabase

# 프로젝트 로그인
supabase login

# 연결 문자열 생성
supabase db url
```

### 방법 3: 대안 연결 방법 (권장)

현재 Supabase 클라이언트를 통한 연결이 정상적으로 작동하고 있으므로, 직접 연결 대신 Supabase 클라이언트를 사용하는 것이 더 안정적입니다.

## 임시 해결책

현재 상황에서는 다음 방법들을 사용할 수 있습니다:

### 1. Supabase 클라이언트만 사용
- 모든 데이터베이스 작업을 Supabase 클라이언트를 통해 수행
- 직접 연결 테스트는 비활성화

### 2. 연결 문자열 업데이트
- Supabase 대시보드에서 새로운 비밀번호 확인 후 업데이트

### 3. 환경 변수 분리
- 개발/프로덕션 환경별로 다른 연결 문자열 사용

## 테스트 방법

1. **새로운 DATABASE_URL 테스트**
   ```bash
   node scripts/test-database.js
   ```

2. **웹 브라우저에서 테스트**
   - http://localhost:3000/test/database

## 권장사항

1. **Supabase 클라이언트 우선 사용**: 직접 연결보다 안정적
2. **정기적인 비밀번호 업데이트**: 보안을 위해 주기적으로 변경
3. **환경별 설정 분리**: 개발/스테이징/프로덕션 환경별로 다른 설정 사용

## 현재 상태

✅ **정상 작동하는 기능:**
- Supabase 클라이언트 연결
- 모든 데이터베이스 작업 (CRUD)
- 애플리케이션 핵심 기능

❌ **문제가 있는 기능:**
- DATABASE_URL 직접 연결 (Drizzle ORM 직접 사용)

## 결론

현재 애플리케이션은 Supabase 클라이언트를 통해 정상적으로 작동하고 있으므로, 급하게 수정할 필요는 없습니다. 하지만 Drizzle ORM의 직접 연결을 사용하려면 DATABASE_URL을 업데이트해야 합니다.
