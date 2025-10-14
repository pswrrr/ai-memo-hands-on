// __tests__/validations.test.ts
// 유효성 검사 함수들의 단위 테스트를 담당하는 파일
// 이메일, 비밀번호, 비밀번호 확인 검증 로직을 테스트합니다
// 이 파일은 lib/validations.ts의 모든 함수를 검증합니다
// 관련 파일: lib/validations.ts, components/auth/SignupForm.tsx

import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateSignupForm,
  type SignupFormData,
} from '@/lib/validations'

describe('validateEmail', () => {
  test('유효한 이메일을 통과시켜야 함', () => {
    const validEmails = [
      'test@example.com',
      'user.name@domain.co.kr',
      'test+tag@gmail.com',
      'user123@company.org',
    ]

    validEmails.forEach(email => {
      const result = validateEmail(email)
      expect(result.isValid).toBe(true)
      expect(result.message).toBeUndefined()
    })
  })

  test('빈 이메일을 거부해야 함', () => {
    const result = validateEmail('')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('이메일을 입력해주세요.')
  })

  test('잘못된 형식의 이메일을 거부해야 함', () => {
    const invalidEmails = [
      'test',
      'test@',
      '@example.com',
      'test @example.com',
      'test@example .com',
    ]

    invalidEmails.forEach(email => {
      const result = validateEmail(email)
      expect(result.isValid).toBe(false)
      expect(result.message).toBe('올바른 이메일 형식을 입력해주세요.')
    })
  })

  test('너무 긴 이메일을 거부해야 함', () => {
    const longEmail = 'a'.repeat(250) + '@example.com'
    const result = validateEmail(longEmail)
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('이메일이 너무 깁니다.')
  })

  test('로컬 부분이 너무 긴 이메일을 거부해야 함', () => {
    const longLocalPart = 'a'.repeat(65) + '@example.com'
    const result = validateEmail(longLocalPart)
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('이메일 로컬 부분이 너무 깁니다.')
  })
})

describe('validatePassword', () => {
  test('유효한 비밀번호를 통과시켜야 함', () => {
    const validPasswords = [
      'Password123!',
      'MyPass@2024',
      'Test123#',
      'SecureP@ss1',
    ]

    validPasswords.forEach(password => {
      const result = validatePassword(password)
      expect(result.isValid).toBe(true)
      expect(result.message).toBeUndefined()
    })
  })

  test('빈 비밀번호를 거부해야 함', () => {
    const result = validatePassword('')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('비밀번호를 입력해주세요.')
  })

  test('너무 짧은 비밀번호를 거부해야 함', () => {
    const result = validatePassword('Pass1!')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('비밀번호는 최소 8자 이상이어야 합니다.')
  })

  test('영문이 없는 비밀번호를 거부해야 함', () => {
    const result = validatePassword('12345678!')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.')
  })

  test('숫자가 없는 비밀번호를 거부해야 함', () => {
    const result = validatePassword('Password!')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.')
  })

  test('특수문자가 없는 비밀번호를 거부해야 함', () => {
    const result = validatePassword('Password123')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.')
  })
})

describe('validateConfirmPassword', () => {
  test('일치하는 비밀번호를 통과시켜야 함', () => {
    const password = 'Password123!'
    const confirmPassword = 'Password123!'
    const result = validateConfirmPassword(password, confirmPassword)
    expect(result.isValid).toBe(true)
    expect(result.message).toBeUndefined()
  })

  test('빈 비밀번호 확인을 거부해야 함', () => {
    const result = validateConfirmPassword('Password123!', '')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('비밀번호 확인을 입력해주세요.')
  })

  test('불일치하는 비밀번호를 거부해야 함', () => {
    const result = validateConfirmPassword('Password123!', 'Password456!')
    expect(result.isValid).toBe(false)
    expect(result.message).toBe('비밀번호가 일치하지 않습니다.')
  })
})

describe('validateSignupForm', () => {
  test('유효한 폼 데이터를 통과시켜야 함', () => {
    const validFormData: SignupFormData = {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    }

    const result = validateSignupForm(validFormData)
    expect(result.isValid).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  test('잘못된 이메일로 실패해야 함', () => {
    const invalidFormData: SignupFormData = {
      email: 'invalid-email',
      password: 'Password123!',
      confirmPassword: 'Password123!',
    }

    const result = validateSignupForm(invalidFormData)
    expect(result.isValid).toBe(false)
    expect(result.errors.email).toBe('올바른 이메일 형식을 입력해주세요.')
  })

  test('약한 비밀번호로 실패해야 함', () => {
    const invalidFormData: SignupFormData = {
      email: 'test@example.com',
      password: 'weak',
      confirmPassword: 'weak',
    }

    const result = validateSignupForm(invalidFormData)
    expect(result.isValid).toBe(false)
    expect(result.errors.password).toBe('비밀번호는 최소 8자 이상이어야 합니다.')
  })

  test('불일치하는 비밀번호로 실패해야 함', () => {
    const invalidFormData: SignupFormData = {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password456!',
    }

    const result = validateSignupForm(invalidFormData)
    expect(result.isValid).toBe(false)
    expect(result.errors.confirmPassword).toBe('비밀번호가 일치하지 않습니다.')
  })

  test('여러 에러를 동시에 반환해야 함', () => {
    const invalidFormData: SignupFormData = {
      email: 'invalid-email',
      password: 'weak',
      confirmPassword: 'different',
    }

    const result = validateSignupForm(invalidFormData)
    expect(result.isValid).toBe(false)
    expect(Object.keys(result.errors)).toHaveLength(3)
    expect(result.errors.email).toBeDefined()
    expect(result.errors.password).toBeDefined()
    expect(result.errors.confirmPassword).toBeDefined()
  })
})
