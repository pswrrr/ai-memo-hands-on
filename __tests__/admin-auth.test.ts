/**
 * 관리자 권한 인증 테스트
 * 
 * 테스트 범위:
 * - 관리자 역할 확인 함수
 * - 일반 사용자와 관리자 구분
 * - 권한 없는 사용자의 접근 차단
 */

import { checkUserIsAdmin } from '@/lib/auth';

describe('관리자 권한 인증 테스트', () => {
  describe('checkUserIsAdmin', () => {
    it('user_metadata에 role이 admin인 사용자는 관리자로 인식되어야 함', () => {
      const adminUser = {
        id: 'test-admin-id',
        email: 'admin@test.com',
        user_metadata: {
          role: 'admin',
          onboarding_completed: true
        }
      };

      const result = checkUserIsAdmin(adminUser);
      expect(result).toBe(true);
    });

    it('user_metadata에 role이 없는 사용자는 관리자가 아님', () => {
      const normalUser = {
        id: 'test-user-id',
        email: 'user@test.com',
        user_metadata: {
          onboarding_completed: true
        }
      };

      const result = checkUserIsAdmin(normalUser);
      expect(result).toBe(false);
    });

    it('user_metadata에 role이 admin이 아닌 사용자는 관리자가 아님', () => {
      const normalUser = {
        id: 'test-user-id',
        email: 'user@test.com',
        user_metadata: {
          role: 'user',
          onboarding_completed: true
        }
      };

      const result = checkUserIsAdmin(normalUser);
      expect(result).toBe(false);
    });

    it('user_metadata가 없는 사용자는 관리자가 아님', () => {
      const userWithoutMetadata = {
        id: 'test-user-id',
        email: 'user@test.com'
      };

      const result = checkUserIsAdmin(userWithoutMetadata);
      expect(result).toBe(false);
    });

    it('null 사용자는 관리자가 아님', () => {
      const result = checkUserIsAdmin(null);
      expect(result).toBe(false);
    });

    it('undefined 사용자는 관리자가 아님', () => {
      const result = checkUserIsAdmin(undefined as never);
      expect(result).toBe(false);
    });

    it('user_metadata.role이 대문자 ADMIN인 경우 관리자가 아님 (대소문자 구분)', () => {
      const userWithUppercaseRole = {
        id: 'test-user-id',
        email: 'user@test.com',
        user_metadata: {
          role: 'ADMIN'
        }
      };

      const result = checkUserIsAdmin(userWithUppercaseRole);
      expect(result).toBe(false);
    });

    it('user_metadata.role이 빈 문자열인 경우 관리자가 아님', () => {
      const userWithEmptyRole = {
        id: 'test-user-id',
        email: 'user@test.com',
        user_metadata: {
          role: ''
        }
      };

      const result = checkUserIsAdmin(userWithEmptyRole);
      expect(result).toBe(false);
    });

    it('user_metadata에 여러 속성이 있어도 role이 admin이면 관리자임', () => {
      const adminUserWithMultipleProps = {
        id: 'test-admin-id',
        email: 'admin@test.com',
        user_metadata: {
          role: 'admin',
          onboarding_completed: true,
          preferences: {
            theme: 'dark',
            language: 'ko'
          },
          created_at: '2024-01-01'
        }
      };

      const result = checkUserIsAdmin(adminUserWithMultipleProps);
      expect(result).toBe(true);
    });
  });

  describe('관리자 역할 시나리오 테스트', () => {
    it('신규 회원가입 사용자는 기본적으로 관리자가 아님', () => {
      const newUser = {
        id: 'new-user-id',
        email: 'newuser@test.com',
        user_metadata: {}
      };

      expect(checkUserIsAdmin(newUser)).toBe(false);
    });

    it('관리자 권한이 부여된 사용자는 즉시 관리자로 인식됨', () => {
      const promotedUser = {
        id: 'promoted-user-id',
        email: 'promoted@test.com',
        user_metadata: {
          role: 'admin'
        }
      };

      expect(checkUserIsAdmin(promotedUser)).toBe(true);
    });

    it('관리자 권한이 제거된 사용자는 더 이상 관리자가 아님', () => {
      const demotedUser = {
        id: 'demoted-user-id',
        email: 'demoted@test.com',
        user_metadata: {
          // role 속성이 제거됨
          onboarding_completed: true
        }
      };

      expect(checkUserIsAdmin(demotedUser)).toBe(false);
    });
  });

  describe('에지 케이스 테스트', () => {
    it('user_metadata가 빈 객체인 경우 관리자가 아님', () => {
      const userWithEmptyMetadata = {
        id: 'test-user-id',
        email: 'user@test.com',
        user_metadata: {}
      };

      expect(checkUserIsAdmin(userWithEmptyMetadata)).toBe(false);
    });

    it('user 객체에 예상치 못한 추가 속성이 있어도 정상 동작', () => {
      const userWithExtraProps = {
        id: 'test-user-id',
        email: 'user@test.com',
        user_metadata: {
          role: 'admin'
        },
        extraProp: 'some value',
        anotherProp: 123
      };

      expect(checkUserIsAdmin(userWithExtraProps)).toBe(true);
    });

    it('user_metadata.role이 숫자인 경우 관리자가 아님', () => {
      const userWithNumericRole = {
        id: 'test-user-id',
        email: 'user@test.com',
        user_metadata: {
          role: 1
        }
      };

      expect(checkUserIsAdmin(userWithNumericRole as never)).toBe(false);
    });

    it('user_metadata.role이 객체인 경우 관리자가 아님', () => {
      const userWithObjectRole = {
        id: 'test-user-id',
        email: 'user@test.com',
        user_metadata: {
          role: { type: 'admin' }
        }
      };

      expect(checkUserIsAdmin(userWithObjectRole as never)).toBe(false);
    });
  });
});

