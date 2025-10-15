// __tests__/components/RichTextEditor.test.tsx
// 리치 텍스트 에디터 컴포넌트 테스트

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RichTextEditor from '@/components/notes/RichTextEditor';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('RichTextEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: '텍스트를 입력하세요...',
    maxLength: 1000,
    rows: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('기본 렌더링이 올바르게 작동한다', () => {
    render(<RichTextEditor {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('텍스트를 입력하세요...')).toBeInTheDocument();
    expect(screen.getByText('0/1,000')).toBeInTheDocument();
  });

  it('툴바 버튼들이 렌더링된다', () => {
    render(<RichTextEditor {...defaultProps} />);
    
    // 포맷 버튼들
    expect(screen.getByTitle('굵게 (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTitle('기울임 (Ctrl+I)')).toBeInTheDocument();
    expect(screen.getByTitle('밑줄 (Ctrl+U)')).toBeInTheDocument();
    
    // 정렬 버튼들
    expect(screen.getByTitle('왼쪽 정렬')).toBeInTheDocument();
    expect(screen.getByTitle('가운데 정렬')).toBeInTheDocument();
    expect(screen.getByTitle('오른쪽 정렬')).toBeInTheDocument();
    
    // 테마 토글 버튼
    expect(screen.getByTitle('다크 모드로 전환')).toBeInTheDocument();
  });

  it('헤딩 스타일 선택 드롭다운이 렌더링된다', () => {
    render(<RichTextEditor {...defaultProps} />);
    
    expect(screen.getByText('스타일')).toBeInTheDocument();
  });

  it('텍스트 입력 시 onChange가 호출된다', () => {
    const onChange = jest.fn();
    render(<RichTextEditor {...defaultProps} onChange={onChange} />);
    
    const textarea = screen.getByPlaceholderText('텍스트를 입력하세요...');
    fireEvent.change(textarea, { target: { value: '테스트 텍스트' } });
    
    expect(onChange).toHaveBeenCalledWith('테스트 텍스트');
  });

  it('글자 수가 실시간으로 업데이트된다', () => {
    const { rerender } = render(<RichTextEditor {...defaultProps} value="테스트" />);
    
    expect(screen.getByText('3/1,000')).toBeInTheDocument();
    
    rerender(<RichTextEditor {...defaultProps} value="테스트 텍스트" />);
    
    expect(screen.getByText('6/1,000')).toBeInTheDocument();
  });

  it('다크 모드 토글이 작동한다', () => {
    render(<RichTextEditor {...defaultProps} />);
    
    const themeButton = screen.getByTitle('다크 모드로 전환');
    fireEvent.click(themeButton);
    
    expect(screen.getByTitle('라이트 모드로 전환')).toBeInTheDocument();
  });

  it('키보드 단축키가 작동한다', () => {
    const onChange = jest.fn();
    render(<RichTextEditor {...defaultProps} onChange={onChange} value="선택된 텍스트" />);
    
    const textarea = screen.getByPlaceholderText('텍스트를 입력하세요...');
    
    // 텍스트 선택
    textarea.setSelectionRange(0, 3);
    
    // Ctrl+B 단축키
    fireEvent.keyDown(textarea, { key: 'b', ctrlKey: true });
    
    expect(onChange).toHaveBeenCalledWith('**선택된** 텍스트');
  });

  it('포맷 버튼 클릭 시 텍스트가 포맷된다', () => {
    const onChange = jest.fn();
    render(<RichTextEditor {...defaultProps} onChange={onChange} value="테스트" />);
    
    const boldButton = screen.getByTitle('굵게 (Ctrl+B)');
    fireEvent.click(boldButton);
    
    expect(onChange).toHaveBeenCalledWith('**텍스트**');
  });

  it('헤딩 스타일 변경이 작동한다', () => {
    const onChange = jest.fn();
    render(<RichTextEditor {...defaultProps} onChange={onChange} value="제목" />);
    
    const headingSelect = screen.getByText('스타일');
    fireEvent.click(headingSelect);
    
    const h1Option = screen.getByText('제목 1');
    fireEvent.click(h1Option);
    
    expect(onChange).toHaveBeenCalledWith('# 제목');
  });

  it('최대 글자 수 제한이 작동한다', () => {
    const longText = 'a'.repeat(1001);
    render(<RichTextEditor {...defaultProps} value={longText} maxLength={1000} />);
    
    const textarea = screen.getByPlaceholderText('텍스트를 입력하세요...');
    expect(textarea).toHaveAttribute('maxLength', '1000');
  });

  it('커스텀 클래스명이 적용된다', () => {
    render(<RichTextEditor {...defaultProps} className="custom-class" />);
    
    const editor = screen.getByPlaceholderText('텍스트를 입력하세요...').closest('.custom-class');
    expect(editor).toBeInTheDocument();
  });

  it('다크 모드에서 스타일이 변경된다', () => {
    const { rerender } = render(<RichTextEditor {...defaultProps} />);
    
    // 다크 모드 토글
    const themeButton = screen.getByTitle('다크 모드로 전환');
    fireEvent.click(themeButton);
    
    rerender(<RichTextEditor {...defaultProps} />);
    
    const textarea = screen.getByPlaceholderText('텍스트를 입력하세요...');
    expect(textarea).toHaveClass('bg-gray-900', 'text-white');
  });
});
