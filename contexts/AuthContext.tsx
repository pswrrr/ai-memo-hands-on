// contexts/AuthContext.tsx
// ?¸ì¦ ?íƒœ ?„ì—­ ê´€ë¦?Context
// Story 1.6: ?¸ì…˜ ?íƒœ ê´€ë¦?êµ¬í˜„
// ê´€???Œì¼: hooks/useAuth.ts, components/auth/SessionProvider.tsx

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
    
    // ì´ˆê¸° ?¸ì…˜ ?•ì¸
    const getInitialSession = async () => {
      try {
            const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('??[AuthContext] ì´ˆê¸° ?¸ì…˜ ?•ì¸ ?¤íŒ¨:', error);
        } else {
                setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('??[AuthContext] ì´ˆê¸° ?¸ì…˜ ?•ì¸ ì¤??¤ë¥˜:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // ?¸ì…˜ ?íƒœ ë³€ê²?ë¦¬ìŠ¤??
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
            
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // ?¸ì…˜ ë§Œë£Œ ???ë™ ë¡œê·¸?„ì›ƒ ì²˜ë¦¬
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
        console.error('??[AuthContext] ë¡œê·¸?„ì›ƒ ?¤íŒ¨:', error);
        throw error;
      }
      
      } catch (error) {
      console.error('??[AuthContext] ë¡œê·¸?„ì›ƒ ì¤??¤ë¥˜:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('??[AuthContext] ?¸ì…˜ ê°±ì‹  ?¤íŒ¨:', error);
        throw error;
      }
      
        setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('??[AuthContext] ?¸ì…˜ ê°±ì‹  ì¤??¤ë¥˜:', error);
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


