// app/auth/update-password/page.tsx
// 새 비밀번호 설정 페이지
// 비밀번호 재설정 이메일의 링크를 통해 접근하는 페이지
// 관련 파일: components/auth/UpdatePasswordForm.tsx, lib/auth.ts

import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm';

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}

