// components/auth/ResetPasswordRequestForm.tsx
// 비밀번호 재설정 요청 폼 컴포넌트
// 이메일을 입력받아 Supabase Auth로 재설정 링크를 전송합니다
// 관련 파일: lib/auth.ts, lib/validations.ts, app/auth/reset-password/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/lib/auth';
import { validateEmail } from '@/lib/validations';

export default function ResetPasswordRequestForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 이메일 입력 핸들러
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');
    setSubmitError('');
    setSuccessMessage('');
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== 비밀번호 재설정 요청 시작 ===');
    console.log('입력된 이메일:', email);
    
    setIsLoading(true);
    setSubmitError('');
    setSuccessMessage('');

    // 이메일 유효성 검사
    const emailValidation = validateEmail(email);
    console.log('이메일 유효성 검증 결과:', emailValidation);
    
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message!);
      setIsLoading(false);
      console.log('이메일 유효성 검증 실패:', emailValidation.message);
      return;
    }

    try {
      console.log('resetPassword 함수 호출 직전');
      const result = await resetPassword(email);
      console.log('resetPassword 함수 결과:', result);
      
      if (result.success) {
        console.log('✅ 비밀번호 재설정 이메일 전송 성공!');
        setSuccessMessage(
          '비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.'
        );
        setEmail(''); // 폼 초기화
      } else {
        console.error('❌ 비밀번호 재설정 실패:', result.error);
        setSubmitError(result.error || '비밀번호 재설정 요청에 실패했습니다.');
      }
    } catch (error) {
      console.error('💥 비밀번호 재설정 예외 발생:', error);
      setSubmitError('비밀번호 재설정 중 오류가 발생했습니다.');
    } finally {
      console.log('비밀번호 재설정 처리 완료, 로딩 상태 해제');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          비밀번호 재설정
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 입력 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일 주소
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleEmailChange}
              autoComplete="email"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                emailError ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="이메일 주소 입력"
              disabled={isLoading}
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
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

          {/* 재설정 링크 전송 버튼 */}
          <button
            type="submit"
            disabled={isLoading || !email}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading || !email
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? '전송 중...' : '재설정 링크 전송'}
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

