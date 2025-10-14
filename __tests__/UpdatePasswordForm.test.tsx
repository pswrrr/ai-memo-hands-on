// __tests__/UpdatePasswordForm.test.tsx
// components/auth/UpdatePasswordForm.tsx 컴포넌트 단위 테스트
// Story 1.3 새 비밀번호 설정 폼 테스트

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import UpdatePasswordForm from '@/components/auth/UpdatePasswordForm';

// Next.js router 모킹
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// lib/auth 모킹
const mockUpdatePassword = jest.fn();
jest.mock('@/lib/auth', () => ({
  updatePassword: mockUpdatePassword,
}));

// lib/validations 모킹
const mockValidatePassword = jest.fn();
const mockValidateConfirmPassword = jest.fn();
jest.mock('@/lib/validations', () => ({
  validatePassword: mockValidatePassword,
  validateConfirmPassword: mockValidateConfirmPassword,
}));

describe('UpdatePasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidatePassword.mockReturnValue({ isValid: true });
    mockValidateConfirmPassword.mockReturnValue({ isValid: true });
    
    // window.location 모킹
    Object.defineProperty(window, 'location', {
      value: {
        search: '?code=valid-token',
        hash: '',
      },
      writable: true,
    });
  });

  it('유효한 토큰이 있을 때 폼이 올바르게 렌더링되어야 함', () => {
    render(<UpdatePasswordForm />);
    
    expect(screen.getByText('새 비밀번호 설정')).toBeInTheDocument();
    expect(screen.getByLabelText('새 비밀번호')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '비밀번호 변경' })).toBeInTheDocument();
  });

  it('토큰이 없을 때 에러 메시지가 표시되어야 함', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '',
        hash: '',
      },
      writable: true,
    });
    
    render(<UpdatePasswordForm />);
    
    expect(screen.getByText('유효하지 않거나 만료된 링크입니다. 비밀번호 재설정을 다시 요청해주세요.')).toBeInTheDocument();
  });

  it('만료된 링크일 때 적절한 에러 메시지가 표시되어야 함', () => {
    Object.defineProperty(window, 'location', {
      value: {
        search: '?error=access_denied&error_code=otp_expired',
        hash: '',
      },
      writable: true,
    });
    
    render(<UpdatePasswordForm />);
    
    expect(screen.getByText('링크가 만료되었습니다. 비밀번호 재설정을 다시 요청해주세요.')).toBeInTheDocument();
  });

  it('비밀번호 입력 시 상태가 업데이트되어야 함', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);
    
    const passwordInput = screen.getByLabelText('새 비밀번호');
    await user.type(passwordInput, 'NewPassword123!');
    
    expect(passwordInput).toHaveValue('NewPassword123!');
  });

  it('비밀번호 표시/숨기기 토글이 작동해야 함', async () => {
    const user = userEvent.setup();
    render(<UpdatePasswordForm />);
    
    const passwordInput = screen.getByLabelText('새 비밀번호');
    const toggleButton = screen.getByLabelText('비밀번호 보기');
    
    await user.type(passwordInput, 'NewPassword123!');
    await user.click(toggleButton);
    
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('비밀번호 숨기기')).toBeInTheDocument();
  });

  it('유효하지 않은 비밀번호 입력 시 에러 메시지가 표시되어야 함', async () => {
    const user = userEvent.setup();
    mockValidatePassword.mockReturnValue({
      isValid: false,
      message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
    });
    
    render(<UpdatePasswordForm />);
    
    const passwordInput = screen.getByLabelText('새 비밀번호');
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' });
    
    await user.type(passwordInput, 'weak');
    await user.click(submitButton);
    
    expect(screen.getByText('비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.')).toBeInTheDocument();
  });

  it('비밀번호 불일치 시 에러 메시지가 표시되어야 함', async () => {
    const user = userEvent.setup();
    mockValidateConfirmPassword.mockReturnValue({
      isValid: false,
      message: '비밀번호가 일치하지 않습니다.',
    });
    
    render(<UpdatePasswordForm />);
    
    const passwordInput = screen.getByLabelText('새 비밀번호');
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인');
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' });
    
    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    await user.click(submitButton);
    
    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
  });

  it('성공적인 비밀번호 변경 시 성공 메시지가 표시되고 리다이렉트되어야 함', async () => {
    const user = userEvent.setup();
    mockUpdatePassword.mockResolvedValue({ success: true });
    
    render(<UpdatePasswordForm />);
    
    const passwordInput = screen.getByLabelText('새 비밀번호');
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인');
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' });
    
    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호가 성공적으로 변경되었습니다. 잠시 후 로그인 페이지로 이동합니다.')).toBeInTheDocument();
    });
    
    expect(mockUpdatePassword).toHaveBeenCalledWith('NewPassword123!');
    
    // 2초 후 리다이렉트 확인
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    }, { timeout: 3000 });
  });

  it('비밀번호 변경 실패 시 에러 메시지가 표시되어야 함', async () => {
    const user = userEvent.setup();
    mockUpdatePassword.mockResolvedValue({
      success: false,
      error: '비밀번호가 너무 약합니다.',
    });
    
    render(<UpdatePasswordForm />);
    
    const passwordInput = screen.getByLabelText('새 비밀번호');
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인');
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' });
    
    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호가 너무 약합니다.')).toBeInTheDocument();
    });
  });

  it('로딩 상태가 올바르게 표시되어야 함', async () => {
    const user = userEvent.setup();
    mockUpdatePassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<UpdatePasswordForm />);
    
    const passwordInput = screen.getByLabelText('새 비밀번호');
    const confirmPasswordInput = screen.getByLabelText('비밀번호 확인');
    const submitButton = screen.getByRole('button', { name: '비밀번호 변경' });
    
    await user.type(passwordInput, 'NewPassword123!');
    await user.type(confirmPasswordInput, 'NewPassword123!');
    await user.click(submitButton);
    
    expect(screen.getByText('변경 중...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
