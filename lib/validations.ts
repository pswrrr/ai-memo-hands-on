// lib/validations.ts
// 폼 유효성 검사 로직을 담당하는 파일
// 이메일, 비밀번호, 비밀번호 확인 등의 유효성 검사를 수행합니다
// 이 파일은 회원가입, 로그인 등 모든 인증 관련 폼에서 사용됩니다
// 관련 파일: components/auth/SignupForm.tsx, components/auth/LoginForm.tsx

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// 이메일 유효성 검사
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, message: '이메일을 입력해주세요.' };
  }

  // 더 엄격한 이메일 정규식 (RFC 5322 표준 준수)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '올바른 이메일 형식을 입력해주세요.' };
  }

  // 이메일 길이 검사
  if (email.length > 254) {
    return { isValid: false, message: '이메일이 너무 깁니다.' };
  }

  // 로컬 부분 길이 검사
  const localPart = email.split('@')[0];
  if (localPart.length > 64) {
    return { isValid: false, message: '이메일 로컬 부분이 너무 깁니다.' };
  }

  return { isValid: true };
}

// 비밀번호 유효성 검사
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, message: '비밀번호를 입력해주세요.' };
  }

  if (password.length < 8) {
    return { isValid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }

  // 영문, 숫자, 특수문자 조합 검사
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLetter || !hasNumber || !hasSpecialChar) {
    return { 
      isValid: false, 
      message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.' 
    };
  }

  return { isValid: true };
}

// 비밀번호 확인 검사
export function validateConfirmPassword(password: string, confirmPassword: string): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, message: '비밀번호 확인을 입력해주세요.' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, message: '비밀번호가 일치하지 않습니다.' };
  }

  return { isValid: true };
}

// 전체 회원가입 폼 유효성 검사
export function validateSignupForm(data: SignupFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message!;
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message!;
  }

  const confirmPasswordValidation = validateConfirmPassword(data.password, data.confirmPassword);
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.message!;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// 로그인 폼 유효성 검사
export function validateLoginForm(data: LoginFormData): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message!;
  }

  if (!data.password) {
    errors.password = '비밀번호를 입력해주세요.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
