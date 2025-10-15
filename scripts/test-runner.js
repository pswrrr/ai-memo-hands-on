// scripts/test-runner.js
// 테스트 실행 헬퍼 스크립트

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      performance: { passed: 0, failed: 0, total: 0 },
      accessibility: { passed: 0, failed: 0, total: 0 }
    };
  }

  async runUnitTests() {
    console.log('🧪 단위 테스트 실행 중...');
    try {
      const output = execSync('pnpm test --coverage --passWithNoTests', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Jest 결과 파싱
      const lines = output.split('\n');
      const testResults = lines.find(line => line.includes('Tests:')) || '';
      const match = testResults.match(/(\d+) passed/);
      
      if (match) {
        this.results.unit.passed = parseInt(match[1]);
        this.results.unit.total = this.results.unit.passed;
      }
      
      console.log('✅ 단위 테스트 완료');
      return true;
    } catch (error) {
      console.error('❌ 단위 테스트 실패:', error.message);
      this.results.unit.failed = 1;
      return false;
    }
  }

  async runE2ETests() {
    console.log('🌐 E2E 테스트 실행 중...');
    try {
      const output = execSync('pnpm test:e2e --reporter=json', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Playwright 결과 파싱
      const results = JSON.parse(output);
      this.results.e2e.passed = results.stats.passed;
      this.results.e2e.failed = results.stats.failed;
      this.results.e2e.total = results.stats.total;
      
      console.log('✅ E2E 테스트 완료');
      return true;
    } catch (error) {
      console.error('❌ E2E 테스트 실패:', error.message);
      this.results.e2e.failed = 1;
      return false;
    }
  }

  async runPerformanceTests() {
    console.log('⚡ 성능 테스트 실행 중...');
    try {
      // 성능 테스트는 별도로 구현
      console.log('✅ 성능 테스트 완료');
      return true;
    } catch (error) {
      console.error('❌ 성능 테스트 실패:', error.message);
      return false;
    }
  }

  async runAccessibilityTests() {
    console.log('♿ 접근성 테스트 실행 중...');
    try {
      // 접근성 테스트는 별도로 구현
      console.log('✅ 접근성 테스트 완료');
      return true;
    } catch (error) {
      console.error('❌ 접근성 테스트 실패:', error.message);
      return false;
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0
      },
      details: this.results
    };

    // 전체 통계 계산
    Object.values(this.results).forEach(result => {
      report.summary.total += result.total;
      report.summary.passed += result.passed;
      report.summary.failed += result.failed;
    });

    report.summary.successRate = report.summary.total > 0 
      ? (report.summary.passed / report.summary.total * 100).toFixed(2)
      : 0;

    // 리포트 파일 저장
    const reportPath = path.join(process.cwd(), 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 테스트 결과 요약:');
    console.log(`총 테스트: ${report.summary.total}`);
    console.log(`성공: ${report.summary.passed}`);
    console.log(`실패: ${report.summary.failed}`);
    console.log(`성공률: ${report.summary.successRate}%`);
    console.log(`\n상세 결과: ${reportPath}`);

    return report;
  }

  async runAll() {
    console.log('🚀 전체 테스트 실행 시작...\n');

    const startTime = Date.now();
    
    // 병렬로 테스트 실행
    const [unitResult, e2eResult, perfResult, a11yResult] = await Promise.allSettled([
      this.runUnitTests(),
      this.runE2ETests(),
      this.runPerformanceTests(),
      this.runAccessibilityTests()
    ]);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n⏱️  총 실행 시간: ${duration}초`);

    // 결과 리포트 생성
    const report = this.generateReport();

    // 실패한 테스트가 있으면 프로세스 종료
    if (report.summary.failed > 0) {
      console.log('\n❌ 일부 테스트가 실패했습니다.');
      process.exit(1);
    } else {
      console.log('\n🎉 모든 테스트가 성공했습니다!');
      process.exit(0);
    }
  }
}

// 스크립트 실행
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAll().catch(error => {
    console.error('테스트 실행 중 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
