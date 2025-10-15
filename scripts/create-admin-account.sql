-- ============================================
-- 관리자 계정 생성 SQL 스크립트
-- ============================================
-- 작성일: 2025-10-15
-- 설명: 관리자 계정을 생성하거나 기존 사용자를 관리자로 승격시키는 스크립트

-- ============================================
-- 방법 1: 기존 사용자를 관리자로 승격
-- ============================================
-- 사용 방법: 아래 쿼리에서 'your-email@example.com'을 실제 이메일로 변경

-- 사용자의 user_metadata에 role 추가
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE email = 'your-email@example.com';

-- 변경 확인 쿼리
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
WHERE email = 'your-email@example.com';


-- ============================================
-- 방법 2: 새 관리자 계정 생성 (Supabase Auth API 사용)
-- ============================================
-- 주의: 이 방법은 SQL로 직접 실행할 수 없습니다.
-- Supabase Dashboard의 Auth > Users에서 수동으로 생성하거나
-- Supabase Admin API를 사용하여 생성해야 합니다.

-- Supabase Dashboard에서 사용자 생성 후 위의 UPDATE 쿼리로 관리자 권한 부여

-- ============================================
-- 관리자 계정 생성 단계 (수동)
-- ============================================
-- 1. 회원가입 페이지에서 관리자 계정 생성
--    예: admin@yourdomain.com / 안전한비밀번호123!
-- 
-- 2. 이메일 인증 완료
-- 
-- 3. 위의 UPDATE 쿼리 실행하여 관리자 권한 부여
--    UPDATE auth.users
--    SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
--    WHERE email = 'admin@yourdomain.com';
-- 
-- 4. 로그인하면 자동으로 /admin/token-usage로 리다이렉트됨


-- ============================================
-- 모든 관리자 계정 조회
-- ============================================
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin'
ORDER BY created_at DESC;


-- ============================================
-- 관리자 권한 제거 (일반 사용자로 변경)
-- ============================================
-- 사용 방법: 아래 쿼리에서 이메일을 변경

UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'admin@yourdomain.com';


-- ============================================
-- 테스트용 관리자 계정 (개발 환경)
-- ============================================
-- 개발 환경에서 테스트용으로 사용할 이메일:
-- admin@test.com

-- 1단계: 애플리케이션에서 회원가입
-- 2단계: 아래 쿼리 실행하여 관리자 권한 부여

UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin", "onboarding_completed": true}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin", "onboarding_completed": true}'::jsonb
  END
WHERE email = 'admin@test.com';

-- 온보딩도 완료 처리하여 바로 대시보드 접근 가능하도록 설정


-- ============================================
-- 여러 사용자를 한번에 관리자로 승격
-- ============================================
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE email IN (
  'admin1@yourdomain.com',
  'admin2@yourdomain.com',
  'admin3@yourdomain.com'
);


-- ============================================
-- 보안 참고사항
-- ============================================
-- 1. 관리자 이메일은 안전하게 관리하세요
-- 2. 강력한 비밀번호를 사용하세요 (최소 12자, 영문/숫자/특수문자 조합)
-- 3. 정기적으로 관리자 계정 목록을 검토하세요
-- 4. 퇴사자나 권한이 불필요한 사용자의 관리자 권한은 즉시 제거하세요
-- 5. 프로덕션 환경에서는 테스트 계정을 사용하지 마세요

