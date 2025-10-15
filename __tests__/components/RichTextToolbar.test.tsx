// __tests__/components/RichTextToolbar.test.tsx
// 리치 텍스트 툴바 컴포넌트 테스트

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RichTextToolbar from '@/components/notes/RichTextToolbar';

describe('RichTextToolbar', () => {
  const defaultProps = {
    onFormatChange: jest.fn(),
    onThemeToggle: jest.fn(),
    isDarkMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('기본 렌더링이 올바르게 작동한다', () => {
    render(<RichTextToolbar {...defaultProps} />);
    
    expect(screen.getByTitle('굵게 (Ctrl+B)')).toBeInTheDocument();
    expect(screen.getByTitle('기울임 (Ctrl+I)')).toBeInTheDocument();
    expect(screen.getByTitle('밑줄 (Ctrl+U)')).toBeInTheDocument();
    expect(screen.getByTitle('왼쪽 정렬')).toBeInTheDocument();
    expect(screen.getByTitle('가운데 정렬')).toBeInTheDocument();
    expect(screen.getByTitle('오른쪽 정렬')).toBeInTheDocument();
  });

  it('헤딩 스타일 선택이 렌더링된다', () => {
    render(<RichTextToolbar {...defaultProps} />);
    
    expect(screen.getByText('스타일')).toBeInTheDocument();
  });

  it('포맷 버튼 클릭 시 onFormatChange가 호출된다', () => {
    const onFormatChange = jest.fn();
    render(<RichTextToolbar {...defaultProps} onFormatChange={onFormatChange} />);
    
    const boldButton = screen.getByTitle('굵게 (Ctrl+B)');
    fireEvent.click(boldButton);
    
    expect(onFormatChange).toHaveBeenCalledWith('bold');
  });

  it('정렬 버튼 클릭 시 onFormatChange가 호출된다', () => {
    const onFormatChange = jest.fn();
    render(<RichTextToolbar {...defaultProps} onFormatChange={onFormatChange} />);
    
    const centerButton = screen.getByTitle('가운데 정렬');
    fireEvent.click(centerButton);
    
    expect(onFormatChange).toHaveBeenCalledWith('align', 'center');
  });

  it('테마 토글 버튼 클릭 시 onThemeToggle이 호출된다', () => {
    const onThemeToggle = jest.fn();
    render(<RichTextToolbar {...defaultProps} onThemeToggle={onThemeToggle} />);
    
    const themeButton = screen.getByTitle('다크 모드로 전환');
    fireEvent.click(themeButton);
    
    expect(onThemeToggle).toHaveBeenCalled();
  });

  it('헤딩 스타일 변경 시 onFormatChange가 호출된다', () => {
    const onFormatChange = jest.fn();
    render(<RichTextToolbar {...defaultProps} onFormatChange={onFormatChange} />);
    
    const headingSelect = screen.getByText('스타일');
    fireEvent.click(headingSelect);
    
    const h1Option = screen.getByText('제목 1');
    fireEvent.click(h1Option);
    
    expect(onFormatChange).toHaveBeenCalledWith('heading', 'h1');
  });

  it('다크 모드일 때 올바른 아이콘이 표시된다', () => {
    render(<RichTextToolbar {...defaultProps} isDarkMode={true} />);
    
    expect(screen.getByTitle('라이트 모드로 전환')).toBeInTheDocument();
  });

  it('라이트 모드일 때 올바른 아이콘이 표시된다', () => {
    render(<RichTextToolbar {...defaultProps} isDarkMode={false} />);
    
    expect(screen.getByTitle('다크 모드로 전환')).toBeInTheDocument();
  });

  it('커스텀 클래스명이 적용된다', () => {
    render(<RichTextToolbar {...defaultProps} className="custom-toolbar" />);
    
    const toolbar = screen.getByTitle('굵게 (Ctrl+B)').closest('.custom-toolbar');
    expect(toolbar).toBeInTheDocument();
  });

  it('활성화된 포맷 버튼이 올바르게 표시된다', () => {
    const onFormatChange = jest.fn();
    render(<RichTextToolbar {...defaultProps} onFormatChange={onFormatChange} />);
    
    const boldButton = screen.getByTitle('굵게 (Ctrl+B)');
    fireEvent.click(boldButton);
    
    // 버튼이 활성화된 상태로 표시되는지 확인
    expect(boldButton).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('모든 헤딩 옵션이 표시된다', () => {
    render(<RichTextToolbar {...defaultProps} />);
    
    const headingSelect = screen.getByText('스타일');
    fireEvent.click(headingSelect);
    
    expect(screen.getByText('일반 텍스트')).toBeInTheDocument();
    expect(screen.getByText('제목 1')).toBeInTheDocument();
    expect(screen.getByText('제목 2')).toBeInTheDocument();
    expect(screen.getByText('제목 3')).toBeInTheDocument();
  });
});
