// __tests__/NoteDetail.test.tsx
// NoteDetail 컴포넌트 테스트 - 노트 상세 뷰 컴포넌트 검증
// 노트 정보 표시, 날짜 포맷팅, 버튼 동작 등을 테스트
// components/notes/NoteDetail.tsx, components/ui/card.tsx, components/ui/button.tsx

import { render, screen } from '@testing-library/react';
import NoteDetail from '@/components/notes/NoteDetail';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('NoteDetail', () => {
  const mockNote = {
    id: 'note-123',
    title: '테스트 노트 제목',
    content: '테스트 노트 내용입니다.\n여러 줄의 내용이 있습니다.',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  it('노트 정보가 올바르게 표시되어야 함', () => {
    render(<NoteDetail note={mockNote} />);

    expect(screen.getByText('테스트 노트 제목')).toBeInTheDocument();
    expect(screen.getByText('테스트 노트 내용입니다.')).toBeInTheDocument();
  });

  it('내용이 없을 때 기본 메시지가 표시되어야 함', () => {
    const noteWithoutContent = { ...mockNote, content: null };

    render(<NoteDetail note={noteWithoutContent} />);

    expect(screen.getByText('내용이 없습니다.')).toBeInTheDocument();
  });

  it('수정된 노트는 수정일이 표시되어야 함', () => {
    const updatedNote = {
      ...mockNote,
      updatedAt: new Date('2024-01-15T15:30:00Z'),
    };

    render(<NoteDetail note={updatedNote} />);

    expect(screen.getByText(/수정일:/)).toBeInTheDocument();
  });

  it('수정되지 않은 노트는 수정일이 표시되지 않아야 함', () => {
    render(<NoteDetail note={mockNote} />);

    expect(screen.queryByText(/수정일:/)).not.toBeInTheDocument();
  });

  it('올바른 링크가 생성되어야 함', () => {
    render(<NoteDetail note={mockNote} />);

    const dashboardLink = screen.getByText('대시보드로 돌아가기');
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard');

    const editLink = screen.getByText('수정');
    expect(editLink.closest('a')).toHaveAttribute('href', '/dashboard/notes/note-123/edit');
  });

  it('노트 ID가 표시되어야 함', () => {
    render(<NoteDetail note={mockNote} />);

    expect(screen.getByText('노트 ID: note-123')).toBeInTheDocument();
  });

  it('여러 줄 내용이 올바르게 표시되어야 함', () => {
    render(<NoteDetail note={mockNote} />);

    const contentElement = screen.getByText(/테스트 노트 내용입니다/);
    expect(contentElement).toHaveClass('whitespace-pre-wrap');
  });

  it('버튼들이 올바르게 렌더링되어야 함', () => {
    render(<NoteDetail note={mockNote} />);

    expect(screen.getByText('대시보드로 돌아가기')).toBeInTheDocument();
    expect(screen.getByText('수정')).toBeInTheDocument();
    expect(screen.getByText('삭제')).toBeInTheDocument();
  });

  it('삭제 버튼이 destructive 스타일이어야 함', () => {
    render(<NoteDetail note={mockNote} />);

    const deleteButton = screen.getByText('삭제');
    expect(deleteButton).toHaveClass('bg-destructive');
  });
});
