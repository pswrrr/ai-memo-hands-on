// 데이터베이스 성능 모니터링 유틸리티
// 연결 시간, 쿼리 성능, 캐시 효율성 추적

interface PerformanceMetrics {
  connectionTime: number;
  queryTime: number;
  cacheHitRate: number;
  errorRate: number;
  timestamp: Date;
}

interface QueryMetrics {
  query: string;
  executionTime: number;
  cacheHit: boolean;
  error?: string;
  timestamp: Date;
}

class DatabasePerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private queryMetrics: QueryMetrics[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private errors = 0;
  private totalQueries = 0;
  private readonly MAX_METRICS = 1000; // 최대 메트릭 저장 수

  // 연결 시간 기록
  recordConnectionTime(connectionTime: number): void {
    this.metrics.push({
      connectionTime,
      queryTime: 0,
      cacheHitRate: this.getCacheHitRate(),
      errorRate: this.getErrorRate(),
      timestamp: new Date(),
    });

    this.trimMetrics();
  }

  // 쿼리 실행 시간 기록
  recordQuery(query: string, executionTime: number, cacheHit: boolean = false, error?: string): void {
    this.queryMetrics.push({
      query,
      executionTime,
      cacheHit,
      error,
      timestamp: new Date(),
    });

    this.totalQueries++;
    if (cacheHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }

    if (error) {
      this.errors++;
    }

    this.trimQueryMetrics();
  }

  // 캐시 히트 기록
  recordCacheHit(): void {
    this.cacheHits++;
  }

  // 캐시 미스 기록
  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  // 에러 기록
  recordError(): void {
    this.errors++;
  }

  // 캐시 히트율 계산
  getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  // 에러율 계산
  getErrorRate(): number {
    return this.totalQueries > 0 ? (this.errors / this.totalQueries) * 100 : 0;
  }

  // 평균 연결 시간
  getAverageConnectionTime(): number {
    if (this.metrics.length === 0) return 0;
    
    const total = this.metrics.reduce((sum, metric) => sum + metric.connectionTime, 0);
    return total / this.metrics.length;
  }

  // 평균 쿼리 시간
  getAverageQueryTime(): number {
    if (this.queryMetrics.length === 0) return 0;
    
    const total = this.queryMetrics.reduce((sum, metric) => sum + metric.executionTime, 0);
    return total / this.queryMetrics.length;
  }

  // 최근 성능 통계
  getRecentStats(minutes: number = 5): {
    connectionTime: number;
    queryTime: number;
    cacheHitRate: number;
    errorRate: number;
    totalQueries: number;
  } {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    const recentQueries = this.queryMetrics.filter(q => q.timestamp > cutoff);
    
    const avgConnectionTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.connectionTime, 0) / recentMetrics.length 
      : 0;
    
    const avgQueryTime = recentQueries.length > 0 
      ? recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / recentQueries.length 
      : 0;

    const recentCacheHits = recentQueries.filter(q => q.cacheHit).length;
    const recentCacheMisses = recentQueries.filter(q => !q.cacheHit).length;
    const cacheHitRate = (recentCacheHits + recentCacheMisses) > 0 
      ? (recentCacheHits / (recentCacheHits + recentCacheMisses)) * 100 
      : 0;

    const recentErrors = recentQueries.filter(q => q.error).length;
    const errorRate = recentQueries.length > 0 
      ? (recentErrors / recentQueries.length) * 100 
      : 0;

    return {
      connectionTime: avgConnectionTime,
      queryTime: avgQueryTime,
      cacheHitRate,
      errorRate,
      totalQueries: recentQueries.length,
    };
  }

  // 성능 리포트 생성
  generateReport(): string {
    const stats = this.getRecentStats();
    const overallStats = {
      connectionTime: this.getAverageConnectionTime(),
      queryTime: this.getAverageQueryTime(),
      cacheHitRate: this.getCacheHitRate(),
      errorRate: this.getErrorRate(),
      totalQueries: this.totalQueries,
    };

    return `
📊 데이터베이스 성능 리포트
${'='.repeat(50)}

🔗 연결 성능:
  평균 연결 시간: ${overallStats.connectionTime.toFixed(2)}ms
  최근 5분 평균: ${stats.connectionTime.toFixed(2)}ms

⚡ 쿼리 성능:
  평균 쿼리 시간: ${overallStats.queryTime.toFixed(2)}ms
  최근 5분 평균: ${stats.queryTime.toFixed(2)}ms
  총 쿼리 수: ${overallStats.totalQueries}

📦 캐시 성능:
  전체 캐시 히트율: ${overallStats.cacheHitRate.toFixed(2)}%
  최근 5분 히트율: ${stats.cacheHitRate.toFixed(2)}%

❌ 에러 통계:
  전체 에러율: ${overallStats.errorRate.toFixed(2)}%
  최근 5분 에러율: ${stats.errorRate.toFixed(2)}%

💡 성능 권장사항:
${this.generateRecommendations(stats)}
    `.trim();
  }

  // 성능 권장사항 생성
  private generateRecommendations(stats: any): string {
    const recommendations: string[] = [];

    if (stats.connectionTime > 200) {
      recommendations.push('  ⚠️  연결 시간이 200ms를 초과합니다. 연결 풀 최적화를 고려하세요.');
    }

    if (stats.queryTime > 100) {
      recommendations.push('  ⚠️  쿼리 시간이 100ms를 초과합니다. 인덱스 최적화를 고려하세요.');
    }

    if (stats.cacheHitRate < 50) {
      recommendations.push('  ⚠️  캐시 히트율이 낮습니다. 캐시 전략을 재검토하세요.');
    }

    if (stats.errorRate > 5) {
      recommendations.push('  ⚠️  에러율이 5%를 초과합니다. 연결 안정성을 확인하세요.');
    }

    if (recommendations.length === 0) {
      recommendations.push('  ✅ 성능이 양호합니다.');
    }

    return recommendations.join('\n');
  }

  // 메트릭 정리
  private trimMetrics(): void {
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  private trimQueryMetrics(): void {
    if (this.queryMetrics.length > this.MAX_METRICS) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS);
    }
  }

  // 메트릭 초기화
  reset(): void {
    this.metrics = [];
    this.queryMetrics = [];
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errors = 0;
    this.totalQueries = 0;
  }
}

// 싱글톤 인스턴스
const performanceMonitor = new DatabasePerformanceMonitor();

export default performanceMonitor;

// 편의 함수들
export function recordConnectionTime(time: number): void {
  performanceMonitor.recordConnectionTime(time);
}

export function recordQuery(query: string, executionTime: number, cacheHit: boolean = false, error?: string): void {
  performanceMonitor.recordQuery(query, executionTime, cacheHit, error);
}

export function recordCacheHit(): void {
  performanceMonitor.recordCacheHit();
}

export function recordCacheMiss(): void {
  performanceMonitor.recordCacheMiss();
}

export function recordError(): void {
  performanceMonitor.recordError();
}

export function getPerformanceReport(): string {
  return performanceMonitor.generateReport();
}

export function getRecentStats(minutes?: number) {
  return performanceMonitor.getRecentStats(minutes);
}
