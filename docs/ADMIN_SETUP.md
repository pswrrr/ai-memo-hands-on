# 관리자 계정 설정 가이드

이 문서는 AI 메모장 애플리케이션에서 관리자 계정을 설정하고 관리하는 방법을 설명합니다.

## 📋 목차

1. [개요](#개요)
2. [관리자 계정 생성](#관리자-계정-생성)
3. [관리자 권한 부여](#관리자-권한-부여)
4. [관리자 대시보드 접속](#관리자-대시보드-접속)
5. [권한 관리](#권한-관리)
6. [보안 고려사항](#보안-고려사항)

## 개요

관리자 계정은 AI 토큰 사용량 모니터링 및 분석 대시보드에 접근할 수 있는 특별한 권한을 가진 계정입니다.

### 관리자 기능

- **AI 토큰 사용량 대시보드** (`/admin/token-usage`)
  - 전체 시스템의 토큰 사용량 모니터링
  - 사용자별 사용 통계 확인
  - 비용 분석 및 최적화 제안
  - 사용량 임계값 알림 관리

### 권한 시스템

- 사용자의 `user_metadata.role` 필드가 `"admin"`인 경우 관리자로 인식
- Middleware에서 `/admin` 경로 보호
- 클라이언트 및 서버 사이드에서 이중 권한 체크

## 관리자 계정 생성

### 방법 1: 기존 사용자를 관리자로 승격 (권장)

1. **일반 사용자 계정 생성**
   - 애플리케이션의 회원가입 페이지에서 계정 생성
   - 이메일: `admin@yourdomain.com` (원하는 이메일 사용)
   - 강력한 비밀번호 설정 (최소 12자, 영문/숫자/특수문자 조합)

2. **이메일 인증 완료**
   - Supabase에서 발송한 이메일 인증 링크 클릭

3. **관리자 권한 부여**
   - Supabase Dashboard > SQL Editor로 이동
   - 다음 SQL 쿼리 실행:

```sql
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin", "onboarding_completed": true}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin", "onboarding_completed": true}'::jsonb
  END
WHERE email = 'admin@yourdomain.com';
```

4. **권한 확인**

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = 'admin@yourdomain.com';
```

### 방법 2: 개발 환경에서 테스트 관리자 계정 생성

개발 및 테스트 환경에서는 다음 계정을 사용할 수 있습니다:

- **이메일**: `admin@test.com`
- **비밀번호**: 테스트용 비밀번호 설정

```sql
-- 테스트 계정을 관리자로 설정
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin", "onboarding_completed": true}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin", "onboarding_completed": true}'::jsonb
  END
WHERE email = 'admin@test.com';
```

## 관리자 권한 부여

### 단일 사용자 승격

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'user@example.com';
```

### 여러 사용자 동시 승격

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email IN (
  'admin1@yourdomain.com',
  'admin2@yourdomain.com',
  'admin3@yourdomain.com'
);
```

### 모든 관리자 계정 조회

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at DESC;
```

## 관리자 대시보드 접속

### 로그인 및 자동 리다이렉트

1. **로그인 페이지 접속**
   ```
   http://localhost:3000/auth/login
   ```

2. **관리자 계정으로 로그인**
   - 관리자 이메일과 비밀번호 입력
   - 로그인 성공 시 자동으로 `/admin/token-usage`로 리다이렉트

3. **일반 사용자 로그인**
   - 일반 사용자는 `/` (메인 페이지)로 리다이렉트

### 직접 URL 접속

관리자로 로그인한 상태에서:
```
http://localhost:3000/admin/token-usage
```

프로덕션 환경:
```
https://yourdomain.com/admin/token-usage
```

### 접근 제어

- **로그인하지 않은 사용자**: `/auth/login`으로 리다이렉트
- **일반 사용자**: `/dashboard`로 리다이렉트
- **관리자**: 대시보드 접근 허용

## 권한 관리

### 관리자 권한 제거 (일반 사용자로 변경)

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'user@example.com';
```

### 권한 확인 함수

애플리케이션 코드에서 관리자 권한 확인:

```typescript
import { isAdmin, checkUserIsAdmin } from '@/lib/auth';

// 현재 로그인한 사용자가 관리자인지 확인
const adminStatus = await isAdmin();

// 특정 user 객체가 관리자인지 확인
const isUserAdmin = checkUserIsAdmin(user);
```

## 보안 고려사항

### 1. 강력한 비밀번호 사용

- **최소 길이**: 12자 이상
- **복잡도**: 영문 대소문자, 숫자, 특수문자 포함
- **예시**: `MyStr0ng!P@ssw0rd2024`

### 2. 정기적인 계정 감사

```sql
-- 관리자 계정 목록 정기 확인
SELECT 
  email,
  created_at,
  last_sign_in_at,
  CASE 
    WHEN last_sign_in_at < NOW() - INTERVAL '30 days' THEN '⚠️ 장기 미사용'
    ELSE '✓ 정상'
  END as status
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY last_sign_in_at DESC NULLS LAST;
```

### 3. 즉시 권한 제거

퇴사자나 권한이 불필요한 사용자의 관리자 권한은 즉시 제거:

```sql
-- 특정 사용자의 관리자 권한 제거
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'former-admin@example.com';
```

### 4. 테스트 계정 관리

- **개발 환경**: 테스트 계정 사용 허용
- **프로덕션 환경**: 테스트 계정 절대 사용 금지
- 배포 전 테스트 계정 제거 확인

```sql
-- 프로덕션에서 테스트 계정 제거
DELETE FROM auth.users
WHERE email LIKE '%@test.com';
```

### 5. 접근 로그 모니터링

관리자 대시보드 접근 로그를 정기적으로 확인하여 의심스러운 활동 감지

### 6. 2단계 인증 (추후 구현 권장)

보안 강화를 위해 관리자 계정에 2FA(Two-Factor Authentication) 적용 고려

## 트러블슈팅

### 문제: 관리자로 로그인했는데 대시보드 접근 불가

**해결 방법**:

1. user_metadata 확인:
```sql
SELECT raw_user_meta_data 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

2. role이 정확히 "admin"인지 확인 (대소문자 구분)

3. 브라우저 캐시 및 쿠키 삭제 후 재로그인

### 문제: SQL 쿼리 실행 권한 없음

**해결 방법**:
- Supabase Dashboard > SQL Editor 사용
- 프로젝트 소유자 또는 관리자 계정으로 실행

### 문제: 로그인 후 무한 리다이렉트

**해결 방법**:

1. 세션 초기화:
```typescript
await supabase.auth.signOut();
```

2. 브라우저 개발자 도구에서 콘솔 로그 확인

3. middleware.ts의 리다이렉트 로직 확인

## 관련 파일

- **권한 관리**: `lib/auth.ts`
- **라우트 보호**: `middleware.ts`
- **로그인 처리**: `components/auth/LoginForm.tsx`
- **관리자 대시보드**: `app/admin/token-usage/page.tsx`
- **SQL 스크립트**: `scripts/create-admin-account.sql`
- **테스트**: `__tests__/admin-auth.test.ts`

## 추가 도움말

문제가 지속되거나 추가 지원이 필요한 경우, 다음을 확인하세요:

1. Supabase 프로젝트 설정
2. 환경 변수 (.env.local)
3. 데이터베이스 연결 상태
4. 애플리케이션 로그

---

**마지막 업데이트**: 2025-10-15
**버전**: 1.0

