// jest.config.js
// Jest 테스트 설정 파일
// React 컴포넌트와 유틸리티 함수들의 단위 테스트를 위한 설정
// 이 파일은 프로젝트의 모든 테스트 실행에 사용됩니다
// 관련 파일: __tests__/validations.test.ts, __tests__/SignupForm.test.tsx

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Next.js 앱의 경로를 제공
  dir: './',
})

// Jest에 전달할 사용자 정의 설정
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// createJestConfig는 next/jest가 Next.js 설정을 로드할 수 있도록 비동기적으로 호출됩니다
module.exports = createJestConfig(customJestConfig)