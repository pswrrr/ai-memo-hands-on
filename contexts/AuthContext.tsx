// contexts/AuthContext.tsx
// ?�증 ?�태 ?�역 관�?Context
// Story 1.6: ?�션 ?�태 관�?구현
// 관???�일: hooks/useAuth.ts, components/auth/SessionProvider.tsx

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
    
    // 초기 ?�션 ?�인
    const getInitialSession = async () => {
      try {
            const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('??[AuthContext] 초기 ?�션 ?�인 ?�패:', error);
        } else {
                setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('??[AuthContext] 초기 ?�션 ?�인 �??�류:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // ?�션 ?�태 변�?리스??
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
            
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // ?�션 만료 ???�동 로그?�웃 처리
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
              }
      }
    );

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('??[AuthContext] 로그?�웃 ?�패:', error);
        throw error;
      }
      
      } catch (error) {
      console.error('??[AuthContext] 로그?�웃 �??�류:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('??[AuthContext] ?�션 갱신 ?�패:', error);
        throw error;
      }
      
        setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('??[AuthContext] ?�션 갱신 �??�류:', error);
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


