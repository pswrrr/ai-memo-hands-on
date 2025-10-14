// __tests__/Pagination.test.tsx
// Pagination 컴포넌트 테스트 - 페이지네이션 UI 컴포넌트 검증
// 페이지 번호 표시, 이전/다음 버튼, 페이지 변경 이벤트 등을 테스트
// components/notes/Pagination.tsx, components/ui/button.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '@/components/notes/Pagination';

describe('Pagination', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('페이지 번호가 올바르게 표시되어야 함', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('현재 페이지가 활성화되어야 함', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('bg-primary'); // 활성 상태 스타일
  });

  it('이전 버튼이 첫 페이지에서 비활성화되어야 함', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByText('이전');
    expect(prevButton).toBeDisabled();
  });

  it('다음 버튼이 마지막 페이지에서 비활성화되어야 함', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByText('다음');
    expect(nextButton).toBeDisabled();
  });

  it('페이지 클릭 시 올바른 콜백이 호출되어야 함', () => {
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    fireEvent.click(screen.getByText('4'));
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('이전 버튼 클릭 시 올바른 콜백이 호출되어야 함', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    fireEvent.click(screen.getByText('이전'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('다음 버튼 클릭 시 올바른 콜백이 호출되어야 함', () => {
    render(
      <Pagination
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
      />
    );

    fireEvent.click(screen.getByText('다음'));
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('총 페이지가 1개 이하면 렌더링되지 않아야 함', () => {
    const { container } = render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('많은 페이지에서 현재 페이지 중심으로 표시되어야 함', () => {
    render(
      <Pagination
        currentPage={10}
        totalPages={20}
        onPageChange={mockOnPageChange}
      />
    );

    // 8, 9, 10, 11, 12가 표시되어야 함
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
