'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // 에러 로깅
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 에러 통계 업데이트
    this.logError(error, errorInfo);
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    };

    // 개발 환경에서 콘솔 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary Error:', errorData);
    }

    // TODO: 실제 에러 로깅 시스템에 전송
    // sendErrorToLoggingService(errorData);
  };

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1
      }));
    }
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportError = () => {
    const errorReport = {
      message: this.state.error?.message || 'Unknown error',
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // TODO: 에러 리포트를 관리자에게 전송
    console.log('Error Report:', errorReport);
    
    // 사용자에게 피드백 제공
    alert('에러가 관리자에게 전송되었습니다. 빠른 시일 내에 해결하겠습니다.');
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isLastRetry = this.state.retryCount === this.maxRetries - 1;

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl">문제가 발생했습니다</CardTitle>
              <CardDescription>
                예상치 못한 오류가 발생했습니다. 아래 옵션 중 하나를 선택해주세요.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    다시 시도 ({this.state.retryCount + 1}/{this.maxRetries})
                  </Button>
                )}

                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  대시보드로 이동
                </Button>

                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  페이지 새로고침
                </Button>

                <Button 
                  onClick={this.handleReportError}
                  variant="outline"
                  className="w-full"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  문제 신고
                </Button>
              </div>

              {isLastRetry && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    최대 재시도 횟수에 도달했습니다. 문제가 지속되면 관리자에게 문의해주세요.
                  </AlertDescription>
                </Alert>
              )}

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600">
                    개발자 정보 (클릭하여 확장)
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC로 사용할 수 있는 함수
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// 훅으로 에러 바운더리 상태를 관리
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}

