// components/notes/FullscreenEditor.tsx
// 전체화면 편집기 컴포넌트
// 방해받지 않는 집중 편집 환경 제공

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Maximize, 
  Minimize, 
  X, 
  Save, 
  Eye, 
  EyeOff,
  Type,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FullscreenEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export default function FullscreenEditor({
  content,
  onChange,
  onSave,
  placeholder = "집중해서 작성하세요...",
  maxLength = 10000,
  className
}: FullscreenEditorProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [charCount, setCharCount] = useState(content.length);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // 글자 수 및 통계 업데이트
  useEffect(() => {
    setCharCount(content.length);
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    setWordCount(words);
    setReadingTime(Math.ceil(words / 200)); // 분당 200단어 기준
  }, [content]);

  // 전체화면 토글
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      // 전체화면 요청
      if (fullscreenRef.current?.requestFullscreen) {
        fullscreenRef.current.requestFullscreen();
      }
    } else {
      setIsFullscreen(false);
      // 전체화면 종료
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ESC 키로 전체화면 종료
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  // 자동 포커스
  useEffect(() => {
    if (isFullscreen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isFullscreen]);

  // 저장 핸들러
  const handleSave = () => {
    if (onSave) {
      onSave();
    }
  };

  // 키보드 단축키
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'Enter':
          e.preventDefault();
          setShowPreview(!showPreview);
          break;
        case 'm':
          e.preventDefault();
          setIsDarkMode(!isDarkMode);
          break;
      }
    }
  };

  if (!isFullscreen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={toggleFullscreen}
        className={cn("h-8 w-8 p-0", className)}
        title="전체화면 편집 (F11)"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div
      ref={fullscreenRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col",
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      )}
    >
      {/* 헤더 */}
      <div className={cn(
        "flex items-center justify-between p-4 border-b",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
      )}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">집중 편집 모드</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>{charCount.toLocaleString()}자</span>
            <span>•</span>
            <span>{wordCount.toLocaleString()}단어</span>
            <span>•</span>
            <span>{readingTime}분 읽기</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="h-8"
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showPreview ? '편집' : '미리보기'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-8"
          >
            {isDarkMode ? <Sun className="h-4 w-4 mr-1" /> : <Moon className="h-4 w-4 mr-1" />}
            {isDarkMode ? '라이트' : '다크'}
          </Button>
          
          {onSave && (
            <Button
              onClick={handleSave}
              size="sm"
              className="h-8"
            >
              <Save className="h-4 w-4 mr-1" />
              저장
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="h-8"
          >
            <Minimize className="h-4 w-4 mr-1" />
            종료
          </Button>
        </div>
      </div>

      {/* 편집 영역 */}
      <div className="flex-1 flex flex-col">
        {showPreview ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <Card className="h-full">
              <CardContent className="p-6 h-full">
                <div 
                  className={cn(
                    "prose prose-lg max-w-none h-full",
                    isDarkMode ? "prose-invert" : ""
                  )}
                  dangerouslySetInnerHTML={{ 
                    __html: content.replace(/\n/g, '<br>') 
                  }}
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 p-6">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              maxLength={maxLength}
              className={cn(
                "w-full h-full resize-none border-0 focus:ring-0 focus:outline-none text-lg leading-relaxed",
                isDarkMode 
                  ? "bg-gray-900 text-white placeholder-gray-400" 
                  : "bg-white text-gray-900 placeholder-gray-500"
              )}
            />
          </div>
        )}
      </div>

      {/* 하단 도움말 */}
      <div className={cn(
        "p-4 border-t text-sm text-gray-500",
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Ctrl+S: 저장</span>
            <span>Ctrl+Enter: 미리보기</span>
            <span>Ctrl+M: 다크모드</span>
            <span>ESC: 종료</span>
          </div>
          <div className="text-xs">
            집중해서 작성하세요
          </div>
        </div>
      </div>
    </div>
  );
}
