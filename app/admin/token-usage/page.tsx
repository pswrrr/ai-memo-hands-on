/**
 * 토큰 사용량 관리자 대시보드
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

interface UsageStats {
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  successCount: number;
  errorCount: number;
  avgProcessingTime: number;
  period: {
    start: Date;
    end: Date;
  };
}

interface UserUsage {
  userId: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  lastActivity: Date;
}

interface AlertInfo {
  id: string;
  userId: string;
  thresholdType: 'daily' | 'monthly';
  thresholdValue: number;
  currentUsage: number;
  percentage: number;
  message: string;
  alertSentAt: Date;
  status: 'sent' | 'read' | 'dismissed';
}

export default function TokenUsageDashboard() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [userRankings, setUserRankings] = useState<UserUsage[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // 데이터 로드
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: 실제 API 호출로 데이터 로드
      // const response = await fetch(`/api/analytics/token-usage?period=${timeRange}`);
      // const data = await response.json();

      // 임시 데이터 (실제 구현 시 제거)
      const mockStats: UsageStats = {
        totalTokens: 125000,
        totalCost: 0.45,
        requestCount: 156,
        successCount: 142,
        errorCount: 14,
        avgProcessingTime: 2500,
        period: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        }
      };

      const mockUserRankings: UserUsage[] = [
        {
          userId: 'user-001',
          totalTokens: 45000,
          totalCost: 0.18,
          requestCount: 45,
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          userId: 'user-002',
          totalTokens: 32000,
          totalCost: 0.13,
          requestCount: 32,
          lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000)
        },
        {
          userId: 'user-003',
          totalTokens: 28000,
          totalCost: 0.11,
          requestCount: 28,
          lastActivity: new Date(Date.now() - 6 * 60 * 60 * 1000)
        }
      ];

      const mockAlerts: AlertInfo[] = [
        {
          id: 'alert-001',
          userId: 'user-001',
          thresholdType: 'daily',
          thresholdValue: 50000,
          currentUsage: 45000,
          percentage: 90,
          message: '일일 토큰 사용량이 90%에 도달했습니다.',
          alertSentAt: new Date(Date.now() - 30 * 60 * 1000),
          status: 'sent'
        }
      ];

      setStats(mockStats);
      setUserRankings(mockUserRankings);
      setRecentAlerts(mockAlerts);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  // 데이터 내보내기
  const handleExport = async () => {
    try {
      // TODO: 실제 데이터 내보내기 구현
      console.log('데이터 내보내기 시작...');
      alert('데이터 내보내기 기능은 준비 중입니다.');
    } catch (err) {
      console.error('데이터 내보내기 실패:', err);
      alert('데이터 내보내기에 실패했습니다.');
    }
  };

  // 설정 열기
  const handleOpenSettings = () => {
    // TODO: 설정 모달 열기
    console.log('설정 열기');
    alert('설정 기능은 준비 중입니다.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData} className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" />
          다시 시도
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>데이터를 불러올 수 없습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const successRate = stats.requestCount > 0 ? (stats.successCount / stats.requestCount) * 100 : 0;
  const errorRate = stats.requestCount > 0 ? (stats.errorCount / stats.requestCount) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">토큰 사용량 대시보드</h1>
          <p className="text-gray-600">AI 서비스 사용량 및 비용 모니터링</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            데이터 내보내기
          </Button>
          <Button onClick={handleOpenSettings} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            설정
          </Button>
          <Button onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 시간 범위 선택 */}
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            onClick={() => setTimeRange(range)}
          >
            {range === 'daily' ? '일간' : range === 'weekly' ? '주간' : '월간'}
          </Button>
        ))}
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 토큰 사용량</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === 'daily' ? '오늘' : timeRange === 'weekly' ? '이번 주' : '이번 달'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 비용</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              예상 비용
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">요청 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requestCount}</div>
            <p className="text-xs text-muted-foreground">
              성공률: {successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 처리 시간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgProcessingTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">
              평균 응답 시간
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 에러율 및 성공률 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              성공률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">
              {stats.successCount} / {stats.requestCount} 요청
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
              에러율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{errorRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">
              {stats.errorCount} / {stats.requestCount} 요청
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 사용자 랭킹 */}
      <Card>
        <CardHeader>
          <CardTitle>사용자별 토큰 사용량</CardTitle>
          <CardDescription>상위 사용자들의 토큰 사용량 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userRankings.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">사용자 {user.userId}</p>
                    <p className="text-sm text-muted-foreground">
                      마지막 활동: {user.lastActivity.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{user.totalTokens.toLocaleString()} 토큰</p>
                  <p className="text-sm text-muted-foreground">${user.totalCost.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 최근 알림 */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
              최근 알림
            </CardTitle>
            <CardDescription>사용량 임계값 관련 알림</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <Alert key={alert.id}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm text-muted-foreground">
                          사용자: {alert.userId} | {alert.alertSentAt.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={alert.status === 'sent' ? 'default' : 'secondary'}>
                        {alert.status === 'sent' ? '전송됨' : alert.status === 'read' ? '읽음' : '무시됨'}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

