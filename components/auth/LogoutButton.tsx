// components/auth/LogoutButton.tsx
// 로그아웃 버튼 컴포넌트를 담당하는 파일
// 사용자가 로그아웃할 수 있는 버튼을 제공합니다
// 로그아웃 처리 중 로딩 상태를 표시합니다
// 관련 파일: lib/auth.ts, app/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  showIcon?: boolean;
  className?: string;
}

export default function LogoutButton({ 
  variant = 'default', 
  showIcon = true,
  className = ''
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      const result = await signOut();

      if (result.success) {
        // 로그아웃 성공 시 로그인 페이지로 리다이렉트
        router.push('/auth/login');
        // 페이지 새로고침하여 세션 상태 완전히 초기화
        router.refresh();
      } else {
        console.error('로그아웃 에러:', result.error);
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('로그아웃 예외:', error);
      alert('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const variantStyles = {
    default: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'border border-red-600 text-red-600 hover:bg-red-50',
    ghost: 'text-red-600 hover:bg-red-50',
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-red-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
      aria-label="로그아웃"
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {isLoading ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
}
