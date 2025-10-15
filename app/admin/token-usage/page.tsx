/**
 * ? í° ?¬ìš©??ê´€ë¦¬ì ?€?œë³´??
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

  // ?°ì´??ë¡œë“œ
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: ?¤ì œ API ?¸ì¶œë¡??°ì´??ë¡œë“œ
      // const response = await fetch(`/api/analytics/token-usage?period=${timeRange}`);
      // const data = await response.json();

      // ?„ì‹œ ?°ì´??(?¤ì œ êµ¬í˜„ ???œê±°)
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
          message: '?¼ì¼ ? í° ?¬ìš©?‰ì´ 90%???„ë‹¬?ˆìŠµ?ˆë‹¤.',
          alertSentAt: new Date(Date.now() - 30 * 60 * 1000),
          status: 'sent'
        }
      ];

      setStats(mockStats);
      setUserRankings(mockUserRankings);
      setRecentAlerts(mockAlerts);
    } catch (err) {
      setError('?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.');

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  // ?°ì´???´ë³´?´ê¸°
  const handleExport = async () => {
    try {
      // TODO: ?¤ì œ ?°ì´???´ë³´?´ê¸° êµ¬í˜„

      alert('?°ì´???´ë³´?´ê¸° ê¸°ëŠ¥?€ ì¤€ë¹?ì¤‘ì…?ˆë‹¤.');
    } catch (err) {

      alert('?°ì´???´ë³´?´ê¸°???¤íŒ¨?ˆìŠµ?ˆë‹¤.');
    }
  };

  // ?¤ì • ?´ê¸°
  const handleOpenSettings = () => {
    // TODO: ?¤ì • ëª¨ë‹¬ ?´ê¸°
    console.log('?¤ì • ?´ê¸°');
    alert('?¤ì • ê¸°ëŠ¥?€ ì¤€ë¹?ì¤‘ì…?ˆë‹¤.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
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
          ?¤ì‹œ ?œë„
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>?°ì´?°ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const successRate = stats.requestCount > 0 ? (stats.successCount / stats.requestCount) * 100 : 0;
  const errorRate = stats.requestCount > 0 ? (stats.errorCount / stats.requestCount) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ?¤ë” */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">? í° ?¬ìš©???€?œë³´??/h1>
          <p className="text-gray-600">AI ?œë¹„???¬ìš©??ë°?ë¹„ìš© ëª¨ë‹ˆ?°ë§</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            ?°ì´???´ë³´?´ê¸°
          </Button>
          <Button onClick={handleOpenSettings} variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            ?¤ì •
          </Button>
          <Button onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            ?ˆë¡œê³ ì¹¨
          </Button>
        </div>
      </div>

      {/* ?œê°„ ë²”ìœ„ ? íƒ */}
      <div className="flex gap-2">
        {(['daily', 'weekly', 'monthly'] as const).map((range) => (
          <Button
            key={range}
            variant={timeRange === range ? 'default' : 'outline'}
            onClick={() => setTimeRange(range)}
          >
            {range === 'daily' ? '?¼ê°„' : range === 'weekly' ? 'ì£¼ê°„' : '?”ê°„'}
          </Button>
        ))}
      </div>

      {/* ì£¼ìš” ì§€??ì¹´ë“œ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ì´?? í° ?¬ìš©??/CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {timeRange === 'daily' ? '?¤ëŠ˜' : timeRange === 'weekly' ? '?´ë²ˆ ì£? : '?´ë²ˆ ??}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ì´?ë¹„ìš©</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              ?ˆìƒ ë¹„ìš©
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">?”ì²­ ??/CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requestCount}</div>
            <p className="text-xs text-muted-foreground">
              ?±ê³µë¥? {successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">?‰ê·  ì²˜ë¦¬ ?œê°„</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.avgProcessingTime / 1000).toFixed(1)}s</div>
            <p className="text-xs text-muted-foreground">
              ?‰ê·  ?‘ë‹µ ?œê°„
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ?ëŸ¬??ë°??±ê³µë¥?*/}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              ?±ê³µë¥?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{successRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">
              {stats.successCount} / {stats.requestCount} ?”ì²­
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingDown className="mr-2 h-5 w-5 text-red-500" />
              ?ëŸ¬??
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{errorRate.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">
              {stats.errorCount} / {stats.requestCount} ?”ì²­
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ?¬ìš©????‚¹ */}
      <Card>
        <CardHeader>
          <CardTitle>?¬ìš©?ë³„ ? í° ?¬ìš©??/CardTitle>
          <CardDescription>?ìœ„ ?¬ìš©?ë“¤??? í° ?¬ìš©???„í™©</CardDescription>
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
                    <p className="font-medium">?¬ìš©??{user.userId}</p>
                    <p className="text-sm text-muted-foreground">
                      ë§ˆì?ë§??œë™: {user.lastActivity.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{user.totalTokens.toLocaleString()} ? í°</p>
                  <p className="text-sm text-muted-foreground">${user.totalCost.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ìµœê·¼ ?Œë¦¼ */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
              ìµœê·¼ ?Œë¦¼
            </CardTitle>
            <CardDescription>?¬ìš©???„ê³„ê°?ê´€???Œë¦¼</CardDescription>
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
                          ?¬ìš©?? {alert.userId} | {alert.alertSentAt.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={alert.status === 'sent' ? 'default' : 'secondary'}>
                        {alert.status === 'sent' ? '?„ì†¡?? : alert.status === 'read' ? '?½ìŒ' : 'ë¬´ì‹œ??}
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

