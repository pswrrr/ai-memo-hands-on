// lib/onboarding.ts
// 온보딩 상태 관리 유틸리티 함수
// Story 1.5: 신규 사용자 온보딩 플로우 구현
// 관련 파일: app/onboarding/page.tsx, components/onboarding/OnboardingLayout.tsx

import { supabase } from './supabase';

export interface OnboardingStatus {
  step: number;
  completed: boolean;
}

/**
 * 온보딩 완료 상태 확인
 * @returns Promise<boolean> 온보딩 완료 여부
 */
export async function checkOnboardingStatus(): Promise<boolean> {
  try {
    console.log('🔍 [lib/onboarding.ts] 온보딩 상태 확인 시작');
    
    // 로컬 스토리지에서 먼저 확인
    if (typeof window !== 'undefined') {
      const localStatus = localStorage.getItem('onboarding_completed');
      if (localStatus === 'true') {
        console.log('✅ [lib/onboarding.ts] 로컬 스토리지에서 온보딩 완료 확인');
        return true;
      }
    }

    // Supabase에서 사용자 메타데이터 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ [lib/onboarding.ts] 사용자 정보 가져오기 실패:', userError);
      return false;
    }

    if (!user) {
      console.log('⚠️ [lib/onboarding.ts] 로그인되지 않은 사용자');
      return false;
    }

    const completed = user.user_metadata?.onboarding_completed === true;
    console.log(`📊 [lib/onboarding.ts] 온보딩 완료 상태: ${completed}`);
    
    return completed;
  } catch (error) {
    console.error('❌ [lib/onboarding.ts] 온보딩 상태 확인 중 오류:', error);
    return false;
  }
}

/**
 * 온보딩 상태 저장
 * @param step 현재 단계 (1-3)
 * @param completed 완료 여부
 * @returns Promise<boolean> 저장 성공 여부
 */
export async function saveOnboardingStatus(step: number, completed: boolean): Promise<boolean> {
  try {
    console.log(`💾 [lib/onboarding.ts] 온보딩 상태 저장 시작 - 단계: ${step}, 완료: ${completed}`);
    
    // 로컬 스토리지에 백업 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_completed', completed.toString());
      localStorage.setItem('onboarding_step', step.toString());
      console.log('✅ [lib/onboarding.ts] 로컬 스토리지에 백업 저장 완료');
    }

    // Supabase 사용자 메타데이터 업데이트
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ [lib/onboarding.ts] 사용자 정보 가져오기 실패:', userError);
      return false;
    }

    if (!user) {
      console.log('⚠️ [lib/onboarding.ts] 로그인되지 않은 사용자');
      return false;
    }

    // 사용자 메타데이터 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        onboarding_completed: completed,
        onboarding_step: step,
        onboarding_updated_at: new Date().toISOString()
      }
    });

    if (updateError) {
      console.error('❌ [lib/onboarding.ts] 온보딩 상태 저장 실패:', updateError);
      return false;
    }

    console.log('✅ [lib/onboarding.ts] 온보딩 상태 저장 완료');
    return true;
  } catch (error) {
    console.error('❌ [lib/onboarding.ts] 온보딩 상태 저장 중 오류:', error);
    return false;
  }
}

/**
 * 온보딩 진행 단계 가져오기
 * @returns Promise<number> 현재 단계 (1-3)
 */
export async function getOnboardingStep(): Promise<number> {
  try {
    console.log('🔍 [lib/onboarding.ts] 온보딩 단계 확인 시작');
    
    // 로컬 스토리지에서 먼저 확인
    if (typeof window !== 'undefined') {
      const localStep = localStorage.getItem('onboarding_step');
      if (localStep) {
        const step = parseInt(localStep, 10);
        console.log(`📊 [lib/onboarding.ts] 로컬 스토리지에서 단계 확인: ${step}`);
        return step;
      }
    }

    // Supabase에서 사용자 메타데이터 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('⚠️ [lib/onboarding.ts] 사용자 정보 없음, 기본 단계 1 반환');
      return 1;
    }

    const step = user.user_metadata?.onboarding_step || 1;
    console.log(`📊 [lib/onboarding.ts] 온보딩 단계: ${step}`);
    
    return step;
  } catch (error) {
    console.error('❌ [lib/onboarding.ts] 온보딩 단계 확인 중 오류:', error);
    return 1;
  }
}

/**
 * 온보딩 상태 초기화 (테스트용)
 * @returns Promise<boolean> 초기화 성공 여부
 */
export async function resetOnboardingStatus(): Promise<boolean> {
  try {
    console.log('🔄 [lib/onboarding.ts] 온보딩 상태 초기화 시작');
    
    // 로컬 스토리지 초기화
    if (typeof window !== 'undefined') {
      localStorage.removeItem('onboarding_completed');
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding');
      console.log('✅ [lib/onboarding.ts] 로컬 스토리지 초기화 완료');
    }

    // Supabase 사용자 메타데이터 초기화
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('⚠️ [lib/onboarding.ts] 사용자 정보 없음');
      return false;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        onboarding_completed: false,
        onboarding_step: 1,
        onboarding_updated_at: new Date().toISOString()
      }
    });

    if (updateError) {
      console.error('❌ [lib/onboarding.ts] 온보딩 상태 초기화 실패:', updateError);
      return false;
    }

    console.log('✅ [lib/onboarding.ts] 온보딩 상태 초기화 완료');
    return true;
  } catch (error) {
    console.error('❌ [lib/onboarding.ts] 온보딩 상태 초기화 중 오류:', error);
    return false;
  }
}

/**
 * 온보딩 상태를 로컬 스토리지에서 가져오기 (테스트용)
 * @returns 온보딩 상태 객체 또는 null
 */
export function getOnboardingStateFromStorage(): any {
  try {
    if (typeof window === 'undefined') return null;
    
    const stored = localStorage.getItem('onboarding');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('❌ [lib/onboarding.ts] 온보딩 상태 가져오기 실패:', error);
    return null;
  }
}

/**
 * 온보딩 상태를 로컬 스토리지에 저장 (테스트용)
 * @param state 온보딩 상태 객체
 * @returns 저장 성공 여부
 */
export function setOnboardingStateToStorage(state: any): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    localStorage.setItem('onboarding', JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('❌ [lib/onboarding.ts] 온보딩 상태 저장 실패:', error);
    return false;
  }
}

