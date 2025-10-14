// lib/auth.ts
// Supabase Auth 관련 유틸리티 함수들을 담당하는 파일
// 회원가입, 로그인, 로그아웃 등의 인증 기능을 제공합니다
// 이 파일은 모든 인증 관련 컴포넌트에서 사용됩니다
// 관련 파일: components/auth/SignupForm.tsx, components/auth/LoginForm.tsx, app/auth/signup/page.tsx

import { supabase } from './supabase';
import { AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: any;
}

// 회원가입 함수
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    console.log('회원가입 시도:', { email });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Supabase 회원가입 에러:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    console.log('회원가입 성공:', data.user);
    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    console.error('회원가입 예외:', error);
    return {
      success: false,
      error: '회원가입 중 오류가 발생했습니다.',
    };
  }
}

// 로그인 함수
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (error) {
    return {
      success: false,
      error: '로그인 중 오류가 발생했습니다.',
    };
  }
}

// 로그아웃 함수
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: '로그아웃 중 오류가 발생했습니다.',
    };
  }
}

// 현재 사용자 정보 가져오기
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// 인증 상태 변경 감지
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null);
  });
}

// Supabase Auth 에러 메시지를 사용자 친화적인 메시지로 변환
function getAuthErrorMessage(error: AuthError): string {
  console.log('원본 에러 메시지:', error.message);
  console.log('에러 코드:', error.status);
  
  // 에러 메시지를 소문자로 변환하여 매칭
  const message = error.message.toLowerCase();
  
  // 중복 이메일 관련 에러들 (더 포괄적으로 체크)
  if (message.includes('user already registered') || 
      message.includes('email address is already registered') ||
      message.includes('user with this email already exists') ||
      message.includes('email already exists') ||
      message.includes('duplicate key') ||
      message.includes('already been registered') ||
      error.status === 422) {
    return '이미 등록된 이메일입니다.';
  }
  
  // 이메일 형식 관련 에러들
  if (message.includes('invalid email') || 
      message.includes('email format') ||
      message.includes('unable to validate email') ||
      message.includes('invalid email format')) {
    return '올바른 이메일 형식을 입력해주세요.';
  }
  
  // 비밀번호 관련 에러들
  if (message.includes('password should be at least')) {
    return '비밀번호는 최소 6자 이상이어야 합니다.';
  }
  
  if (message.includes('password is too weak')) {
    return '비밀번호가 너무 약합니다. 영문, 숫자, 특수문자를 포함해주세요.';
  }
  
  // 기타 인증 에러들
  if (message.includes('invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  
  if (message.includes('email not confirmed')) {
    return '이메일 인증이 필요합니다.';
  }
  
  // 네트워크 에러
  if (message.includes('network') || message.includes('connection')) {
    return '네트워크 연결을 확인해주세요.';
  }
  
  // 기본 에러 메시지 (원본 메시지가 있으면 사용, 없으면 기본 메시지)
  return error.message || '회원가입 중 오류가 발생했습니다.';
}