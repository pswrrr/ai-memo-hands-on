// components/auth/UpdatePasswordForm.tsx
// 새 비밀번호 설정 폼 컴포넌트
// 비밀번호 재설정 링크를 통해 접근한 사용자가 새 비밀번호를 설정합니다
// 관련 파일: lib/auth.ts, lib/validations.ts, app/auth/update-password/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { updatePassword } from '@/lib/auth';
import { validatePassword, validateConfirmPassword } from '@/lib/validations';

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasValidToken, setHasValidToken] = useState<boolean | null>(null);

  // URL에서 재설정 토큰 확인
  useEffect(() => {
    console.log('🔐 [UpdatePasswordForm] 컴포넌트 마운트');
    
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      
      console.log('현재 URL search:', window.location.search);
      console.log('현재 URL hash:', hash);
      
      // Supabase는 재설정 링크 클릭 시 ?code=... 또는 #access_token=... 형태로 토큰을 전달
      const hasCode = searchParams.has('code');
      const hasAccessToken = hash.includes('access_token=');
      const hasError = searchParams.has('error');
      
      console.log('code 파라미터 존재:', hasCode ? '✅ 있음' : '❌ 없음');
      console.log('access_token 존재:', hasAccessToken ? '✅ 있음' : '❌ 없음');
      console.log('error 파라미터 존재:', hasError ? '✅ 있음' : '❌ 없음');
      
      if (hasError) {
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');
        console.error('❌ 링크 에러:', errorCode, errorDescription);
        setSubmitError(
          errorCode === 'otp_expired' 
            ? '링크가 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.'
            : '유효하지 않은 링크입니다. 비밀번호 재설정을 다시 요청해주세요.'
        );
        setHasValidToken(false);
      } else if (hasCode || hasAccessToken) {
        console.log('✅ 유효한 재설정 토큰이 있습니다');
        setHasValidToken(true);
      } else {
        console.error('❌ 유효한 재설정 토큰이 없습니다');
        setSubmitError('유효하지 않거나 만료된 링크입니다. 비밀번호 재설정을 다시 요청해주세요.');
        setHasValidToken(false);
      }
    }
  }, []);

  // 입력 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 에러 메시지 초기화
    setErrors(prev => ({ ...prev, [name]: undefined }));
    setSubmitError('');
    setSuccessMessage('');

    // 실시간 유효성 검사
    if (name === 'password' && value) {
      const passwordValidation = validatePassword(value);
      if (!passwordValidation.isValid) {
        setErrors(prev => ({ ...prev, password: passwordValidation.message }));
      }
    }

    if (name === 'confirmPassword' && value && formData.password) {
      const matchValidation = validateConfirmPassword(formData.password, value);
      if (!matchValidation.isValid) {
        setErrors(prev => ({ ...prev, confirmPassword: matchValidation.message }));
      }
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== 비밀번호 변경 시작 ===');
    
    setIsLoading(true);
    setSubmitError('');
    setSuccessMessage('');

    // 전체 폼 유효성 검사
    const newErrors: FormErrors = {};

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message!;
    }

    const matchValidation = validateConfirmPassword(formData.password, formData.confirmPassword);
    if (!matchValidation.isValid) {
      newErrors.confirmPassword = matchValidation.message!;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      console.log('유효성 검증 실패:', newErrors);
      return;
    }

    try {
      console.log('updatePassword 함수 호출 직전');
      const result = await updatePassword(formData.password);
      console.log('updatePassword 함수 결과:', result);
      
      if (result.success) {
        console.log('✅ 비밀번호 변경 성공!');
        setSuccessMessage('비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.');
        
        // 2초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          console.log('🚀 로그인 페이지로 리다이렉트');
          router.push('/auth/login');
        }, 2000);
      } else {
        console.error('❌ 비밀번호 변경 실패:', result.error);
        setSubmitError(result.error || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 비밀번호 변경 예외 발생:', error);
      setSubmitError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      console.log('비밀번호 변경 처리 완료, 로딩 상태 해제');
      setIsLoading(false);
    }
  };

  // 토큰 확인 중
  if (hasValidToken === null) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <p className="text-center text-gray-600">확인 중...</p>
        </div>
      </div>
    );
  }

  // 유효하지 않은 토큰
  if (hasValidToken === false) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            비밀번호 재설정
          </h2>
          
          <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
            <p className="text-sm text-red-800">{submitError}</p>
          </div>

          <div className="text-center">
            <Link
              href="/auth/reset-password"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              비밀번호 재설정 다시 요청하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          새 비밀번호 설정
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 새 비밀번호 입력 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              새 비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="new-password"
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="새 비밀번호 입력"
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
            <p className="mt-1 text-xs text-gray-500">
              최소 8자, 영문, 숫자, 특수문자 포함
            </p>
          </div>

          {/* 비밀번호 확인 입력 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호 확인
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
                className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="비밀번호 재입력"
                disabled={isLoading}
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                } as React.CSSProperties}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 z-10"
                disabled={isLoading}
                aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* 에러 메시지 */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{submitError}</p>
            </div>
          )}

          {/* 비밀번호 변경 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !formData.password || !formData.confirmPassword}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading || !formData.password || !formData.confirmPassword
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? '변경 중...' : '비밀번호 변경'}
          </button>

          {/* 로그인 페이지로 돌아가기 */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              ← 로그인 페이지로 돌아가기
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

