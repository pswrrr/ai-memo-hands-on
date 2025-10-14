// app/auth/login/page.tsx
// 로그인 페이지를 담당하는 파일
// 사용자가 이메일과 비밀번호로 로그인할 수 있는 페이지를 제공합니다
// Next.js App Router를 사용하여 구현되었습니다
// 관련 파일: components/auth/LoginForm.tsx, components/auth/AuthLayout.tsx

import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="로그인"
      subtitle="AI 메모장에 로그인하여 메모를 관리하세요"
    >
      <LoginForm />
    </AuthLayout>
  );
}
