// Jest 환경 변수 설정
// 테스트 실행 시 .env.local 파일의 환경 변수를 로드합니다

const { config } = require('dotenv');

// .env.local 파일에서 환경 변수 로드
config({ path: '.env.local' });

// 테스트용 환경 변수 설정
process.env.NODE_ENV = 'test';
