// lib/auth.ts
// Supabase Auth 관???�틸리티 ?�수?�을 ?�당?�는 ?�일
// ?�원가?? 로그?? 로그?�웃 ?�의 ?�증 기능???�공?�니??// ???�일?� 모든 ?�증 관??컴포?�트?�서 ?�용?�니??// 관???�일: components/auth/SignupForm.tsx, components/auth/LoginForm.tsx, app/auth/signup/page.tsx

import { supabase } from './supabase';
import { AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    [key: string]: unknown;
  };
}

// ?�원가???�수
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    
    // 먼�? ?�당 ?�메?�이 ?��? 존재?�는지 ?�인
    const { data: existingUsers } = await supabase
      .from('auth.users')
      .select('email')
      .eq('email', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Supabase ?�원가???�러:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    // Supabase가 ?�메???�인 ?��?중인 ?�시 ?�용?��? ?�성?�는 경우 체크
    // identities가 비어?�으�??��? ?�록???�메?�일 가?�성???�음
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        return {
        success: false,
        error: '?��? ?�록???�메?�입?�다.',
      };
    }

    return {
      success: true,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email || '',
      } : undefined,
    };
  } catch (error) {
    console.error('?�원가???�외:', error);
    return {
      success: false,
      error: '?�원가??�??�류가 발생?�습?�다.',
    };
  }
}

// 로그???�수
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });


    if (error) {
      console.error('로그???�러 발생:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }


    return {
      success: true,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email || '',
      } : undefined,
    };
  } catch (error) {
    console.error('?�� signIn ?�수?�서 ?�외 발생:', error);
    return {
      success: false,
      error: '로그??�??�류가 발생?�습?�다.',
    };
  }
}

// 로그?�웃 ?�수
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
      error: '로그?�웃 �??�류가 발생?�습?�다.',
    };
  }
}

// 비�?번호 ?�설???�청 ?�수
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });


    if (error) {
      console.error('비�?번호 ?�설???�청 ?�러 발생:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }


    return {
      success: true,
    };
  } catch (error) {
    console.error('?�� resetPassword ?�수?�서 ?�외 발생:', error);
    return {
      success: false,
      error: '비�?번호 ?�설??�??�류가 발생?�습?�다.',
    };
  }
}

// 비�?번호 ?�데?�트 ?�수
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });


    if (error) {
      console.error('비�?번호 ?�데?�트 ?�러 발생:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }


    return {
      success: true,
      user: data.user ? {
        id: data.user.id,
        email: data.user.email || '',
      } : undefined,
    };
  } catch (error) {
    console.error('?�� updatePassword ?�수?�서 ?�외 발생:', error);
    return {
      success: false,
      error: '비�?번호 변�?�??�류가 발생?�습?�다.',
    };
  }
}

// ?�재 ?�용???�보 가?�오�?export async function getCurrentUser() {
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

// ?�증 ?�태 변�?감�?
export function onAuthStateChange(callback: (user: { id: string; email: string; [key: string]: unknown } | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
      });
    } else {
      callback(null);
    }
  });
}

// Supabase Auth ?�러 메시지�??�용??친화?�인 메시지�?변??function getAuthErrorMessage(error: AuthError): string {
  console.log('===== Supabase Auth Error =====');
  console.log('?�본 ?�러 메시지:', error.message);
  console.log('?�러 코드:', error.status);
  console.log('?�체 ?�러 객체:', error);
  console.log('==============================');
  
  // ?�러 메시지�??�문?�로 변?�하??매칭
  const message = error.message.toLowerCase();
  
  // 중복 ?�메??관???�러??(???�괄?�으�?체크)
  if (message.includes('user already registered') || 
      message.includes('email address is already registered') ||
      message.includes('user with this email already exists') ||
      message.includes('email already exists') ||
      message.includes('duplicate key') ||
      message.includes('already been registered') ||
      error.status === 422) {
    return '?��? ?�록???�메?�입?�다.';
  }
  
  // ?�메???�식 관???�러??  if (message.includes('invalid email') || 
      message.includes('email format') ||
      message.includes('unable to validate email') ||
      message.includes('invalid email format')) {
    return '?�바�??�메???�식???�력?�주?�요.';
  }
  
  // 비�?번호 관???�러??  if (message.includes('password should be at least')) {
    return '비�?번호??최소 6???�상?�어???�니??';
  }
  
  if (message.includes('password is too weak')) {
    return '비�?번호가 ?�무 ?�합?�다. ?�문, ?�자, ?�수문자�??�함?�주?�요.';
  }
  
  // 기�? ?�증 ?�러??  if (message.includes('invalid login credentials')) {
    return '?�메???�는 비�?번호가 ?�바르�? ?�습?�다.';
  }
  
  if (message.includes('email not confirmed')) {
    return '?�메???�증???�요?�니??';
  }
  
  // ?�트?�크 ?�러
  if (message.includes('network') || message.includes('connection')) {
    return '?�트?�크 ?�결???�인?�주?�요.';
  }
  
  // 기본 ?�러 메시지 (?�본 메시지가 ?�으�??�용, ?�으�?기본 메시지)
  return error.message || '?�원가??�??�류가 발생?�습?�다.';
}
