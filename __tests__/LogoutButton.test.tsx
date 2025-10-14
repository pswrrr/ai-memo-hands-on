// __tests__/LogoutButton.test.tsx
// components/auth/LogoutButton.tsx 컴포넌트 단위 테스트
// Story 1.4 로그아웃 기능 테스트

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/components/auth/LogoutButton';
import { signOut } from '@/lib/auth';

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
jest.mock('@/lib/auth', () => ({
  signOut: jest.fn(),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('기본 스타일로 버튼이 렌더링되어야 함', () => {
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-red-600');
  });

  it('outline 스타일로 버튼이 렌더링되어야 함', () => {
    render(<LogoutButton variant="outline" />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    expect(button).toHaveClass('border-red-600');
  });

  it('ghost 스타일로 버튼이 렌더링되어야 함', () => {
    render(<LogoutButton variant="ghost" />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    expect(button).toHaveClass('text-red-600');
  });

  it('커스텀 className이 적용되어야 함', () => {
    render(<LogoutButton className="custom-class" />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    expect(button).toHaveClass('custom-class');
  });

  it('클릭 시 로그아웃이 실행되고 리다이렉트되어야 함', async () => {
    const user = userEvent.setup();
    (signOut as jest.Mock).mockResolvedValue({ success: true });
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    await user.click(button);
    
    expect(signOut).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('로그아웃 실패 시 에러가 콘솔에 출력되어야 함', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (signOut as jest.Mock).mockResolvedValue({
      success: false,
      error: '로그아웃 실패',
    });
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    await user.click(button);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('로그아웃 에러:', '로그아웃 실패');
    });
    
    consoleSpy.mockRestore();
  });

  it('로그아웃 실패 시 alert가 표시되어야 함', async () => {
    const user = userEvent.setup();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    (signOut as jest.Mock).mockResolvedValue({
      success: false,
      error: '로그아웃 실패',
    });
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    await user.click(button);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('로그아웃 중 오류가 발생했습니다.');
    });
    
    alertSpy.mockRestore();
  });

  it('로딩 상태가 올바르게 표시되어야 함', async () => {
    const user = userEvent.setup();
    (signOut as jest.Mock).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    await user.click(button);
    
    expect(screen.getByText('로그아웃 중...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('예외 발생 시 에러가 콘솔에 출력되어야 함', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    (signOut as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    await user.click(button);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('로그아웃 예외:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('예외 발생 시 alert가 표시되어야 함', async () => {
    const user = userEvent.setup();
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
    (signOut as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<LogoutButton />);
    
    const button = screen.getByRole('button', { name: '로그아웃' });
    await user.click(button);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('로그아웃 중 오류가 발생했습니다.');
    });
    
    alertSpy.mockRestore();
  });
});
