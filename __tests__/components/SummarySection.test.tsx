/**
 * SummarySection 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SummarySection from '@/components/notes/SummarySection';
import { generateSummary, getSummary } from '@/app/actions/notes';

// 모킹
jest.mock('@/app/actions/notes');

const mockGenerateSummary = generateSummary as jest.MockedFunction<typeof generateSummary>;
const mockGetSummary = getSummary as jest.MockedFunction<typeof getSummary>;

describe('SummarySection', () => {
  const mockProps = {
    noteId: 'test-note-id',
    noteTitle: '테스트 노트'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('컴포넌트가 올바르게 렌더링되어야 한다', () => {
    mockGetSummary.mockResolvedValue({
      success: true,
      data: null
    });

    render(<SummarySection {...mockProps} />);

    expect(screen.getByText('AI 요약')).toBeInTheDocument();
    expect(screen.getByText('AI 요약 생성')).toBeInTheDocument();
  });

  it('기존 요약이 있으면 표시해야 한다', async () => {
    const mockSummary = {
      id: 'summary-id',
      content: '• 기존 요약 내용\n• 두 번째 포인트',
      model: 'gemini-1.5-flash',
      created_at: '2024-01-01T00:00:00Z'
    };

    mockGetSummary.mockResolvedValue({
      success: true,
      data: mockSummary
    });

    render(<SummarySection {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('기존 요약')).toBeInTheDocument();
      expect(screen.getByText('기존 요약 내용')).toBeInTheDocument();
    });
  });

  it('요약 생성 버튼을 클릭하면 요약을 생성해야 한다', async () => {
    const mockSummaryResult = {
      summary: '• 새로운 요약\n• 두 번째 포인트',
      bulletPoints: ['새로운 요약', '두 번째 포인트'],
      quality: 0.9,
      processingTime: 1500
    };

    mockGetSummary.mockResolvedValue({
      success: true,
      data: null
    });

    mockGenerateSummary.mockResolvedValue({
      success: true,
      data: mockSummaryResult
    });

    render(<SummarySection {...mockProps} />);

    const generateButton = screen.getByText('AI 요약 생성');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('새로운 요약이 생성되었습니다!')).toBeInTheDocument();
      expect(screen.getByText('새로운 요약')).toBeInTheDocument();
    });
  });

  it('요약 생성 중 로딩 상태를 표시해야 한다', async () => {
    mockGetSummary.mockResolvedValue({
      success: true,
      data: null
    });

    // 요약 생성을 지연시켜 로딩 상태 확인
    mockGenerateSummary.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        success: true,
        data: {
          summary: '테스트 요약',
          bulletPoints: ['테스트 요약'],
          quality: 0.8,
          processingTime: 1000
        }
      }), 100))
    );

    render(<SummarySection {...mockProps} />);

    const generateButton = screen.getByText('AI 요약 생성');
    fireEvent.click(generateButton);

    expect(screen.getByText('생성 중...')).toBeInTheDocument();
    expect(screen.getByText('AI가 노트를 분석하고 요약을 생성하고 있습니다. 잠시만 기다려주세요...')).toBeInTheDocument();
  });

  it('요약 생성 실패 시 에러를 표시해야 한다', async () => {
    mockGetSummary.mockResolvedValue({
      success: true,
      data: null
    });

    mockGenerateSummary.mockResolvedValue({
      success: false,
      error: '요약 생성에 실패했습니다'
    });

    render(<SummarySection {...mockProps} />);

    const generateButton = screen.getByText('AI 요약 생성');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('요약 생성에 실패했습니다')).toBeInTheDocument();
    });
  });

  it('기존 요약이 있을 때 재생성 버튼을 표시해야 한다', async () => {
    const mockSummary = {
      id: 'summary-id',
      content: '기존 요약',
      model: 'gemini-1.5-flash',
      created_at: '2024-01-01T00:00:00Z'
    };

    mockGetSummary.mockResolvedValue({
      success: true,
      data: mockSummary
    });

    render(<SummarySection {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('요약 재생성')).toBeInTheDocument();
      expect(screen.getByText('다시 생성')).toBeInTheDocument();
    });
  });

  it('품질 점수와 처리 시간을 표시해야 한다', async () => {
    const mockSummaryResult = {
      summary: '• 테스트 요약',
      bulletPoints: ['테스트 요약'],
      quality: 0.85,
      processingTime: 2000
    };

    mockGetSummary.mockResolvedValue({
      success: true,
      data: null
    });

    mockGenerateSummary.mockResolvedValue({
      success: true,
      data: mockSummaryResult
    });

    render(<SummarySection {...mockProps} />);

    const generateButton = screen.getByText('AI 요약 생성');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByText('품질: 85%')).toBeInTheDocument();
      expect(screen.getByText('2000ms')).toBeInTheDocument();
    });
  });

  it('요약 조회 실패 시 에러를 처리해야 한다', async () => {
    mockGetSummary.mockRejectedValue(new Error('조회 실패'));

    render(<SummarySection {...mockProps} />);

    // 에러가 발생해도 컴포넌트는 렌더링되어야 함
    expect(screen.getByText('AI 요약')).toBeInTheDocument();
  });
});
