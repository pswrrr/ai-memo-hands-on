/**
 * 토큰 추적 서비스 테스트
 */

import { TokenTrackerService } from '../../lib/ai/token-tracker';

// 데이터베이스 모킹
jest.mock('../../lib/db', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn()
      })
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue([
          {
            totalTokens: 1000,
            totalCost: 0.05,
            requestCount: 10,
            successCount: 8,
            errorCount: 2,
            avgProcessingTime: 1500
          }
        ])
      })
    })
  }
}));

// 로거 모킹
jest.mock('../../lib/utils/logger', () => ({
  aiLogger: {
    tokenUsage: jest.fn()
  }
}));

describe('TokenTrackerService', () => {
  let tokenTracker: TokenTrackerService;

  beforeEach(() => {
    tokenTracker = new TokenTrackerService();
    jest.clearAllMocks();
    
    // 기본 모킹 설정
    require('../../lib/db').db.select.mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue([
          {
            totalTokens: 1000,
            totalCost: 0.05,
            requestCount: 10,
            successCount: 8,
            errorCount: 2,
            avgProcessingTime: 1500
          }
        ])
      })
    });
  });

  describe('recordTokenUsage', () => {
    it('should record token usage successfully', async () => {
      const record = {
        userId: 'user123',
        noteId: 'note456',
        model: 'gemini-2.0-flash-exp',
        operation: 'summary_generation' as const,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        processingTime: 2000,
        success: true
      };

      await tokenTracker.recordTokenUsage(record);

      // 데이터베이스 삽입이 호출되었는지 확인
      expect(require('../../lib/db').db.insert).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // 데이터베이스 에러 시뮬레이션
      require('../../lib/db').db.insert.mockImplementation(() => {
        throw new Error('Database error');
      });

      const record = {
        userId: 'user123',
        noteId: 'note456',
        model: 'gemini-2.0-flash-exp',
        operation: 'summary_generation' as const,
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        processingTime: 2000,
        success: true
      };

      // 에러가 발생해도 예외를 던지지 않아야 함
      await expect(tokenTracker.recordTokenUsage(record)).resolves.not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('토큰 사용량 기록 실패:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('getUserDailyUsage', () => {
    it('should return daily usage statistics', async () => {
      const userId = 'user123';
      const date = new Date('2024-01-15');

      const result = await tokenTracker.getUserDailyUsage(userId, date);

      expect(result).toMatchObject({
        totalTokens: 1000,
        totalCost: 0.05,
        requestCount: 10,
        successCount: 8,
        errorCount: 2,
        avgProcessingTime: 1500
      });
      expect(result.period.start).toBeInstanceOf(Date);
      expect(result.period.end).toBeInstanceOf(Date);
    });

    it('should handle empty results', async () => {
      // 빈 결과 시뮬레이션
      require('../../lib/db').db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue([{
            totalTokens: null,
            totalCost: null,
            requestCount: null,
            successCount: null,
            errorCount: null,
            avgProcessingTime: null
          }])
        })
      });

      const result = await tokenTracker.getUserDailyUsage('user123', new Date());

      expect(result.totalTokens).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.requestCount).toBe(0);
    });
  });

  describe('getUserMonthlyUsage', () => {
    it('should return monthly usage statistics', async () => {
      const userId = 'user123';
      const year = 2024;
      const month = 1;

      const result = await tokenTracker.getUserMonthlyUsage(userId, year, month);

      expect(result).toMatchObject({
        totalTokens: 1000,
        totalCost: 0.05,
        requestCount: 10,
        successCount: 8,
        errorCount: 2,
        avgProcessingTime: 1500
      });
    });
  });

  describe('getSystemUsage', () => {
    it('should return daily system usage', async () => {
      const result = await tokenTracker.getSystemUsage('daily', new Date('2024-01-15'));

      expect(result.totalTokens).toBe(1000);
      expect(result.period.start).toBeInstanceOf(Date);
      expect(result.period.end).toBeInstanceOf(Date);
    });

    it('should return weekly system usage', async () => {
      const result = await tokenTracker.getSystemUsage('weekly', new Date('2024-01-15'));

      expect(result.totalTokens).toBe(1000);
      expect(result.period.start).toBeInstanceOf(Date);
      expect(result.period.end).toBeInstanceOf(Date);
    });

    it('should return monthly system usage', async () => {
      const result = await tokenTracker.getSystemUsage('monthly', new Date('2024-01-15'));

      expect(result.totalTokens).toBe(1000);
      expect(result.period.start).toBeInstanceOf(Date);
      expect(result.period.end).toBeInstanceOf(Date);
    });
  });

  describe('getThresholdConfig', () => {
    it('should return threshold configuration', async () => {
      // 임계값 설정 모킹
      require('../../lib/db').db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue([{
              userId: 'user123',
              dailyLimit: 50000,
              monthlyLimit: 500000,
              alertEnabled: true,
              alertThreshold: 80
            }])
          })
        })
      });

      const result = await tokenTracker.getThresholdConfig('user123');

      expect(result).toMatchObject({
        userId: 'user123',
        dailyLimit: 50000,
        monthlyLimit: 500000,
        alertEnabled: true,
        alertThreshold: 80
      });
    });

    it('should return null when no configuration found', async () => {
      require('../../lib/db').db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue([])
          })
        })
      });

      const result = await tokenTracker.getThresholdConfig('user123');

      expect(result).toBeNull();
    });
  });

  describe('setThresholdConfig', () => {
    it('should set threshold configuration', async () => {
      // 에러 시뮬레이션 제거
      require('../../lib/db').db.insert.mockImplementation(() => ({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn()
        })
      }));

      const config = {
        userId: 'user123',
        dailyLimit: 50000,
        monthlyLimit: 500000,
        alertEnabled: true,
        alertThreshold: 80
      };

      await tokenTracker.setThresholdConfig(config);

      expect(require('../../lib/db').db.insert).toHaveBeenCalled();
    });
  });

  describe('updateUsageStatsCache', () => {
    it('should update usage statistics cache', async () => {
      // 에러 시뮬레이션 제거
      require('../../lib/db').db.insert.mockImplementation(() => ({
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn()
        })
      }));

      const userId = 'user123';
      const period = 'daily' as const;

      await tokenTracker.updateUsageStatsCache(userId, period);

      expect(require('../../lib/db').db.insert).toHaveBeenCalled();
    });
  });
});
