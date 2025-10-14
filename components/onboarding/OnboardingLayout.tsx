// components/onboarding/OnboardingLayout.tsx
// 온보딩 메인 레이아웃 컴포넌트
// Story 1.5: 신규 사용자 온보딩 플로우 구현
// 관련 파일: components/onboarding/OnboardingStep.tsx, components/onboarding/ProgressBar.tsx

'use client';

import { useState } from 'react';
import OnboardingStep from './OnboardingStep';
import ProgressBar from './ProgressBar';
import OnboardingNavigation from './OnboardingNavigation';

interface OnboardingLayoutProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingLayout({
  currentStep,
  onStepChange,
  onComplete,
  onSkip
}: OnboardingLayoutProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNext = () => {
    if (currentStep < 3) {
      setIsTransitioning(true);
      setTimeout(() => {
        onStepChange(currentStep + 1);
        setIsTransitioning(false);
      }, 300);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        onStepChange(currentStep - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 온보딩 카드 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">
                AI 메모장에 오신 것을 환영합니다! 🎉
              </h1>
              <p className="text-blue-100">
                몇 가지 단계를 통해 주요 기능을 알아보세요
              </p>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="px-8 py-6">
            <ProgressBar currentStep={currentStep} totalSteps={3} />
          </div>

          {/* 단계별 콘텐츠 */}
          <div className="px-8 pb-8">
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
              <OnboardingStep 
                step={currentStep}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSkip={handleSkip}
              />
            </div>
          </div>

          {/* 네비게이션 */}
          <div className="border-t border-gray-200 px-8 py-6">
            <OnboardingNavigation
              currentStep={currentStep}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSkip={handleSkip}
            />
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            언제든지 건너뛸 수 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}

