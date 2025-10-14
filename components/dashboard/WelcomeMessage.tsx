// components/dashboard/WelcomeMessage.tsx
// 대시보드 환영 메시지 컴포넌트
// Story 1.5: 신규 사용자 온보딩 플로우 구현
// 관련 파일: app/dashboard/page.tsx

interface WelcomeMessageProps {
  user: {
    email?: string;
    user_metadata?: {
      onboarding_completed?: boolean;
      onboarding_step?: number;
    };
  };
}

export default function WelcomeMessage({ user }: WelcomeMessageProps) {
  const isNewUser = user.user_metadata?.onboarding_completed === true;
  const userEmail = user.email || '사용자';
  const displayName = userEmail.split('@')[0];

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            안녕하세요, {displayName}님! 👋
          </h2>
          <p className="text-blue-100">
            {isNewUser 
              ? '온보딩을 완료하셨네요! 이제 AI 메모장의 모든 기능을 사용할 수 있습니다.'
              : 'AI 메모장에 오신 것을 환영합니다! 음성과 텍스트로 메모하고 AI가 요약해드립니다.'
            }
          </p>
        </div>
        <div className="text-4xl">
          {isNewUser ? '🎉' : '✨'}
        </div>
      </div>
      
      {isNewUser && (
        <div className="mt-4 p-4 bg-white/10 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-400 mr-3">✅</div>
            <div>
              <h3 className="font-semibold">온보딩 완료!</h3>
              <p className="text-sm text-blue-100">
                이제 음성 메모, 텍스트 메모, AI 요약 기능을 모두 사용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

