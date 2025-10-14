// lib/supabase.ts
// Supabase 클라이언트 설정 파일
// 클라이언트 사이드에서 사용할 Supabase 클라이언트를 생성합니다
// 이 파일은 프로젝트의 모든 클라이언트 사이드 컴포넌트에서 Supabase 인스턴스를 사용할 수 있도록 합니다
// 관련 파일: app/auth/signup/page.tsx, components/auth/SignupForm.tsx, lib/auth.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

