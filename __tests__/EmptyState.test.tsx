import { render, screen } from '@testing-library/react';
import { FileText, Trash2 } from 'lucide-react';
import EmptyState from '@/components/notes/EmptyState';

describe('EmptyState', () => {
  it('아이콘, 제목, 설명이 표시되어야 한다', () => {
    render(
      <EmptyState
        icon={FileText}
        title="테스트 제목"
        description="테스트 설명"
      />
    );

    expect(screen.getByText('테스트 제목')).toBeInTheDocument();
    expect(screen.getByText('테스트 설명')).toBeInTheDocument();
  });

  it('액션 버튼이 링크로 렌더링되어야 한다', () => {
    render(
      <EmptyState
        icon={FileText}
        title="테스트 제목"
        description="테스트 설명"
        actionLabel="버튼 텍스트"
        actionHref="/test-link"
      />
    );

    const button = screen.getByRole('button', { name: '버튼 텍스트' });
    expect(button).toBeInTheDocument();
    expect(button.closest('a')).toHaveAttribute('href', '/test-link');
  });

  it('액션 버튼 없이 렌더링 가능해야 한다', () => {
    render(
      <EmptyState
        icon={Trash2}
        title="휴지통이 비어있습니다"
        description="삭제된 노트가 없습니다"
      />
    );

    expect(screen.getByText('휴지통이 비어있습니다')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('애니메이션 클래스가 적용되어야 한다', () => {
    const { container } = render(
      <EmptyState
        icon={FileText}
        title="테스트"
        description="테스트 설명"
      />
    );

    const card = container.querySelector('.animate-in');
    expect(card).toBeInTheDocument();
  });

  it('커스텀 className이 적용되어야 한다', () => {
    const { container } = render(
      <EmptyState
        icon={FileText}
        title="테스트"
        description="테스트 설명"
        className="custom-class"
      />
    );

    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('아이콘에 aria-hidden 속성이 있어야 한다', () => {
    const { container } = render(
      <EmptyState
        icon={FileText}
        title="테스트"
        description="테스트 설명"
      />
    );

    const iconContainer = container.querySelector('[aria-hidden="true"]');
    expect(iconContainer).toBeInTheDocument();
  });

  it('제목이 h2 태그로 렌더링되어야 한다', () => {
    render(
      <EmptyState
        icon={FileText}
        title="테스트 제목"
        description="테스트 설명"
      />
    );

    const heading = screen.getByRole('heading', { level: 2, name: '테스트 제목' });
    expect(heading).toBeInTheDocument();
  });
});

