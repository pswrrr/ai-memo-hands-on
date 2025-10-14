// app/auth/signup/page.tsx
// 회원가입 페이지를 담당하는 파일
// 사용자가 이메일과 비밀번호로 회원가입할 수 있는 페이지를 제공합니다
// Next.js App Router를 사용하여 구현되었습니다
// 관련 파일: components/auth/SignupForm.tsx, components/auth/AuthLayout.tsx

import AuthLayout from '@/components/auth/AuthLayout';
import SignupForm from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <AuthLayout
      title="회원가입"
      subtitle="AI 메모장에 오신 것을 환영합니다"
    >
      <SignupForm />
    </AuthLayout>
  );
}
