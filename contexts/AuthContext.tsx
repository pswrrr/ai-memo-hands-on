// contexts/AuthContext.tsx
// 인증 상태 전역 관리 Context
// Story 1.6: 세션 상태 관리 구현
// 관련 파일: hooks/useAuth.ts, components/auth/SessionProvider.tsx

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 [AuthContext] AuthProvider 초기화');
    
    // 초기 세션 확인
    const getInitialSession = async () => {
      try {
        console.log('🔍 [AuthContext] 초기 세션 확인 시작');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AuthContext] 초기 세션 확인 실패:', error);
        } else {
          console.log('📊 [AuthContext] 초기 세션 상태:', session ? '로그인됨' : '로그아웃됨');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('❌ [AuthContext] 초기 세션 확인 중 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 세션 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AuthContext] 세션 상태 변경:', event, session ? '로그인됨' : '로그아웃됨');
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // 세션 만료 시 자동 로그아웃 처리
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          console.log('🔓 [AuthContext] 세션 만료 또는 갱신됨');
        }
      }
    );

    return () => {
      console.log('🧹 [AuthContext] AuthProvider 정리');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('🚪 [AuthContext] 로그아웃 시작');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [AuthContext] 로그아웃 실패:', error);
        throw error;
      }
      
      console.log('✅ [AuthContext] 로그아웃 완료');
    } catch (error) {
      console.error('❌ [AuthContext] 로그아웃 중 오류:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      console.log('🔄 [AuthContext] 세션 갱신 시작');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ [AuthContext] 세션 갱신 실패:', error);
        throw error;
      }
      
      console.log('✅ [AuthContext] 세션 갱신 완료');
      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('❌ [AuthContext] 세션 갱신 중 오류:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

