// __tests__/components/MarkdownPreview.test.tsx
// 마크다운 미리보기 컴포넌트 테스트

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarkdownPreview from '@/components/notes/MarkdownPreview';

describe('MarkdownPreview', () => {
  it('기본 렌더링이 올바르게 작동한다', () => {
    render(<MarkdownPreview content="" />);
    
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('헤딩이 올바르게 렌더링된다', () => {
    render(<MarkdownPreview content="# 제목 1\n## 제목 2\n### 제목 3" />);
    
    expect(screen.getByText('제목 1')).toBeInTheDocument();
    expect(screen.getByText('제목 2')).toBeInTheDocument();
    expect(screen.getByText('제목 3')).toBeInTheDocument();
  });

  it('굵게 텍스트가 올바르게 렌더링된다', () => {
    render(<MarkdownPreview content="**굵은 텍스트**" />);
    
    const boldElement = screen.getByText('굵은 텍스트');
    expect(boldElement).toHaveClass('font-bold');
  });

  it('기울임 텍스트가 올바르게 렌더링된다', () => {
    render(<MarkdownPreview content="*기울임 텍스트*" />);
    
    const italicElement = screen.getByText('기울임 텍스트');
    expect(italicElement).toHaveClass('italic');
  });

  it('밑줄 텍스트가 올바르게 렌더링된다', () => {
    render(<MarkdownPreview content="<u>밑줄 텍스트</u>" />);
    
    const underlineElement = screen.getByText('밑줄 텍스트');
    expect(underlineElement).toHaveClass('underline');
  });

  it('인라인 코드가 올바르게 렌더링된다', () => {
    render(<MarkdownPreview content="`인라인 코드`" />);
    
    const codeElement = screen.getByText('인라인 코드');
    expect(codeElement).toHaveClass('bg-gray-100', 'dark:bg-gray-800', 'px-1', 'py-0.5', 'rounded', 'text-sm', 'font-mono');
  });

  it('링크가 올바르게 렌더링된다', () => {
    render(<MarkdownPreview content="[링크 텍스트](https://example.com)" />);
    
    const linkElement = screen.getByText('링크 텍스트');
    expect(linkElement).toHaveAttribute('href', 'https://example.com');
    expect(linkElement).toHaveAttribute('target', '_blank');
    expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('자동 링크가 올바르게 렌더링된다', () => {
    render(<MarkdownPreview content="https://example.com" />);
    
    const linkElement = screen.getByText('https://example.com');
    expect(linkElement).toHaveAttribute('href', 'https://example.com');
    expect(linkElement).toHaveAttribute('target', '_blank');
  });

  it('줄바꿈이 올바르게 렌더링된다', () => {
    render(<MarkdownPreview content="첫 번째 줄\n두 번째 줄" />);
    
    // 줄바꿈이 <br> 태그로 변환되었는지 확인
    const container = screen.getByRole('generic');
    expect(container.innerHTML).toContain('<br>');
  });

  it('빈 내용일 때 빈 문자열을 반환한다', () => {
    render(<MarkdownPreview content="" />);
    
    const container = screen.getByRole('generic');
    expect(container.innerHTML).toBe('');
  });

  it('커스텀 클래스명이 적용된다', () => {
    render(<MarkdownPreview content="테스트" className="custom-class" />);
    
    const container = screen.getByRole('generic');
    expect(container).toHaveClass('custom-class');
  });

  it('정렬 div 태그가 올바르게 렌더링된다', () => {
    render(<MarkdownPreview content='<div style="text-align: center;">가운데 정렬</div>' />);
    
    const centerElement = screen.getByText('가운데 정렬');
    expect(centerElement).toHaveClass('text-center');
  });
});
