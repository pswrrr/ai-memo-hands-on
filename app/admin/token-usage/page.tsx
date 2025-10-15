/**
 * ?�큰 ?�용??관리자 ?�?�보??
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

  // ?�이??로드
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: ?�제 API ?�출�??�이??로드
      // const response = await fetch(`/api/analytics/token-usage?period=${timeRange}`);
      // const data = await response.json();

      // ?�시 ?�이??(?�제 구현 ???�거)
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
          message: '?�일 ?�큰 ?�용?�이 90%???�달?�습?�다.',
          alertSentAt: new Date(Date.now() - 30 * 60 * 1000),
          status: 'sent'
        }
      ];

      setStats(mockStats);
      setUserRankings(mockUserRankings);
      setRecentAlerts(mockAlerts);
    } catch (err) {
      setError('?�이?��? 불러?�는 �??�류가 발생?�습?�다.');

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  // ?�이???�보?�기
  const handleExport = async () => {
    try {
      // TODO: ?�제 ?�이???�보?�기 구현

      alert('?�이???�보?�기 기능?� 준�?중입?�다.');
    } catch (err) {

      alert('?�이???�보?�기???�패?�습?�다.');
    }
  };

  // ?�정 ?�기
  const handleOpenSettings = () => {
    // TODO: ?�정 모달 ?�기
    console.log('?�정 ?�기');
    alert('?�정 기능?� 준�?중입?�다.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>?�이?��? 불러?�는 �?..</p>
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
          ?�시 ?�도
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>?�이?��? 불러?????�습?�다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const successRate = stats.requestCount > 0 ? (stats.successCount / stats.requestCount) * 100 : 0;
  const errorRate = stats.requestCount > 0 ? (stats.errorCount / stats.requestCount) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ?�더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">?�큰 ?�용???�?�보??/h1>
          <p className="text-gray-600">AI ?�비???�용??�?비용 모니?�링</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            ?�이???�보?�기
          </Button>
          <Button onClick={handleOpenSettings} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            ?�정
          </Button>
          <Button onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            ?�로고침
          </Button>
        </div>
      </div>

      {/* ?�간 범위 ?�택 */}
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            onClick={() => setTimeRange(range)}
          >
            {range === 'daily' ? '?�간' : range === 'weekly' ? '주간' : '?�간'}
          </Button>
        ))}
      </div>

      {/* 주요 지??카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">�??�큰 ?�용??/CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === 'daily' ? '?�늘' : timeRange === 'weekly' ? '?�번 �? : '?�번 ??}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">�?비용</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              ?�상 비용
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">?�청 ??/CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requestCount}</div>
            <p className="text-xs text-muted-foreground">
              ?�공�? {successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">?�균 처리 ?�간</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgProcessingTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">
              ?�균 ?�답 ?�간
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ?�러??�??�공�?*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              ?�공�?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">
              {stats.successCount} / {stats.requestCount} ?�청
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
              ?�러??
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{errorRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">
              {stats.errorCount} / {stats.requestCount} ?�청
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ?�용????�� */}
      <Card>
        <CardHeader>
          <CardTitle>?�용?�별 ?�큰 ?�용??/CardTitle>
          <CardDescription>?�위 ?�용?�들???�큰 ?�용???�황</CardDescription>
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
                    <p className="font-medium">?�용??{user.userId}</p>
                    <p className="text-sm text-muted-foreground">
                      마�?�??�동: {user.lastActivity.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{user.totalTokens.toLocaleString()} ?�큰</p>
                  <p className="text-sm text-muted-foreground">${user.totalCost.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 최근 ?�림 */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
              최근 ?�림
            </CardTitle>
            <CardDescription>?�용???�계�?관???�림</CardDescription>
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
                          ?�용?? {alert.userId} | {alert.alertSentAt.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={alert.status === 'sent' ? 'default' : 'secondary'}>
                        {alert.status === 'sent' ? '?�송?? : alert.status === 'read' ? '?�음' : '무시??}
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

