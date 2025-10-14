// lib/supabase-server.ts
// 서버 사이드 Supabase 클라이언트 설정 파일
// 서버 액션과 API 라우트에서 사용할 관리자 권한 Supabase 클라이언트를 생성합니다
// 이 파일은 서버 사이드에서만 사용되며, RLS 정책을 우회할 수 있는 관리자 권한을 가집니다
// 관련 파일: app/actions/auth.ts, app/actions/notes.ts, lib/auth.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

