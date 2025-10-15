// components/notes/AdvancedToolbar.tsx
// ê³ ê¸‰ ?¸ì§‘ ?„êµ¬ ?´ë°” ì»´í¬?ŒíŠ¸
// ê²€??ë°”ê¾¸ê¸? ?ë™?„ì„±, ?µê³„, ?„ì²´?”ë©´ ê¸°ëŠ¥ ?µí•©

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
      {/* ê²€??ë°?ë°”ê¾¸ê¸?*/}
      <SearchReplace
        content={content}
        onReplace={onContentChange}
      />

      {/* ?ë™ ?„ì„± */}
      <AutoComplete
        content={content}
        onInsert={(text) => {
          // ?„ì¬ ì»¤ì„œ ?„ì¹˜???ìŠ¤???½ì… (?¤ì œ êµ¬í˜„?ì„œ??ì»¤ì„œ ?„ì¹˜ë¥?ì°¾ì•„???½ì…)
          onContentChange(content + text);
        }}
      />

      {/* ?ìŠ¤???µê³„ */}
      <TextStats
        content={content}
      />

      {/* ?„ì²´?”ë©´ ?¸ì§‘ */}
      <FullscreenEditor
        content={content}
        onChange={onContentChange}
        onSave={onSave}
        placeholder="ì§‘ì¤‘?´ì„œ ?‘ì„±?˜ì„¸??.."
        maxLength={10000}
      />

      {/* êµ¬ë¶„??*/}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* ?„ì?ë§?*/}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHelp(!showHelp)}
        className="h-8 w-8 p-0"
        title="?„ì?ë§?
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      {/* ?„ì?ë§??¨ë„ */}
      {showHelp && (
        <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50 min-w-80">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">ê³ ê¸‰ ?¸ì§‘ ?„êµ¬</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3" />
                <span><strong>ê²€??ë°?ë°”ê¾¸ê¸?</strong> Ctrl+Fë¡??ìŠ¤??ê²€??ë°?ë°”ê¾¸ê¸?/span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3" />
                <span><strong>?ë™ ?„ì„±:</strong> Ctrl+Spaceë¡??´ì „ ?¸íŠ¸?ì„œ ?ìŠ¤???ë™ ?„ì„±</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-3 w-3" />
                <span><strong>?ìŠ¤???µê³„:</strong> ê¸€???? ?¨ì–´ ?? ?½ê¸° ?œê°„ ???ì„¸ ?µê³„</span>
              </div>
              <div className="flex items-center gap-2">
                <Maximize className="h-3 w-3" />
                <span><strong>?„ì²´?”ë©´:</strong> F11ë¡?ë°©í•´ë°›ì? ?ŠëŠ” ì§‘ì¤‘ ?¸ì§‘ ëª¨ë“œ</span>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-xs mb-2">?¨ì¶•??/h4>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>Ctrl+F: ê²€??/div>
                <div>Ctrl+Space: ?ë™?„ì„±</div>
                <div>F11: ?„ì²´?”ë©´</div>
                <div>Ctrl+S: ?€??/div>
                <div>Ctrl+Enter: ë¯¸ë¦¬ë³´ê¸°</div>
                <div>Ctrl+M: ?¤í¬ëª¨ë“œ</div>
                <div>ESC: ì¢…ë£Œ</div>
                <div>?‘â†“: ?ë™?„ì„± ? íƒ</div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(false)}
              className="w-full text-xs"
            >
              ?«ê¸°
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
