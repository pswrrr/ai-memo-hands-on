// __tests__/components/MarkdownEditor.test.tsx
// 마크다운 에디터 컴포넌트 테스트

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownEditor from '@/components/notes/MarkdownEditor';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('MarkdownEditor', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: '마크다운을 입력하세요...',
    maxLength: 1000,
    rows: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('기본 렌더링이 올바르게 작동한다', () => {
    render(<MarkdownEditor {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('마크다운을 입력하세요...')).toBeInTheDocument();
    expect(screen.getByText('0/1,000')).toBeInTheDocument();
  });

  it('마크다운 툴바 버튼들이 렌더링된다', () => {
    render(<MarkdownEditor {...defaultProps} />);
    
    // 포맷 버튼들
    expect(screen.getByTitle('굵게 (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTitle('기울임 (Ctrl+I)')).toBeInTheDocument();
    expect(screen.getByTitle('인라인 코드 (Ctrl+`)')).toBeInTheDocument();
    
    // 헤딩 버튼들
    expect(screen.getByTitle('제목 1')).toBeInTheDocument();
    expect(screen.getByTitle('제목 2')).toBeInTheDocument();
    expect(screen.getByTitle('제목 3')).toBeInTheDocument();
    
    // 리스트 버튼들
    expect(screen.getByTitle('순서 없는 리스트')).toBeInTheDocument();
    expect(screen.getByTitle('순서 있는 리스트')).toBeInTheDocument();
    expect(screen.getByTitle('인용구')).toBeInTheDocument();
    
    // 링크 및 코드 블록
    expect(screen.getByTitle('링크 (Ctrl+K)')).toBeInTheDocument();
    expect(screen.getByTitle('코드 블록 (Ctrl+Enter)')).toBeInTheDocument();
  });

  it('미리보기 토글이 작동한다', () => {
    render(<MarkdownEditor {...defaultProps} value="# 제목\n내용" />);
    
    const previewButton = screen.getByTitle('미리보기 모드');
    fireEvent.click(previewButton);
    
    expect(screen.getByTitle('편집 모드')).toBeInTheDocument();
  });

  it('다크 모드 토글이 작동한다', () => {
    render(<MarkdownEditor {...defaultProps} />);
    
    const themeButton = screen.getByTitle('다크 모드');
    fireEvent.click(themeButton);
    
    expect(screen.getByTitle('라이트 모드')).toBeInTheDocument();
  });

  it('마크다운 단축키가 작동한다', () => {
    const onChange = jest.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} value="선택된 텍스트" />);
    
    const textarea = screen.getByPlaceholderText('마크다운을 입력하세요...');
    
    // 텍스트 선택
    textarea.setSelectionRange(0, 3);
    
    // Ctrl+B 단축키
    fireEvent.keyDown(textarea, { key: 'b', ctrlKey: true });
    
    expect(onChange).toHaveBeenCalledWith('**선택된** 텍스트');
  });

  it('포맷 버튼 클릭 시 마크다운이 삽입된다', () => {
    const onChange = jest.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} value="텍스트" />);
    
    const boldButton = screen.getByTitle('굵게 (Ctrl+B)');
    fireEvent.click(boldButton);
    
    expect(onChange).toHaveBeenCalledWith('**텍스트**');
  });

  it('헤딩 버튼 클릭 시 헤딩이 삽입된다', () => {
    const onChange = jest.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} value="제목" />);
    
    const h1Button = screen.getByTitle('제목 1');
    fireEvent.click(h1Button);
    
    expect(onChange).toHaveBeenCalledWith('# 제목');
  });

  it('리스트 버튼 클릭 시 리스트가 삽입된다', () => {
    const onChange = jest.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} value="항목" />);
    
    const listButton = screen.getByTitle('순서 없는 리스트');
    fireEvent.click(listButton);
    
    expect(onChange).toHaveBeenCalledWith('- 항목\n');
  });

  it('링크 버튼 클릭 시 링크가 삽입된다', () => {
    const onChange = jest.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} value="텍스트" />);
    
    const linkButton = screen.getByTitle('링크 (Ctrl+K)');
    fireEvent.click(linkButton);
    
    expect(onChange).toHaveBeenCalledWith('[텍스트](https://example.com)');
  });

  it('코드 블록 버튼 클릭 시 코드 블록이 삽입된다', () => {
    const onChange = jest.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} value="코드" />);
    
    const codeButton = screen.getByTitle('코드 블록 (Ctrl+Enter)');
    fireEvent.click(codeButton);
    
    expect(onChange).toHaveBeenCalledWith('\n```\n코드\n```\n');
  });

  it('인용구 버튼 클릭 시 인용구가 삽입된다', () => {
    const onChange = jest.fn();
    render(<MarkdownEditor {...defaultProps} onChange={onChange} value="인용" />);
    
    const quoteButton = screen.getByTitle('인용구');
    fireEvent.click(quoteButton);
    
    expect(onChange).toHaveBeenCalledWith('> 인용');
  });

  it('글자 수가 실시간으로 업데이트된다', () => {
    const { rerender } = render(<MarkdownEditor {...defaultProps} value="테스트" />);
    
    expect(screen.getByText('3/1,000')).toBeInTheDocument();
    
    rerender(<MarkdownEditor {...defaultProps} value="테스트 텍스트" />);
    
    expect(screen.getByText('6/1,000')).toBeInTheDocument();
  });

  it('최대 글자 수 제한이 작동한다', () => {
    const longText = 'a'.repeat(1001);
    render(<MarkdownEditor {...defaultProps} value={longText} maxLength={1000} />);
    
    const textarea = screen.getByPlaceholderText('마크다운을 입력하세요...');
    expect(textarea).toHaveAttribute('maxLength', '1000');
  });

  it('커스텀 클래스명이 적용된다', () => {
    render(<MarkdownEditor {...defaultProps} className="custom-class" />);
    
    const editor = screen.getByPlaceholderText('마크다운을 입력하세요...').closest('.custom-class');
    expect(editor).toBeInTheDocument();
  });
});
