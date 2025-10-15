// lib/auth.ts
// Supabase Auth ê´€??? í‹¸ë¦¬í‹° ?¨ìˆ˜?¤ì„ ?´ë‹¹?˜ëŠ” ?Œì¼
// ?Œì›ê°€?? ë¡œê·¸?? ë¡œê·¸?„ì›ƒ ?±ì˜ ?¸ì¦ ê¸°ëŠ¥???œê³µ?©ë‹ˆ??// ???Œì¼?€ ëª¨ë“  ?¸ì¦ ê´€??ì»´í¬?ŒíŠ¸?ì„œ ?¬ìš©?©ë‹ˆ??// ê´€???Œì¼: components/auth/SignupForm.tsx, components/auth/LoginForm.tsx, app/auth/signup/page.tsx

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

// ?Œì›ê°€???¨ìˆ˜
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    
    // ë¨¼ì? ?´ë‹¹ ?´ë©”?¼ì´ ?´ë? ì¡´ì¬?˜ëŠ”ì§€ ?•ì¸
    const { data: existingUsers } = await supabase
      .from('auth.users')
      .select('email')
      .eq('email', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Supabase ?Œì›ê°€???ëŸ¬:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }

    // Supabaseê°€ ?´ë©”???•ì¸ ?€ê¸?ì¤‘ì¸ ?„ì‹œ ?¬ìš©?ë? ?ì„±?˜ëŠ” ê²½ìš° ì²´í¬
    // identitiesê°€ ë¹„ì–´?ˆìœ¼ë©??´ë? ?±ë¡???´ë©”?¼ì¼ ê°€?¥ì„±???’ìŒ
    if (data.user && data.user.identities && data.user.identities.length === 0) {
        return {
        success: false,
        error: '?´ë? ?±ë¡???´ë©”?¼ì…?ˆë‹¤.',
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
    console.error('?Œì›ê°€???ˆì™¸:', error);
    return {
      success: false,
      error: '?Œì›ê°€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
    };
  }
}

// ë¡œê·¸???¨ìˆ˜
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });


    if (error) {
      console.error('ë¡œê·¸???ëŸ¬ ë°œìƒ:', error);
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
    console.error('?’¥ signIn ?¨ìˆ˜?ì„œ ?ˆì™¸ ë°œìƒ:', error);
    return {
      success: false,
      error: 'ë¡œê·¸??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
    };
  }
}

// ë¡œê·¸?„ì›ƒ ?¨ìˆ˜
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
      error: 'ë¡œê·¸?„ì›ƒ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
    };
  }
}

// ë¹„ë?ë²ˆí˜¸ ?¬ì„¤???”ì²­ ?¨ìˆ˜
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });


    if (error) {
      console.error('ë¹„ë?ë²ˆí˜¸ ?¬ì„¤???”ì²­ ?ëŸ¬ ë°œìƒ:', error);
      return {
        success: false,
        error: getAuthErrorMessage(error),
      };
    }


    return {
      success: true,
    };
  } catch (error) {
    console.error('?’¥ resetPassword ?¨ìˆ˜?ì„œ ?ˆì™¸ ë°œìƒ:', error);
    return {
      success: false,
      error: 'ë¹„ë?ë²ˆí˜¸ ?¬ì„¤??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
    };
  }
}

// ë¹„ë?ë²ˆí˜¸ ?…ë°?´íŠ¸ ?¨ìˆ˜
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });


    if (error) {
      console.error('ë¹„ë?ë²ˆí˜¸ ?…ë°?´íŠ¸ ?ëŸ¬ ë°œìƒ:', error);
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
    console.error('?’¥ updatePassword ?¨ìˆ˜?ì„œ ?ˆì™¸ ë°œìƒ:', error);
    return {
      success: false,
      error: 'ë¹„ë?ë²ˆí˜¸ ë³€ê²?ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.',
    };
  }
}

// ?„ì¬ ?¬ìš©???•ë³´ ê°€?¸ì˜¤ê¸?export async function getCurrentUser() {
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

// ?¸ì¦ ?íƒœ ë³€ê²?ê°ì?
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

// Supabase Auth ?ëŸ¬ ë©”ì‹œì§€ë¥??¬ìš©??ì¹œí™”?ì¸ ë©”ì‹œì§€ë¡?ë³€??function getAuthErrorMessage(error: AuthError): string {
  console.log('===== Supabase Auth Error =====');
  console.log('?ë³¸ ?ëŸ¬ ë©”ì‹œì§€:', error.message);
  console.log('?ëŸ¬ ì½”ë“œ:', error.status);
  console.log('?„ì²´ ?ëŸ¬ ê°ì²´:', error);
  console.log('==============================');
  
  // ?ëŸ¬ ë©”ì‹œì§€ë¥??Œë¬¸?ë¡œ ë³€?˜í•˜??ë§¤ì¹­
  const message = error.message.toLowerCase();
  
  // ì¤‘ë³µ ?´ë©”??ê´€???ëŸ¬??(???¬ê´„?ìœ¼ë¡?ì²´í¬)
  if (message.includes('user already registered') || 
      message.includes('email address is already registered') ||
      message.includes('user with this email already exists') ||
      message.includes('email already exists') ||
      message.includes('duplicate key') ||
      message.includes('already been registered') ||
      error.status === 422) {
    return '?´ë? ?±ë¡???´ë©”?¼ì…?ˆë‹¤.';
  }
  
  // ?´ë©”???•ì‹ ê´€???ëŸ¬??  if (message.includes('invalid email') || 
      message.includes('email format') ||
      message.includes('unable to validate email') ||
      message.includes('invalid email format')) {
    return '?¬ë°”ë¥??´ë©”???•ì‹???…ë ¥?´ì£¼?¸ìš”.';
  }
  
  // ë¹„ë?ë²ˆí˜¸ ê´€???ëŸ¬??  if (message.includes('password should be at least')) {
    return 'ë¹„ë?ë²ˆí˜¸??ìµœì†Œ 6???´ìƒ?´ì–´???©ë‹ˆ??';
  }
  
  if (message.includes('password is too weak')) {
    return 'ë¹„ë?ë²ˆí˜¸ê°€ ?ˆë¬´ ?½í•©?ˆë‹¤. ?ë¬¸, ?«ì, ?¹ìˆ˜ë¬¸ìë¥??¬í•¨?´ì£¼?¸ìš”.';
  }
  
  // ê¸°í? ?¸ì¦ ?ëŸ¬??  if (message.includes('invalid login credentials')) {
    return '?´ë©”???ëŠ” ë¹„ë?ë²ˆí˜¸ê°€ ?¬ë°”ë¥´ì? ?ŠìŠµ?ˆë‹¤.';
  }
  
  if (message.includes('email not confirmed')) {
    return '?´ë©”???¸ì¦???„ìš”?©ë‹ˆ??';
  }
  
  // ?¤íŠ¸?Œí¬ ?ëŸ¬
  if (message.includes('network') || message.includes('connection')) {
    return '?¤íŠ¸?Œí¬ ?°ê²°???•ì¸?´ì£¼?¸ìš”.';
  }
  
  // ê¸°ë³¸ ?ëŸ¬ ë©”ì‹œì§€ (?ë³¸ ë©”ì‹œì§€ê°€ ?ˆìœ¼ë©??¬ìš©, ?†ìœ¼ë©?ê¸°ë³¸ ë©”ì‹œì§€)
  return error.message || '?Œì›ê°€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.';
}
