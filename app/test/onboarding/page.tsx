'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { 
  getOnboardingStateFromStorage, 
  setOnboardingStateToStorage,
  resetOnboardingStatus 
} from '@/lib/onboarding';

export default function OnboardingTestPage() {
  const [onboardingState, setOnboardingState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 온보딩 상태 확인
  const checkOnboardingState = async () => {
    setIsLoading(true);
    try {
      const state = getOnboardingStateFromStorage();
      setOnboardingState(state);
    } catch (error) {
      console.error('온보딩 상태 확인 실패:', error);
      setOnboardingState(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 온보딩 상태 초기화
  const resetOnboarding = async () => {
    setIsLoading(true);
    try {
      await resetOnboardingStatus();
      setOnboardingState(null);
    } catch (error) {
      console.error('온보딩 상태 초기화 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 온보딩 시작 (테스트용)
  const startOnboarding = () => {
    const testState = {
      currentStep: 1,
      completed: false,
      startedAt: new Date().toISOString(),
      steps: {
        1: { completed: false, completedAt: null },
        2: { completed: false, completedAt: null },
        3: { completed: false, completedAt: null }
      }
    };
    setOnboardingStateToStorage(testState);
    setOnboardingState(testState);
  };

  // 온보딩 완료 (테스트용)
  const completeOnboarding = () => {
    const completedState = {
      currentStep: 3,
      completed: true,
      startedAt: onboardingState?.startedAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      steps: {
        1: { completed: true, completedAt: new Date().toISOString() },
        2: { completed: true, completedAt: new Date().toISOString() },
        3: { completed: true, completedAt: new Date().toISOString() }
      }
    };
    setOnboardingStateToStorage(completedState);
    setOnboardingState(completedState);
  };

  // 온보딩 페이지로 이동
  const goToOnboarding = () => {
    window.location.href = '/onboarding';
  };

  useEffect(() => {
    checkOnboardingState();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">온보딩 테스트 페이지</h1>
          <p className="text-gray-600">온보딩 플로우를 독립적으로 테스트할 수 있는 페이지입니다.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 현재 온보딩 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                현재 온보딩 상태
              </CardTitle>
              <CardDescription>
                로컬 스토리지에 저장된 온보딩 상태를 확인합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">상태 확인 중...</p>
                </div>
              ) : onboardingState ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={onboardingState.completed ? "default" : "secondary"}>
                      {onboardingState.completed ? "완료됨" : "진행 중"}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      단계 {onboardingState.currentStep}/3
                    </span>
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <p><strong>시작 시간:</strong> {new Date(onboardingState.startedAt).toLocaleString()}</p>
                    {onboardingState.completedAt && (
                      <p><strong>완료 시간:</strong> {new Date(onboardingState.completedAt).toLocaleString()}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">단계별 완료 상태:</h4>
                    {Object.entries(onboardingState.steps).map(([step, data]: [string, any]) => (
                      <div key={step} className="flex items-center gap-2 text-sm">
                        <span>단계 {step}:</span>
                        {data.completed ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={data.completed ? "text-green-600" : "text-gray-500"}>
                          {data.completed ? "완료" : "미완료"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <XCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">온보딩 상태가 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 테스트 컨트롤 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                테스트 컨트롤
              </CardTitle>
              <CardDescription>
                온보딩 상태를 조작하여 테스트할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Button 
                  onClick={startOnboarding}
                  className="w-full"
                  variant="outline"
                >
                  온보딩 시작 (테스트)
                </Button>
                
                <Button 
                  onClick={completeOnboarding}
                  className="w-full"
                  variant="outline"
                  disabled={!onboardingState}
                >
                  온보딩 완료 (테스트)
                </Button>
                
                <Button 
                  onClick={resetOnboarding}
                  className="w-full"
                  variant="destructive"
                >
                  온보딩 상태 초기화
                </Button>
              </div>

              <div className="border-t pt-4">
                <Button 
                  onClick={goToOnboarding}
                  className="w-full"
                  disabled={!onboardingState}
                >
                  실제 온보딩 페이지로 이동
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 테스트 시나리오 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>테스트 시나리오</CardTitle>
            <CardDescription>
              온보딩 플로우를 테스트하는 방법을 안내합니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">시나리오 1: 새로운 사용자 온보딩</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>"온보딩 상태 초기화" 버튼 클릭</li>
                  <li>"온보딩 시작 (테스트)" 버튼 클릭</li>
                  <li>"실제 온보딩 페이지로 이동" 버튼 클릭</li>
                  <li>온보딩 플로우 진행 확인</li>
                </ol>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">시나리오 2: 온보딩 완료된 사용자</h4>
                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                  <li>"온보딩 완료 (테스트)" 버튼 클릭</li>
                  <li>대시보드로 자동 리다이렉트 확인</li>
                  <li>온보딩이 다시 나타나지 않는지 확인</li>
                </ol>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">시나리오 3: 온보딩 중단 및 재시작</h4>
                <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                  <li>"온보딩 시작 (테스트)" 버튼 클릭</li>
                  <li>온보딩 페이지에서 중간에 나가기</li>
                  <li>다시 접속 시 온보딩이 계속되는지 확인</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 현재 상태 새로고침 */}
        <div className="mt-6 text-center">
          <Button 
            onClick={checkOnboardingState}
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? "확인 중..." : "상태 새로고침"}
          </Button>
        </div>
      </div>
    </div>
  );
}
