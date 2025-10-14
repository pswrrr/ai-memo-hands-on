// __tests__/NoteCard.test.tsx
// NoteCard 컴포넌트 테스트 - 노트 카드 UI 컴포넌트 검증
// 제목 말줄임, 날짜 포맷팅, 링크 동작 등을 테스트
// components/notes/NoteCard.tsx, components/ui/card.tsx

import { render, screen } from '@testing-library/react';
import NoteCard from '@/components/notes/NoteCard';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('NoteCard', () => {
  const mockNote = {
    id: 'note-123',
    title: '테스트 노트 제목',
    content: '테스트 노트 내용입니다.',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  };

  it('노트 정보가 올바르게 표시되어야 함', () => {
    render(<NoteCard {...mockNote} />);

    expect(screen.getByText('테스트 노트 제목')).toBeInTheDocument();
    expect(screen.getByText('테스트 노트 내용입니다.')).toBeInTheDocument();
  });

  it('긴 제목은 말줄임표로 표시되어야 함', () => {
    const longTitle = '이것은 매우 긴 노트 제목입니다. 30자를 초과하는 제목이므로 말줄임표로 표시되어야 합니다.';
    const noteWithLongTitle = { ...mockNote, title: longTitle };

    render(<NoteCard {...noteWithLongTitle} />);

    expect(screen.getByText('이것은 매우 긴 노트 제목입니다...')).toBeInTheDocument();
  });

  it('긴 내용은 미리보기로 표시되어야 함', () => {
    const longContent = 'a'.repeat(150); // 150자 내용
    const noteWithLongContent = { ...mockNote, content: longContent };

    render(<NoteCard {...noteWithLongContent} />);

    const preview = screen.getByText(/^a{100}\.\.\.$/);
    expect(preview).toBeInTheDocument();
  });

  it('내용이 없을 때 기본 메시지가 표시되어야 함', () => {
    const noteWithoutContent = { ...mockNote, content: null };

    render(<NoteCard {...noteWithContent} />);

    expect(screen.getByText('내용이 없습니다')).toBeInTheDocument();
  });

  it('날짜가 올바르게 포맷팅되어야 함', () => {
    render(<NoteCard {...mockNote} />);

    // 한국어 날짜 포맷 확인
    expect(screen.getByText('2024. 1. 15.')).toBeInTheDocument();
  });

  it('수정일이 다를 때 시간이 표시되어야 함', () => {
    const noteWithDifferentUpdateTime = {
      ...mockNote,
      updatedAt: new Date('2024-01-15T15:30:00Z'),
    };

    render(<NoteCard {...noteWithDifferentUpdateTime} />);

    expect(screen.getByText('15:30')).toBeInTheDocument();
  });

  it('올바른 링크가 생성되어야 함', () => {
    render(<NoteCard {...mockNote} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/dashboard/notes/note-123');
  });

  it('카드에 호버 효과가 있어야 함', () => {
    render(<NoteCard {...mockNote} />);

    const card = screen.getByRole('link');
    expect(card).toHaveClass('hover:shadow-md');
  });
});
