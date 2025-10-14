// __tests__/NoteEditForm.test.tsx
// NoteEditForm 컴포넌트 테스트 - 노트 편집 폼 검증
// 폼 렌더링, 유효성 검증, 자동 저장, 수동 저장 등을 테스트
// components/notes/NoteEditForm.tsx, hooks/useAutoSave.ts

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoteEditForm from '@/components/notes/NoteEditForm';
import { updateNote } from '@/app/actions/notes';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

// Mock server action
jest.mock('@/app/actions/notes', () => ({
  updateNote: jest.fn(),
}));

const mockUpdateNote = updateNote as jest.MockedFunction<typeof updateNote>;

describe('NoteEditForm', () => {
  const mockNote = {
    id: 'note-123',
    title: 'Test Note',
    content: 'Test content',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('노트 정보가 올바르게 표시되어야 함', () => {
    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument();
  });

  it('제목과 본문을 수정할 수 있어야 함', async () => {
    const user = userEvent.setup();
    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    const titleInput = screen.getByDisplayValue('Test Note');
    const contentTextarea = screen.getByDisplayValue('Test content');

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');

    await user.clear(contentTextarea);
    await user.type(contentTextarea, 'Updated content');

    expect(titleInput).toHaveValue('Updated Title');
    expect(contentTextarea).toHaveValue('Updated content');
  });

  it('제목이 비어있을 때 저장 버튼이 비활성화되어야 함', async () => {
    const user = userEvent.setup();
    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    const titleInput = screen.getByDisplayValue('Test Note');
    const saveButton = screen.getByText('저장');

    await user.clear(titleInput);

    expect(saveButton).toBeDisabled();
  });

  it('제목이 255자를 초과할 때 유효성 검증이 작동해야 함', async () => {
    const user = userEvent.setup();
    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    const titleInput = screen.getByDisplayValue('Test Note');
    const longTitle = 'a'.repeat(256);

    await user.clear(titleInput);
    await user.type(titleInput, longTitle);

    expect(titleInput).toHaveClass('border-red-500');
  });

  it('본문이 10,000자를 초과할 때 유효성 검증이 작동해야 함', async () => {
    const user = userEvent.setup();
    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    const contentTextarea = screen.getByDisplayValue('Test content');
    const longContent = 'a'.repeat(10001);

    await user.clear(contentTextarea);
    await user.type(contentTextarea, longContent);

    expect(contentTextarea).toHaveClass('border-red-500');
  });

  it('수동 저장이 올바르게 작동해야 함', async () => {
    const user = userEvent.setup();
    mockUpdateNote.mockResolvedValue({
      success: true,
      data: { ...mockNote, title: 'Updated Title' },
    });

    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    const titleInput = screen.getByDisplayValue('Test Note');
    const saveButton = screen.getByText('저장');

    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateNote).toHaveBeenCalledWith('note-123', 'Updated Title', 'Test content');
    });
  });

  it('저장 실패 시 에러 메시지가 표시되어야 함', async () => {
    const user = userEvent.setup();
    mockUpdateNote.mockResolvedValue({
      success: false,
      error: '저장에 실패했습니다',
    });

    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    const saveButton = screen.getByText('저장');
    await user.click(saveButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('저장에 실패했습니다');
    });

    alertSpy.mockRestore();
  });

  it('취소 버튼이 올바르게 작동해야 함', async () => {
    const user = userEvent.setup();
    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    const cancelButton = screen.getByText('취소');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('변경사항이 있을 때 취소 시 확인 메시지가 표시되어야 함', async () => {
    const user = userEvent.setup();
    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => false);

    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    const titleInput = screen.getByDisplayValue('Test Note');
    const cancelButton = screen.getByText('취소');

    await user.clear(titleInput);
    await user.type(titleInput, 'Changed');
    await user.click(cancelButton);

    expect(confirmSpy).toHaveBeenCalledWith('변경사항이 있습니다. 정말 취소하시겠습니까?');
    expect(mockOnCancel).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('저장 상태 표시기가 올바르게 렌더링되어야 함', () => {
    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    expect(screen.getByText('대기 중')).toBeInTheDocument();
  });

  it('문자 수 표시가 올바르게 작동해야 함', () => {
    render(<NoteEditForm note={mockNote} onCancel={mockOnCancel} />);

    expect(screen.getByText('10/255')).toBeInTheDocument(); // "Test Note" = 10 characters
    expect(screen.getByText('12/10,000')).toBeInTheDocument(); // "Test content" = 12 characters
  });
});
