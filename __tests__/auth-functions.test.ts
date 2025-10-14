// __tests__/auth-functions.test.ts
// lib/auth.ts의 resetPassword, updatePassword 함수 단위 테스트
// Story 1.3 비밀번호 재설정 기능 테스트

// Supabase 클라이언트 모킹
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

import { resetPassword, updatePassword } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

describe('lib/auth.ts - 비밀번호 재설정 함수들', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resetPassword', () => {
    it('유효한 이메일로 재설정 요청이 성공해야 함', async () => {
      // Arrange
      const email = 'test@example.com';
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      // Act
      const result = await resetPassword(email);

      // Assert
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        email,
        {
          redirectTo: expect.stringContaining('/auth/update-password'),
        }
      );
    });

    it('Supabase 에러 시 실패해야 함', async () => {
      // Arrange
      const email = 'test@example.com';
      const errorMessage = 'Invalid email format';
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: errorMessage, status: 400 },
      });

      // Act
      const result = await resetPassword(email);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        email,
        {
          redirectTo: expect.stringContaining('/auth/update-password'),
        }
      );
    });

    it('예외 발생 시 실패해야 함', async () => {
      // Arrange
      const email = 'test@example.com';
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      // Act
      const result = await resetPassword(email);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('비밀번호 재설정 중 오류가 발생했습니다.');
    });
  });

  describe('updatePassword', () => {
    it('유효한 새 비밀번호로 업데이트가 성공해야 함', async () => {
      // Arrange
      const newPassword = 'NewPassword123!';
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
      };
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Act
      const result = await updatePassword(newPassword);

      // Assert
      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it('Supabase 에러 시 실패해야 함', async () => {
      // Arrange
      const newPassword = 'weak';
      const errorMessage = 'Password is too weak';
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: errorMessage, status: 400 },
      });

      // Act
      const result = await updatePassword(newPassword);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it('예외 발생 시 실패해야 함', async () => {
      // Arrange
      const newPassword = 'NewPassword123!';
      (supabase.auth.updateUser as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      // Act
      const result = await updatePassword(newPassword);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('비밀번호 변경 중 오류가 발생했습니다.');
    });
  });
});
