import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import DeleteConfirmDialog from '@/components/notes/DeleteConfirmDialog';
import { deleteNote } from '@/app/actions/notes';
import { toast } from 'sonner';

// 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/actions/notes', () => ({
  deleteNote: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('DeleteConfirmDialog', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockOnOpenChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it('다이얼로그가 열릴 때 노트 제목이 표시되어야 한다', () => {
    render(
      <DeleteConfirmDialog
        noteId="test-note-id"
        noteTitle="테스트 노트"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByText(/테스트 노트/)).toBeInTheDocument();
    expect(screen.getByText(/노트 삭제 확인/)).toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 다이얼로그가 닫혀야 한다', () => {
    render(
      <DeleteConfirmDialog
        noteId="test-note-id"
        noteTitle="테스트 노트"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('삭제 버튼 클릭 시 deleteNote 액션이 호출되어야 한다', async () => {
    (deleteNote as jest.Mock).mockResolvedValue({
      success: true,
    });

    render(
      <DeleteConfirmDialog
        noteId="test-note-id"
        noteTitle="테스트 노트"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(deleteNote).toHaveBeenCalledWith('test-note-id');
    });
  });

  it('삭제 성공 시 성공 메시지가 표시되고 대시보드로 이동해야 한다', async () => {
    (deleteNote as jest.Mock).mockResolvedValue({
      success: true,
    });

    render(
      <DeleteConfirmDialog
        noteId="test-note-id"
        noteTitle="테스트 노트"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('노트가 휴지통으로 이동되었습니다');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('삭제 실패 시 오류 메시지가 표시되어야 한다', async () => {
    (deleteNote as jest.Mock).mockResolvedValue({
      success: false,
      error: '삭제 권한이 없습니다',
    });

    render(
      <DeleteConfirmDialog
        noteId="test-note-id"
        noteTitle="테스트 노트"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('삭제 권한이 없습니다');
      expect(screen.getByText('삭제 권한이 없습니다')).toBeInTheDocument();
    });
  });

  it('로딩 중일 때 버튼이 비활성화되어야 한다', async () => {
    (deleteNote as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000))
    );

    render(
      <DeleteConfirmDialog
        noteId="test-note-id"
        noteTitle="테스트 노트"
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const deleteButton = screen.getByText('삭제');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('삭제 중...')).toBeInTheDocument();
    });
  });
});

