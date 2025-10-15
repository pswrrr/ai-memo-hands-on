import { render, screen, fireEvent } from '@testing-library/react';
import RegenerateConfirmDialog from '@/components/notes/RegenerateConfirmDialog';

describe('RegenerateConfirmDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('요약 재생성 다이얼로그가 올바르게 렌더링되어야 한다', () => {
    render(
      <RegenerateConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        type="summary"
        isLoading={false}
      />
    );

    expect(screen.getByText('요약 재생성')).toBeInTheDocument();
    expect(screen.getByText(/기존 요약을 삭제하고 새로운 요약을 생성하시겠습니까/)).toBeInTheDocument();
    expect(screen.getByText('취소')).toBeInTheDocument();
    expect(screen.getByText('재생성')).toBeInTheDocument();
  });

  it('태그 재생성 다이얼로그가 올바르게 렌더링되어야 한다', () => {
    render(
      <RegenerateConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        type="tags"
        isLoading={false}
      />
    );

    expect(screen.getByText('태그 재생성')).toBeInTheDocument();
    expect(screen.getByText(/기존 태그을 삭제하고 새로운 태그을 생성하시겠습니까/)).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 onClose가 호출되어야 한다', () => {
    render(
      <RegenerateConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        type="summary"
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByText('취소'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('재생성 버튼 클릭 시 onConfirm이 호출되어야 한다', () => {
    render(
      <RegenerateConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        type="summary"
        isLoading={false}
      />
    );

    fireEvent.click(screen.getByText('재생성'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('로딩 중일 때 버튼이 비활성화되어야 한다', () => {
    render(
      <RegenerateConfirmDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        type="summary"
        isLoading={true}
      />
    );

    expect(screen.getByText('취소')).toBeDisabled();
    expect(screen.getByText('재생성 중...')).toBeInTheDocument();
  });

  it('다이얼로그가 닫혀있을 때는 렌더링되지 않아야 한다', () => {
    render(
      <RegenerateConfirmDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        type="summary"
        isLoading={false}
      />
    );

    expect(screen.queryByText('요약 재생성')).not.toBeInTheDocument();
  });
});

