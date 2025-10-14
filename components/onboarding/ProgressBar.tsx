// components/onboarding/ProgressBar.tsx
// 온보딩 진행률 표시 컴포넌트
// Story 1.5: 신규 사용자 온보딩 플로우 구현
// 관련 파일: components/onboarding/OnboardingLayout.tsx

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* 진행률 텍스트 */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-700">
          단계 {currentStep} / {totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round(progress)}% 완료
        </span>
      </div>

      {/* 진행률 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 단계별 점 표시 */}
      <div className="flex justify-between mt-3">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index + 1 <= currentStep
                ? 'bg-blue-600 scale-110'
                : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

