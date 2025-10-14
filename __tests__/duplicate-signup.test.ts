// __tests__/duplicate-signup.test.ts
// 중복 회원가입 체크 테스트를 담당하는 파일
// 이미 등록된 이메일로 회원가입을 시도할 때 적절한 에러 처리가 되는지 확인합니다
// 이 파일은 중복 회원가입 방지 기능을 검증합니다
// 관련 파일: lib/auth.ts, components/auth/SignupForm.tsx

import { signUp } from '@/lib/auth'

// Supabase 모킹
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
    },
  },
}))

import { supabase } from '@/lib/supabase'

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('중복 회원가입 체크', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('이미 등록된 이메일로 회원가입 시도 시 에러를 반환해야 함', async () => {
    // 중복 이메일 에러 시뮬레이션
    const duplicateEmailError = {
      message: 'User already registered',
      status: 422,
    }
    
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: duplicateEmailError,
    })

    const result = await signUp('pswrrr@gmail.com', 'Password123!')

    expect(result.success).toBe(false)
    expect(result.error).toBe('이미 등록된 이메일입니다.')
    expect(result.user).toBeUndefined()
  })

  test('다양한 중복 이메일 에러 메시지를 올바르게 처리해야 함', async () => {
    const duplicateErrorMessages = [
      'User already registered',
      'Email address is already registered',
      'User with this email already exists',
      'Email already exists',
    ]

    for (const errorMessage of duplicateErrorMessages) {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: errorMessage, status: 422 },
      })

      const result = await signUp('test@example.com', 'Password123!')

      expect(result.success).toBe(false)
      expect(result.error).toBe('이미 등록된 이메일입니다.')
    }
  })

  test('HTTP 422 상태 코드로 중복 이메일을 감지해야 함', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Some error', status: 422 },
    })

    const result = await signUp('test@example.com', 'Password123!')

    expect(result.success).toBe(false)
    expect(result.error).toBe('이미 등록된 이메일입니다.')
  })

  test('네트워크 에러 시 적절한 메시지를 반환해야 함', async () => {
    mockSupabase.auth.signUp.mockRejectedValue(new Error('Network error'))

    const result = await signUp('test@example.com', 'Password123!')

    expect(result.success).toBe(false)
    expect(result.error).toBe('회원가입 중 오류가 발생했습니다.')
  })

  test('성공적인 회원가입은 정상 처리되어야 함', async () => {
    const mockUser = { id: '123', email: 'newuser@example.com' }
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const result = await signUp('newuser@example.com', 'Password123!')

    expect(result.success).toBe(true)
    expect(result.user).toEqual(mockUser)
    expect(result.error).toBeUndefined()
  })
})
