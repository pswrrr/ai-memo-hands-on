// app/auth/reset-password/page.tsx
// 비밀번호 재설정 요청 페이지
// 사용자가 이메일을 입력하면 Supabase에서 재설정 링크를 전송합니다
// 관련 파일: components/auth/ResetPasswordRequestForm.tsx, lib/auth.ts

import ResetPasswordRequestForm from '@/components/auth/ResetPasswordRequestForm';

export default function ResetPasswordPage() {
  return <ResetPasswordRequestForm />;
}

