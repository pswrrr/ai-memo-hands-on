// __tests__/components/TextStats.test.tsx
// 텍스트 통계 컴포넌트 테스트

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TextStats from '@/components/notes/TextStats';

describe('TextStats', () => {
  const defaultProps = {
    content: 'Hello world! This is a test sentence. Another sentence here.',
  };

  it('기본 렌더링이 올바르게 작동한다', () => {
    render(<TextStats {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('텍스트 통계');
    expect(triggerButton).toBeInTheDocument();
  });

  it('다이얼로그가 열리고 닫힌다', async () => {
    render(<TextStats {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('텍스트 통계');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText('텍스트 통계')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByText('닫기');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('텍스트 통계')).not.toBeInTheDocument();
    });
  });

  it('기본 통계가 올바르게 표시된다', async () => {
    render(<TextStats {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('텍스트 통계');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText('기본 통계')).toBeInTheDocument();
      expect(screen.getByText('글자 수 (공백 포함)')).toBeInTheDocument();
      expect(screen.getByText('글자 수 (공백 제외)')).toBeInTheDocument();
      expect(screen.getByText('단어 수')).toBeInTheDocument();
      expect(screen.getByText('문장 수')).toBeInTheDocument();
      expect(screen.getByText('문단 수')).toBeInTheDocument();
    });
  });

  it('시간 통계가 올바르게 표시된다', async () => {
    render(<TextStats {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('텍스트 통계');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText('시간 통계')).toBeInTheDocument();
      expect(screen.getByText('읽기 시간')).toBeInTheDocument();
      expect(screen.getByText('말하기 시간')).toBeInTheDocument();
      expect(screen.getByText('읽기 수준')).toBeInTheDocument();
    });
  });

  it('평균 통계가 올바르게 표시된다', async () => {
    render(<TextStats {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('텍스트 통계');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText('평균 통계')).toBeInTheDocument();
      expect(screen.getByText('문장당 단어 수')).toBeInTheDocument();
      expect(screen.getByText('단어당 글자 수')).toBeInTheDocument();
      expect(screen.getByText('문단당 문장 수')).toBeInTheDocument();
    });
  });

  it('추가 정보가 올바르게 표시된다', async () => {
    render(<TextStats {...defaultProps} />);
    
    const triggerButton = screen.getByTitle('텍스트 통계');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText('추가 정보')).toBeInTheDocument();
      expect(screen.getByText('공백 비율')).toBeInTheDocument();
      expect(screen.getByText('문장 밀도')).toBeInTheDocument();
      expect(screen.getByText('문단 밀도')).toBeInTheDocument();
    });
  });

  it('빈 내용일 때 0으로 표시된다', async () => {
    render(<TextStats content="" />);
    
    const triggerButton = screen.getByTitle('텍스트 통계');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getAllByText('0')).toHaveLength(5); // 여러 개의 0이 표시됨
    });
  });

  it('긴 텍스트의 통계가 올바르게 계산된다', async () => {
    const longText = 'This is a very long text. '.repeat(100);
    render(<TextStats content={longText} />);
    
    const triggerButton = screen.getByTitle('텍스트 통계');
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText('읽기 시간')).toBeInTheDocument();
      expect(screen.getByText('말하기 시간')).toBeInTheDocument();
    });
  });

  it('커스텀 클래스명이 적용된다', () => {
    render(<TextStats {...defaultProps} className="custom-class" />);
    
    const triggerButton = screen.getByTitle('텍스트 통계');
    expect(triggerButton).toHaveClass('custom-class');
  });
});
