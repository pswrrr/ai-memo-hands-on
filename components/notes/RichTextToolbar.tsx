// components/notes/RichTextToolbar.tsx
// 리치 텍스트 에디터 툴바 컴포넌트
// Bold, Italic, Underline 버튼과 헤딩 스타일 선택 기능 제공

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bold, 
  Italic, 
  Underline, 
  Type, 
  Sun, 
  Moon,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextToolbarProps {
  onFormatChange: (format: string, value?: string) => void;
  onThemeToggle: () => void;
  isDarkMode: boolean;
  className?: string;
}

export default function RichTextToolbar({ 
  onFormatChange, 
  onThemeToggle, 
  isDarkMode,
  className 
}: RichTextToolbarProps) {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [selectedHeading, setSelectedHeading] = useState<string>('normal');

  // 포맷 버튼 클릭 핸들러
  const handleFormatClick = (format: string) => {
    const newFormats = new Set(activeFormats);
    
    if (newFormats.has(format)) {
      newFormats.delete(format);
    } else {
      newFormats.add(format);
    }
    
    setActiveFormats(newFormats);
    onFormatChange(format);
  };

  // 헤딩 스타일 변경 핸들러
  const handleHeadingChange = (value: string) => {
    setSelectedHeading(value);
    onFormatChange('heading', value);
  };

  // 정렬 버튼 클릭 핸들러
  const handleAlignClick = (align: string) => {
    onFormatChange('align', align);
  };

  return (
    <div className={cn(
      "flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800 rounded-t-lg",
      className
    )}>
      {/* 텍스트 포맷 버튼들 */}
      <div className="flex items-center gap-1">
        <Button
          variant={activeFormats.has('bold') ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFormatClick('bold')}
          className="h-8 w-8 p-0"
          title="굵게 (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeFormats.has('italic') ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFormatClick('italic')}
          className="h-8 w-8 p-0"
          title="기울임 (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeFormats.has('underline') ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFormatClick('underline')}
          className="h-8 w-8 p-0"
          title="밑줄 (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </Button>
      </div>

      {/* 구분선 */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* 헤딩 스타일 선택 */}
      <div className="flex items-center gap-1">
        <Select value={selectedHeading} onValueChange={handleHeadingChange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue placeholder="스타일" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">일반 텍스트</SelectItem>
            <SelectItem value="h1">제목 1</SelectItem>
            <SelectItem value="h2">제목 2</SelectItem>
            <SelectItem value="h3">제목 3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 구분선 */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* 정렬 버튼들 */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAlignClick('left')}
          className="h-8 w-8 p-0"
          title="왼쪽 정렬"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAlignClick('center')}
          className="h-8 w-8 p-0"
          title="가운데 정렬"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleAlignClick('right')}
          className="h-8 w-8 p-0"
          title="오른쪽 정렬"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 구분선 */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* 테마 토글 */}
      <Button
        variant="outline"
        size="sm"
        onClick={onThemeToggle}
        className="h-8 w-8 p-0"
        title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
      >
        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
