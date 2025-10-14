// components/notes/EmptyState.tsx
// 빈 상태 공통 컴포넌트 - 다양한 상황에서 재사용 가능한 빈 상태 UI
// Story 2.8: 빈 상태 UI 및 온보딩
// components/notes/NoteList.tsx, app/dashboard/page.tsx, components/trash/TrashContent.tsx

'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed border-2 border-gray-200 animate-in fade-in duration-500", className)}>
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div 
          className="flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6"
          aria-hidden="true"
        >
          <Icon className="h-12 w-12 text-gray-400 opacity-50" />
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          {title}
        </h2>
        
        <p className="text-gray-500 text-center mb-8 max-w-md">
          {description}
        </p>
        
        {actionLabel && (actionHref || onAction) && (
          actionHref ? (
            <Link href={actionHref}>
              <Button size="lg" className="min-w-[160px]">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button size="lg" className="min-w-[160px]" onClick={onAction}>
              {actionLabel}
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}
