# Vercel 배포 가이드

## 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 1. Vercel 대시보드 접속
1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택
3. Settings > Environment Variables 이동

### 2. 필수 환경 변수 설정

다음 환경 변수들을 **모든 환경** (Production, Preview, Development)에 설정:


### 3. 환경 변수 설정 방법

1. **Name**: 환경 변수 이름 입력
2. **Value**: 환경 변수 값 입력
3. **Environment**: 모든 환경 선택 (Production, Preview, Development)
4. **Add** 버튼 클릭

### 4. 설정 후 재배포

환경 변수 설정 후:
1. **Redeploy** 버튼 클릭하여 재배포
2. 또는 새로운 커밋을 푸시하여 자동 재배포

## 문제 해결

### "supabaseUrl is required" 오류
- `NEXT_PUBLIC_SUPABASE_URL` 환경 변수가 설정되지 않았습니다
- Vercel 대시보드에서 환경 변수를 확인하고 재설정하세요

### "Supabase 환경 변수가 설정되지 않았습니다" 오류
- 모든 Supabase 관련 환경 변수가 설정되었는지 확인
- 환경 변수 이름과 값이 정확한지 확인
- 재배포 후에도 문제가 지속되면 Vercel 로그를 확인

### 데이터베이스 연결 오류
- `DATABASE_URL`이 올바르게 설정되었는지 확인
- Supabase 대시보드에서 데이터베이스 비밀번호가 변경되지 않았는지 확인

## 배포 확인

배포 성공 후:
1. 도메인 접속하여 애플리케이션 로드 확인
2. 로그인/회원가입 기능 테스트
3. 노트 생성/조회/삭제 기능 테스트
4. 데이터베이스 연결 상태 확인

## 보안 주의사항

- `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용되는 민감한 키입니다
- `GEMINI_API_KEY`는 AI 기능에 필요한 API 키입니다
- 이 키들이 클라이언트에 노출되지 않도록 주의하세요
