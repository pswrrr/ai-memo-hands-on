// components/notes/AdvancedToolbar.tsx
// 고급 ?�집 ?�구 ?�바 컴포?�트
// 검??바꾸�? ?�동?�성, ?�계, ?�체?�면 기능 ?�합

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
      {/* 검??�?바꾸�?*/}
      <SearchReplace
        content={content}
        onReplace={onContentChange}
      />

      {/* ?�동 ?�성 */}
      <AutoComplete
        content={content}
        onInsert={(text) => {
          // ?�재 커서 ?�치???�스???�입 (?�제 구현?�서??커서 ?�치�?찾아???�입)
          onContentChange(content + text);
        }}
      />

      {/* ?�스???�계 */}
      <TextStats
        content={content}
      />

      {/* ?�체?�면 ?�집 */}
      <FullscreenEditor
        content={content}
        onChange={onContentChange}
        onSave={onSave}
        placeholder="집중?�서 ?�성?�세??.."
        maxLength={10000}
      />

      {/* 구분??*/}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* ?��?�?*/}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHelp(!showHelp)}
        className="h-8 w-8 p-0"
        title="?��?�?
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {/* ?��?�??�널 */}
      {showHelp && (
        <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 min-w-80">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">고급 ?�집 ?�구</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3" />
                <span><strong>검??�?바꾸�?</strong> Ctrl+F�??�스??검??�?바꾸�?/span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                <span><strong>?�동 ?�성:</strong> Ctrl+Space�??�전 ?�트?�서 ?�스???�동 ?�성</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-3 w-3" />
                <span><strong>?�스???�계:</strong> 글???? ?�어 ?? ?�기 ?�간 ???�세 ?�계</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="h-3 w-3" />
                <span><strong>?�체?�면:</strong> F11�?방해받�? ?�는 집중 ?�집 모드</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-xs mb-2">?�축??/h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>Ctrl+F: 검??/div>
                <div>Ctrl+Space: ?�동?�성</div>
                <div>F11: ?�체?�면</div>
                <div>Ctrl+S: ?�??/div>
                <div>Ctrl+Enter: 미리보기</div>
                <div>Ctrl+M: ?�크모드</div>
                <div>ESC: 종료</div>
                <div>?�↓: ?�동?�성 ?�택</div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(false)}
              className="w-full text-xs"
            >
              ?�기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
