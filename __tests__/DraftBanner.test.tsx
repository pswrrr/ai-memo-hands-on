import { render, screen, fireEvent } from '@testing-library/react';
import DraftBanner from '@/components/notes/DraftBanner';
import { type DraftData } from '@/lib/utils/draftStorage';

describe('DraftBanner', () => {
  const mockDraftData: DraftData = {
    title: '테스트 제목',
    content: '테스트 내용',
    savedAt: Date.now() - 5 * 60 * 1000, // 5분 전
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7일 후
  };

  const mockOnRestore = jest.fn();
  const mockOnDiscard = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('임시 저장 배너가 렌더링되어야 한다', () => {
    render(
      <DraftBanner
        draftData={mockDraftData}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    expect(screen.getByText('임시 저장된 노트가 있습니다')).toBeInTheDocument();
  });

  it('저장 시간이 상대적으로 표시되어야 한다', () => {
    render(
      <DraftBanner
        draftData={mockDraftData}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    expect(screen.getByText(/전 저장됨/)).toBeInTheDocument();
  });

  it('제목이 표시되어야 한다', () => {
    render(
      <DraftBanner
        draftData={mockDraftData}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    expect(screen.getByText(/"테스트 제목"/)).toBeInTheDocument();
  });

  it('복원하기 버튼 클릭 시 onRestore가 호출되어야 한다', () => {
    render(
      <DraftBanner
        draftData={mockDraftData}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    const restoreButton = screen.getByRole('button', { name: '복원하기' });
    fireEvent.click(restoreButton);

    expect(mockOnRestore).toHaveBeenCalledWith(mockDraftData);
    expect(mockOnRestore).toHaveBeenCalledTimes(1);
  });

  it('삭제하기 버튼 클릭 시 onDiscard가 호출되어야 한다', () => {
    render(
      <DraftBanner
        draftData={mockDraftData}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    const discardButton = screen.getByRole('button', { name: '삭제하기' });
    fireEvent.click(discardButton);

    expect(mockOnDiscard).toHaveBeenCalledTimes(1);
  });

  it('닫기 버튼 클릭 시 onDiscard가 호출되어야 한다', () => {
    render(
      <DraftBanner
        draftData={mockDraftData}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    const closeButton = screen.getByLabelText('배너 닫기');
    fireEvent.click(closeButton);

    expect(mockOnDiscard).toHaveBeenCalledTimes(1);
  });

  it('접근성 속성이 올바르게 설정되어야 한다', () => {
    const { container } = render(
      <DraftBanner
        draftData={mockDraftData}
        onRestore={mockOnRestore}
        onDiscard={mockOnDiscard}
      />
    );

    const alert = container.querySelector('[role="alert"]');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  describe('시간 표시', () => {
    it('1분 미만은 "방금 전"으로 표시되어야 한다', () => {
      const recentDraft: DraftData = {
        ...mockDraftData,
        savedAt: Date.now() - 30 * 1000, // 30초 전
      };

      render(
        <DraftBanner
          draftData={recentDraft}
          onRestore={mockOnRestore}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText(/방금 전 저장됨/)).toBeInTheDocument();
    });

    it('1시간 미만은 분으로 표시되어야 한다', () => {
      const draft: DraftData = {
        ...mockDraftData,
        savedAt: Date.now() - 30 * 60 * 1000, // 30분 전
      };

      render(
        <DraftBanner
          draftData={draft}
          onRestore={mockOnRestore}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText(/30분 전 저장됨/)).toBeInTheDocument();
    });

    it('24시간 미만은 시간으로 표시되어야 한다', () => {
      const draft: DraftData = {
        ...mockDraftData,
        savedAt: Date.now() - 5 * 60 * 60 * 1000, // 5시간 전
      };

      render(
        <DraftBanner
          draftData={draft}
          onRestore={mockOnRestore}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText(/5시간 전 저장됨/)).toBeInTheDocument();
    });

    it('24시간 이상은 일로 표시되어야 한다', () => {
      const draft: DraftData = {
        ...mockDraftData,
        savedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3일 전
      };

      render(
        <DraftBanner
          draftData={draft}
          onRestore={mockOnRestore}
          onDiscard={mockOnDiscard}
        />
      );

      expect(screen.getByText(/3일 전 저장됨/)).toBeInTheDocument();
    });
  });
});

