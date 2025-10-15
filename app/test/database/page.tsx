'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  duration?: number;
}

export default function DatabaseTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');

  const runDatabaseTests = async () => {
    setIsLoading(true);
    setResults([]);
    setOverallStatus('idle');

    try {
      const response = await fetch('/api/test/database');
      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
        const hasErrors = data.results.some((result: TestResult) => result.status === 'error');
        const hasWarnings = data.results.some((result: TestResult) => result.status === 'warning');
        
        if (hasErrors) {
          setOverallStatus('error');
        } else if (hasWarnings) {
          setOverallStatus('warning');
        } else {
          setOverallStatus('success');
        }
      } else {
        setResults([{
          test: 'API 호출',
          status: 'error',
          message: '데이터베이스 테스트 API 호출 실패',
          details: data.error || '알 수 없는 오류'
        }]);
        setOverallStatus('error');
      }
    } catch (error) {
      setResults([{
        test: 'API 호출',
        status: 'error',
        message: '네트워크 오류 또는 API 엔드포인트 없음',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }]);
      setOverallStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">성공</Badge>;
      case 'error':
        return <Badge variant="destructive">오류</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">경고</Badge>;
      default:
        return <Badge variant="outline">대기</Badge>;
    }
  };

  const getOverallStatusAlert = () => {
    switch (overallStatus) {
      case 'success':
        return (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              모든 데이터베이스 연결 테스트가 성공적으로 완료되었습니다.
            </AlertDescription>
          </Alert>
        );
      case 'error':
        return (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              데이터베이스 연결에 문제가 있습니다. 아래 결과를 확인해주세요.
            </AlertDescription>
          </Alert>
        );
      case 'warning':
        return (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              일부 경고사항이 있습니다. 아래 결과를 확인해주세요.
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">데이터베이스 연결 테스트</h1>
        <p className="text-gray-600">
          Supabase 데이터베이스 연결 상태를 확인하고 다양한 테스트를 수행합니다.
        </p>
      </div>

      {getOverallStatusAlert()}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            테스트 실행
          </CardTitle>
          <CardDescription>
            데이터베이스 연결, 스키마, 권한 등을 종합적으로 테스트합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runDatabaseTests} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                테스트 실행 중...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                데이터베이스 테스트 실행
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>테스트 결과</CardTitle>
            <CardDescription>
              총 {results.length}개의 테스트가 실행되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                {result.details && (
                  <div className="bg-gray-50 p-3 rounded text-sm font-mono text-gray-700">
                    {result.details}
                  </div>
                )}
                {result.duration && (
                  <p className="text-xs text-gray-500 mt-2">
                    실행 시간: {result.duration}ms
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>테스트 항목</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">연결 테스트</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 환경 변수 확인</li>
                <li>• Supabase 클라이언트 연결</li>
                <li>• 데이터베이스 연결</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">스키마 테스트</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 테이블 존재 확인</li>
                <li>• 권한 확인</li>
                <li>• 샘플 쿼리 실행</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
