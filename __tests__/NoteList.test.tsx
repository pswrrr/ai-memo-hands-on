// __tests__/NoteList.test.tsx
// NoteList 컴포넌트 테스트 - 노트 목록 메인 컴포넌트 검증
// 로딩, 에러, 빈 상태, 노트 목록 표시 등을 테스트
// components/notes/NoteList.tsx, app/actions/notes.ts

import { render, screen, waitFor } from '@testing-library/react';
import NoteList from '@/components/notes/NoteList';
import { getNotes } from '@/app/actions/notes';

// Mock getNotes action
jest.mock('@/app/actions/notes');
const mockGetNotes = getNotes as jest.MockedFunction<typeof getNotes>;

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('NoteList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('로딩 상태가 올바르게 표시되어야 함', () => {
    mockGetNotes.mockImplementation(() => new Promise(() => {})); // 무한 로딩

    render(<NoteList />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('에러 상태가 올바르게 표시되어야 함', async () => {
    mockGetNotes.mockResolvedValue({
      success: false,
      error: '데이터베이스 연결 실패'
    });

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText('노트를 불러올 수 없습니다')).toBeInTheDocument();
      expect(screen.getByText('데이터베이스 연결 실패')).toBeInTheDocument();
    });
  });

  it('빈 상태가 올바르게 표시되어야 함', async () => {
    mockGetNotes.mockResolvedValue({
      success: true,
      data: {
        notes: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalNotes: 0,
          hasNextPage: false,
          hasPrevPage: false,
        }
      }
    });

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText('아직 노트가 없습니다')).toBeInTheDocument();
      expect(screen.getByText('새 노트 작성')).toBeInTheDocument();
    });
  });

  it('노트 목록이 올바르게 표시되어야 함', async () => {
    const mockNotes = [
      {
        id: 'note-1',
        title: '첫 번째 노트',
        content: '첫 번째 노트 내용',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'note-2',
        title: '두 번째 노트',
        content: '두 번째 노트 내용',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      }
    ];

    mockGetNotes.mockResolvedValue({
      success: true,
      data: {
        notes: mockNotes,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalNotes: 2,
          hasNextPage: false,
          hasPrevPage: false,
        }
      }
    });

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText('첫 번째 노트')).toBeInTheDocument();
      expect(screen.getByText('두 번째 노트')).toBeInTheDocument();
    });
  });

  it('페이지네이션이 올바르게 표시되어야 함', async () => {
    const mockNotes = Array.from({ length: 10 }, (_, i) => ({
      id: `note-${i}`,
      title: `노트 ${i + 1}`,
      content: `내용 ${i + 1}`,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    }));

    mockGetNotes.mockResolvedValue({
      success: true,
      data: {
        notes: mockNotes,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalNotes: 25,
          hasNextPage: true,
          hasPrevPage: false,
        }
      }
    });

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('재시도 버튼이 올바르게 작동해야 함', async () => {
    mockGetNotes
      .mockResolvedValueOnce({
        success: false,
        error: '네트워크 오류'
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          notes: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalNotes: 0,
            hasNextPage: false,
            hasPrevPage: false,
          }
        }
      });

    render(<NoteList />);

    await waitFor(() => {
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('다시 시도'));

    await waitFor(() => {
      expect(mockGetNotes).toHaveBeenCalledTimes(2);
    });
  });
});
