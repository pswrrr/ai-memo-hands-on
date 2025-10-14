// __tests__/ResetPasswordRequestForm.test.tsx
// components/auth/ResetPasswordRequestForm.tsx 컴포넌트 단위 테스트
// Story 1.3 비밀번호 재설정 요청 폼 테스트

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordRequestForm from '@/components/auth/ResetPasswordRequestForm';

// lib/auth 모킹
const mockResetPassword = jest.fn();
jest.mock('@/lib/auth', () => ({
  resetPassword: mockResetPassword,
}));

// lib/validations 모킹
const mockValidateEmail = jest.fn();
jest.mock('@/lib/validations', () => ({
  validateEmail: mockValidateEmail,
}));

describe('ResetPasswordRequestForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidateEmail.mockReturnValue({ isValid: true });
  });

  it('폼이 올바르게 렌더링되어야 함', () => {
    render(<ResetPasswordRequestForm />);
    
    expect(screen.getByText('비밀번호 재설정')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일 주소')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '재설정 링크 전송' })).toBeInTheDocument();
    expect(screen.getByText('← 로그인 페이지로 돌아가기')).toBeInTheDocument();
  });

  it('이메일 입력 시 상태가 업데이트되어야 함', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordRequestForm />);
    
    const emailInput = screen.getByLabelText('이메일 주소');
    await user.type(emailInput, 'test@example.com');
    
    expect(emailInput).toHaveValue('test@example.com');
  });

  it('유효하지 않은 이메일 입력 시 에러 메시지가 표시되어야 함', async () => {
    const user = userEvent.setup();
    mockValidateEmail.mockReturnValue({
      isValid: false,
      message: '올바른 이메일 형식을 입력해주세요.',
    });
    
    render(<ResetPasswordRequestForm />);
    
    const emailInput = screen.getByLabelText('이메일 주소');
    const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    expect(screen.getByText('올바른 이메일 형식을 입력해주세요.')).toBeInTheDocument();
  });

  it('성공적인 재설정 요청 시 성공 메시지가 표시되어야 함', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({ success: true });
    
    render(<ResetPasswordRequestForm />);
    
    const emailInput = screen.getByLabelText('이메일 주소');
    const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.')).toBeInTheDocument();
    });
    
    expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('재설정 요청 실패 시 에러 메시지가 표시되어야 함', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockResolvedValue({
      success: false,
      error: '이메일을 찾을 수 없습니다.',
    });
    
    render(<ResetPasswordRequestForm />);
    
    const emailInput = screen.getByLabelText('이메일 주소');
    const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('이메일을 찾을 수 없습니다.')).toBeInTheDocument();
    });
  });

  it('로딩 상태가 올바르게 표시되어야 함', async () => {
    const user = userEvent.setup();
    mockResetPassword.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<ResetPasswordRequestForm />);
    
    const emailInput = screen.getByLabelText('이메일 주소');
    const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    expect(screen.getByText('전송 중...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('빈 이메일로 제출 시 버튼이 비활성화되어야 함', () => {
    render(<ResetPasswordRequestForm />);
    
    const submitButton = screen.getByRole('button', { name: '재설정 링크 전송' });
    expect(submitButton).toBeDisabled();
  });
});
