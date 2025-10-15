-- ============================================
-- admin@gmail.com 계정을 관리자로 설정
-- ============================================
-- 실행 시점: admin@gmail.com 계정 회원가입 완료 후

-- 1. 현재 계정 상태 확인
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as current_role,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'admin@gmail.com';

-- 2. 관리자 권한 부여 (온보딩도 완료 처리)
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin", "onboarding_completed": true}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin", "onboarding_completed": true}'::jsonb
  END
WHERE email = 'admin@gmail.com';

-- 3. 변경 확인
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'onboarding_completed' as onboarding_completed,
  email_confirmed_at,
  created_at,
  updated_at
FROM auth.users
WHERE email = 'admin@gmail.com';

-- ✅ 완료!
-- 이제 admin@gmail.com 계정으로 로그인하면
-- 자동으로 /admin/token-usage 페이지로 리다이렉트됩니다.

