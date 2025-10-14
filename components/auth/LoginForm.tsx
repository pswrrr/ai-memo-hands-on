// components/auth/LoginForm.tsx
// 로그인 폼 컴포넌트를 담당하는 파일
// 사용자가 이메일과 비밀번호로 로그인할 수 있는 폼을 제공합니다
// 실시간 유효성 검사와 에러 처리를 포함합니다
// 관련 파일: app/auth/login/page.tsx, lib/validations.ts, lib/auth.ts

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from '@/lib/auth';
import { validateLoginForm, type LoginFormData } from '@/lib/validations';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // 실시간 유효성 검사
    if (name === 'email' || name === 'password') {
      const validation = validateLoginForm({
        ...formData,
        [name]: value,
      });

      if (!validation.isValid && validation.errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: validation.errors[name],
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    // 제출 에러 및 성공 메시지 초기화
    if (submitError) {
      setSubmitError('');
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== 로그인 시작 ===');
    console.log('입력된 이메일:', formData.email);
    
    setIsLoading(true);
    setSubmitError('');
    setSuccessMessage('');

    // 전체 폼 유효성 검사
    const validation = validateLoginForm(formData);
    console.log('유효성 검증 결과:', validation);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsLoading(false);
      console.log('유효성 검증 실패:', validation.errors);
      return;
    }

    try {
      console.log('signIn 함수 호출 직전');
      const result = await signIn(formData.email, formData.password);
      console.log('signIn 함수 결과:', result);
      console.log('result.success:', result.success);
      console.log('result.error:', result.error);
      console.log('result.user:', result.user);
      
      if (result.success) {
        console.log('✅ 로그인 성공!');
        // 로그인 성공 메시지 표시
        setSuccessMessage('로그인 성공! 잠시 후 메인 페이지로 이동합니다.');
        
        // 1초 후 메인 페이지로 리다이렉트
        setTimeout(() => {
          console.log('🚀 메인 페이지로 리다이렉트 실행');
          console.log('현재 URL:', window.location.href);
          // window.location을 사용하여 강제로 페이지 전체를 새로고침
          window.location.href = '/';
        }, 1000);
      } else {
        console.error('❌ 로그인 실패:', result.error);
        setSubmitError(result.error || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 로그인 예외 발생:', error);
      setSubmitError('로그인 중 오류가 발생했습니다.');
    } finally {
      console.log('로그인 처리 완료, 로딩 상태 해제');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          로그인
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 입력 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="example@email.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="current-password"
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="비밀번호 입력"
                disabled={isLoading}
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10"
                disabled={isLoading}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* 제출 에러 메시지 */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{submitError}</p>
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md font-medium ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            } text-white transition-colors`}
          >
            {isLoading ? '처리 중...' : '로그인'}
          </button>
        </form>

        {/* 비밀번호 찾기 및 회원가입 링크 */}
        <div className="mt-6 space-y-2 text-center">
          <div>
            <Link
              href="/auth/reset-password"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
          <p className="text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link
              href="/auth/signup"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
