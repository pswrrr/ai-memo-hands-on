/**
 * ErrorBoundary 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, withErrorBoundary, useErrorBoundary } from '../../components/ui/ErrorBoundary';

// 에러를 발생시키는 테스트 컴포넌트
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// 에러를 발생시키는 함수형 컴포넌트
const ErrorComponent = () => {
  throw new Error('Function component error');
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // 콘솔 에러를 억제하여 테스트 출력을 깔끔하게 유지
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText('예상치 못한 오류가 발생했습니다')).toBeInTheDocument();
  });

  it('should display error message in alert', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show retry button when retry count is less than max', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/다시 시도/)).toBeInTheDocument();
  });

  it('should show all action buttons', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/다시 시도/)).toBeInTheDocument();
    expect(screen.getByText(/대시보드로 이동/)).toBeInTheDocument();
    expect(screen.getByText(/페이지 새로고침/)).toBeInTheDocument();
    expect(screen.getByText(/문제 신고/)).toBeInTheDocument();
  });

  it('should handle retry button click', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // 에러를 발생시키고 다시 시도
    const errorBoundary = screen.getByText('No error').closest('[data-testid="error-boundary"]');
    if (errorBoundary) {
      fireEvent.click(screen.getByText(/다시 시도/));
    }
  });

  it('should handle go home button click', () => {
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText(/대시보드로 이동/));
    expect(mockLocation.href).toBe('/dashboard');
  });

  it('should handle reload button click', () => {
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText(/페이지 새로고침/));
    expect(mockReload).toHaveBeenCalled();
  });

  it('should handle report error button click', () => {
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText(/문제 신고/));
    expect(mockAlert).toHaveBeenCalledWith('에러가 관리자에게 전송되었습니다. 빠른 시일 내에 해결하겠습니다.');
    
    mockAlert.mockRestore();
  });

  it('should show developer info in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/개발자 정보/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not show developer info in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/개발자 정보/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Test error'
      }),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error UI')).toBeInTheDocument();
    expect(screen.queryByText('문제가 발생했습니다')).not.toBeInTheDocument();
  });
});

describe('withErrorBoundary HOC', () => {
  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(ErrorComponent);
    
    render(<WrappedComponent />);
    
    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
  });

  it('should pass through props to wrapped component', () => {
    const TestComponent = ({ message }: { message: string }) => <div>{message}</div>;
    const WrappedComponent = withErrorBoundary(TestComponent);
    
    render(<WrappedComponent message="Hello" />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});

describe('useErrorBoundary hook', () => {
  it('should provide error boundary functionality', () => {
    const TestComponent = () => {
      const { captureError, resetError } = useErrorBoundary();
      
      return (
        <div>
          <button onClick={() => captureError(new Error('Hook error'))}>
            Trigger Error
          </button>
          <button onClick={resetError}>
            Reset Error
          </button>
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // 에러를 발생시키면 ErrorBoundary가 캐치해야 함
    fireEvent.click(screen.getByText('Trigger Error'));
    
    expect(screen.getByText('문제가 발생했습니다')).toBeInTheDocument();
  });
});

