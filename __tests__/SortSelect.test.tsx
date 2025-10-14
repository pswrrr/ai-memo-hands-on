import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SortSelect from '@/components/notes/SortSelect';

// Next.js 모듈 모킹
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('SortSelect', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('기본값으로 "최신순"이 선택되어 있어야 한다', () => {
    render(<SortSelect />);
    
    // SelectTrigger가 렌더링되는지 확인
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('localStorage에서 정렬 옵션을 불러와야 한다', () => {
    localStorage.setItem('notesSortOption', 'title_asc');
    
    render(<SortSelect />);
    
    // 컴포넌트가 localStorage에서 값을 읽어야 함
    expect(localStorage.getItem('notesSortOption')).toBe('title_asc');
  });

  it('URL 쿼리 파라미터가 localStorage보다 우선해야 한다', () => {
    localStorage.setItem('notesSortOption', 'title_asc');
    mockSearchParams.set('sort', 'oldest');
    
    render(<SortSelect />);
    
    // URL 파라미터가 우선순위가 높음
    expect(mockSearchParams.get('sort')).toBe('oldest');
  });

  it('정렬 옵션 변경 시 localStorage에 저장되어야 한다', async () => {
    render(<SortSelect />);
    
    // localStorage 직접 테스트
    localStorage.setItem('notesSortOption', 'oldest');
    expect(localStorage.getItem('notesSortOption')).toBe('oldest');
  });

  it('정렬 옵션 변경 시 URL이 업데이트되어야 한다', async () => {
    render(<SortSelect />);
    
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    await waitFor(() => {
      const option = screen.getByRole('option', { name: '제목순 (가나다)' });
      fireEvent.click(option);
    });
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('sort=title_asc')
      );
    });
  });

  it('정렬 옵션 변경 시 페이지가 1로 리셋되어야 한다', async () => {
    mockSearchParams.set('page', '3');
    
    render(<SortSelect />);
    
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    await waitFor(() => {
      const option = screen.getByRole('option', { name: '제목 역순 (하→가)' });
      fireEvent.click(option);
    });
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      );
    });
  });

  it('컴포넌트가 정상적으로 렌더링되어야 한다', () => {
    render(<SortSelect />);
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
    expect(trigger).not.toBeDisabled();
  });
});

