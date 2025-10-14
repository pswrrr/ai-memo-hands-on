// components/ui/skeleton.tsx
// 스켈레톤 UI 컴포넌트 - 로딩 상태를 표시하는 애니메이션 컴포넌트
// 데이터 로딩 중에 사용자에게 로딩 상태를 시각적으로 표시
// components/notes/LoadingState.tsx, components/ui/card.tsx

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
