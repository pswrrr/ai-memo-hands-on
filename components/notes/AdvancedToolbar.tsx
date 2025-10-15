// components/notes/AdvancedToolbar.tsx
// 고급 편집 도구 툴바 컴포넌트
// 검색/바꾸기, 자동완성, 통계, 전체화면 기능 통합

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import SearchReplace from './SearchReplace';
import AutoComplete from './AutoComplete';
import TextStats from './TextStats';
import FullscreenEditor from './FullscreenEditor';
import { 
  Search, 
  Zap, 
  BarChart3, 
  Maximize,
  Settings,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedToolbarProps {
  content: string;
  onContentChange: (content: string) => void;
  onSave?: () => void;
  className?: string;
}

export default function AdvancedToolbar({ 
  content, 
  onContentChange, 
  onSave,
  className 
}: AdvancedToolbarProps) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={cn(
      "flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800",
      className
    )}>
      {/* 검색 및 바꾸기 */}
      <SearchReplace
        content={content}
        onReplace={onContentChange}
      />

      {/* 자동 완성 */}
      <AutoComplete
        content={content}
        onInsert={(text) => {
          // 현재 커서 위치에 텍스트 삽입 (실제 구현에서는 커서 위치를 찾아서 삽입)
          onContentChange(content + text);
        }}
      />

      {/* 텍스트 통계 */}
      <TextStats
        content={content}
      />

      {/* 전체화면 편집 */}
      <FullscreenEditor
        content={content}
        onChange={onContentChange}
        onSave={onSave}
        placeholder="집중해서 작성하세요..."
        maxLength={10000}
      />

      {/* 구분선 */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* 도움말 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHelp(!showHelp)}
        className="h-8 w-8 p-0"
        title="도움말"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {/* 도움말 패널 */}
      {showHelp && (
        <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 min-w-80">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">고급 편집 도구</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3" />
                <span><strong>검색 및 바꾸기:</strong> Ctrl+F로 텍스트 검색 및 바꾸기</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                <span><strong>자동 완성:</strong> Ctrl+Space로 이전 노트에서 텍스트 자동 완성</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-3 w-3" />
                <span><strong>텍스트 통계:</strong> 글자 수, 단어 수, 읽기 시간 등 상세 통계</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="h-3 w-3" />
                <span><strong>전체화면:</strong> F11로 방해받지 않는 집중 편집 모드</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-xs mb-2">단축키</h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>Ctrl+F: 검색</div>
                <div>Ctrl+Space: 자동완성</div>
                <div>F11: 전체화면</div>
                <div>Ctrl+S: 저장</div>
                <div>Ctrl+Enter: 미리보기</div>
                <div>Ctrl+M: 다크모드</div>
                <div>ESC: 종료</div>
                <div>↑↓: 자동완성 선택</div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(false)}
              className="w-full text-xs"
            >
              닫기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
