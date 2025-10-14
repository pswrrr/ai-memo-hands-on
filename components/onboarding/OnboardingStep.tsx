// components/onboarding/OnboardingStep.tsx
// 온보딩 단계별 콘텐츠 컴포넌트
// Story 1.5: 신규 사용자 온보딩 플로우 구현
// 관련 파일: components/onboarding/OnboardingLayout.tsx

interface OnboardingStepProps {
  step: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export default function OnboardingStep({ step, onNext, onPrevious, onSkip }: OnboardingStepProps) {
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                AI 메모장에 오신 것을 환영합니다!
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                음성과 텍스트로 메모를 작성하고, AI가 자동으로 요약과 태그를 생성해주는 
                혁신적인 메모 앱입니다. 몇 가지 단계를 통해 주요 기능을 알아보세요.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🎤</div>
                <h3 className="font-semibold text-gray-900">음성 메모</h3>
                <p className="text-sm text-gray-600">음성으로 빠르게 메모 작성</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🤖</div>
                <h3 className="font-semibold text-gray-900">AI 요약</h3>
                <p className="text-sm text-gray-600">자동으로 핵심 내용 요약</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🏷️</div>
                <h3 className="font-semibold text-gray-900">자동 태깅</h3>
                <p className="text-sm text-gray-600">관련 태그 자동 생성</p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                음성 메모로 빠르게 기록하세요
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                마이크 버튼을 누르고 말씀하시면 자동으로 텍스트로 변환됩니다. 
                회의, 강의, 아이디어 캡처에 완벽합니다.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">음성 인식</h3>
                  <p className="text-sm text-gray-600">실시간 음성-텍스트 변환</p>
                </div>
              </div>
              <div className="text-center">
                <button className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition-colors">
                  🎤 음성 메모 시작
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-left p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">💡 사용 팁</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 조용한 환경에서 사용하세요</li>
                  <li>• 명확하고 천천히 말씀하세요</li>
                  <li>• 긴 문장도 자동으로 정리됩니다</li>
                </ul>
              </div>
              <div className="text-left p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">✨ 장점</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 키보드보다 3배 빠른 입력</li>
                  <li>• 이동 중에도 메모 가능</li>
                  <li>• 자연스러운 언어로 기록</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                AI가 자동으로 요약하고 태깅합니다
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                메모 작성 후 AI가 핵심 내용을 요약하고 관련 태그를 자동 생성합니다. 
                나중에 쉽게 찾을 수 있어요!
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">AI 처리 과정</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h4 className="font-medium text-gray-900">분석</h4>
                  <p className="text-sm text-gray-600">메모 내용 분석</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h4 className="font-medium text-gray-900">요약</h4>
                  <p className="text-sm text-gray-600">핵심 내용 추출</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h4 className="font-medium text-gray-900">태깅</h4>
                  <p className="text-sm text-gray-600">관련 태그 생성</p>
                </div>
              </div>
            </div>

            <div className="text-left bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">예시: 회의 메모</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">원본 메모:</span>
                  <p className="text-sm text-gray-600 mt-1">
                    &ldquo;오늘 팀 미팅에서 새로운 프로젝트 계획을 논의했습니다. 다음 주까지 기획서를 완성하고, 
                    개발팀과 협의하여 일정을 확정해야 합니다.&rdquo;
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">AI 요약:</span>
                  <p className="text-sm text-gray-600 mt-1">
                    • 새로운 프로젝트 계획 논의<br/>
                    • 기획서 완성 (다음 주까지)<br/>
                    • 개발팀과 일정 협의 필요
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">자동 태그:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">#프로젝트</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">#기획서</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">#일정</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-yellow-600 mr-3">💡</div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 mb-1">이제 첫 메모를 작성해보세요!</h4>
                  <p className="text-sm text-gray-600">
                    대시보드에서 음성 메모나 텍스트 메모를 시작할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      {renderStepContent()}
    </div>
  );
}
