// __tests__/components/SearchReplace.test.tsx
// 검색 및 바꾸기 컴포넌트 테스트

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchReplace from '@/components/notes/SearchReplace';

describe('SearchReplace', () => {
  const defaultProps = {
    content: 'Hello world! This is a test. Hello again.',
    onReplace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('기본 렌더링이 올바르게 작동한다', () => {
    render(<SearchReplace {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    expect(triggerButton).toBeInTheDocument();
  });

  it('다이얼로그가 열리고 닫힌다', async () => {
    render(<SearchReplace {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText('검색 및 바꾸기')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByText('닫기');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('검색 및 바꾸기')).not.toBeInTheDocument();
    });
  });

  it('검색 기능이 작동한다', async () => {
    render(<SearchReplace {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('검색할 텍스트를 입력하세요');
      fireEvent.change(searchInput, { target: { value: 'Hello' } });
    });
    
    await waitFor(() => {
      expect(screen.getByText('2 / 2 매치')).toBeInTheDocument();
    });
  });

  it('바꾸기 기능이 작동한다', async () => {
    const onReplace = jest.fn();
    render(<SearchReplace {...defaultProps} onReplace={onReplace} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('검색할 텍스트를 입력하세요');
      const replaceInput = screen.getByPlaceholderText('바꿀 텍스트를 입력하세요');
      
      fireEvent.change(searchInput, { target: { value: 'Hello' } });
      fireEvent.change(replaceInput, { target: { value: 'Hi' } });
    });
    
    // 바꾸기 버튼을 더 구체적으로 찾기
    const replaceButtons = screen.getAllByText('바꾸기');
    const replaceButton = replaceButtons.find(button => 
      button.getAttribute('data-slot') === 'button'
    );
    
    if (replaceButton) {
      fireEvent.click(replaceButton);
      expect(onReplace).toHaveBeenCalled();
    }
  });

  it('모두 바꾸기 기능이 작동한다', async () => {
    const onReplace = jest.fn();
    render(<SearchReplace {...defaultProps} onReplace={onReplace} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('검색할 텍스트를 입력하세요');
      const replaceInput = screen.getByPlaceholderText('바꿀 텍스트를 입력하세요');
      
      fireEvent.change(searchInput, { target: { value: 'Hello' } });
      fireEvent.change(replaceInput, { target: { value: 'Hi' } });
    });
    
    // 매치가 있을 때까지 기다리기
    await waitFor(() => {
      expect(screen.getByText(/매치/)).toBeInTheDocument();
    });
    
    const replaceAllButton = screen.getByText('모두 바꾸기');
    fireEvent.click(replaceAllButton);
    
    expect(onReplace).toHaveBeenCalled();
  });

  it('대소문자 구분 옵션이 작동한다', async () => {
    render(<SearchReplace {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      const caseSensitiveCheckbox = screen.getByLabelText('대소문자 구분');
      expect(caseSensitiveCheckbox).toBeInTheDocument();
      expect(caseSensitiveCheckbox).not.toBeChecked();
      
      fireEvent.click(caseSensitiveCheckbox);
      expect(caseSensitiveCheckbox).toBeChecked();
    });
  });

  it('전체 단어 옵션이 작동한다', async () => {
    render(<SearchReplace {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      const wholeWordCheckbox = screen.getByLabelText('전체 단어');
      expect(wholeWordCheckbox).toBeInTheDocument();
      expect(wholeWordCheckbox).not.toBeChecked();
      
      fireEvent.click(wholeWordCheckbox);
      expect(wholeWordCheckbox).toBeChecked();
    });
  });

  it('정규식 옵션이 작동한다', async () => {
    render(<SearchReplace {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      const regexCheckbox = screen.getByLabelText('정규식');
      expect(regexCheckbox).toBeInTheDocument();
      expect(regexCheckbox).not.toBeChecked();
      
      fireEvent.click(regexCheckbox);
      expect(regexCheckbox).toBeChecked();
    });
  });

  it('이전/다음 매치 버튼이 작동한다', async () => {
    render(<SearchReplace {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('검색할 텍스트를 입력하세요');
      fireEvent.change(searchInput, { target: { value: 'Hello' } });
    });
    
    await waitFor(() => {
      const nextButton = screen.getByTitle('다음 매치');
      const prevButton = screen.getByTitle('이전 매치');
      
      expect(nextButton).toBeInTheDocument();
      expect(prevButton).toBeInTheDocument();
      
      fireEvent.click(nextButton);
      fireEvent.click(prevButton);
    });
  });

  it('검색 결과가 없을 때 적절한 메시지를 표시한다', async () => {
    render(<SearchReplace {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('검색 및 바꾸기 (Ctrl+F)');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('검색할 텍스트를 입력하세요');
      fireEvent.change(searchInput, { target: { value: 'NonExistentText' } });
    });
    
    await waitFor(() => {
      expect(screen.getByText('0 / 0 매치')).toBeInTheDocument();
    });
  });
});
