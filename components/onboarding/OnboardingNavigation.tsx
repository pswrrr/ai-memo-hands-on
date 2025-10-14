// components/onboarding/OnboardingNavigation.tsx
// 온보딩 네비게이션 컴포넌트
// Story 1.5: 신규 사용자 온보딩 플로우 구현
// 관련 파일: components/onboarding/OnboardingLayout.tsx

interface OnboardingNavigationProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export default function OnboardingNavigation({
  currentStep,
  onNext,
  onPrevious,
  onSkip
}: OnboardingNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 3;

  return (
    <div className="flex items-center justify-between">
      {/* 이전 버튼 */}
      <div>
        {!isFirstStep && (
          <button
            onClick={onPrevious}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            이전
          </button>
        )}
      </div>

      {/* 건너뛰기 버튼 */}
      <div>
        <button
          onClick={onSkip}
          className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          건너뛰기
        </button>
      </div>

      {/* 다음/완료 버튼 */}
      <div>
        <button
          onClick={onNext}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
            isLastStep
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isLastStep ? (
            <span className="flex items-center">
              완료하기
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span className="flex items-center">
              다음
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

