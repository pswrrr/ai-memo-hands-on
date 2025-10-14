// app/onboarding/page.tsx
// 신규 사용자 온보딩 페이지
// Story 1.5: 신규 사용자 온보딩 플로우 구현
// 관련 파일: components/onboarding/OnboardingLayout.tsx, lib/onboarding.ts

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import { checkOnboardingStatus, saveOnboardingStatus } from '@/lib/onboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // 온보딩 완료 상태 확인
        const completed = await checkOnboardingStatus();
        if (completed) {
          // 이미 온보딩을 완료한 경우 대시보드로 리다이렉트
          router.push('/dashboard');
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('온보딩 상태 확인 중 오류:', error);
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [router]);

  const handleStepChange = async (step: number) => {
    setCurrentStep(step);
    
    // 각 단계별 상태 저장
    try {
      await saveOnboardingStatus(step, false);
    } catch (error) {
      console.error('온보딩 상태 저장 중 오류:', error);
    }
  };

  const handleComplete = async () => {
    try {
      // 온보딩 완료 상태 저장
      await saveOnboardingStatus(3, true);
      setIsCompleted(true);
      
      // 2초 후 대시보드로 리다이렉트
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('온보딩 완료 처리 중 오류:', error);
    }
  };

  const handleSkip = async () => {
    try {
      // 온보딩 건너뛰기 처리
      await saveOnboardingStatus(3, true);
      router.push('/dashboard');
    } catch (error) {
      console.error('온보딩 건너뛰기 처리 중 오류:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">온보딩 준비 중...</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-600 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">온보딩 완료!</h1>
          <p className="text-gray-600">대시보드로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      onStepChange={handleStepChange}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}

