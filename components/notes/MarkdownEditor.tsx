// components/notes/MarkdownEditor.tsx
// 마크다운 에디터 컴포넌트
// 실시간 미리보기, 단축키, 코드 하이라이팅, 링크 자동 감지 기능

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import MarkdownPreview from './MarkdownPreview';
import { 
  Eye, 
  EyeOff, 
  Code, 
  Link, 
  List, 
  ListOrdered,
  Quote,
  Type,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  rows?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = "마크다운을 입력하세요...",
  maxLength = 10000,
  className,
  rows = 15
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [charCount, setCharCount] = useState(value.length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 글자 수 업데이트
  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  // 마크다운 단축키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);

      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertMarkdown('**', '**', selectedText);
          break;
        case 'i':
          e.preventDefault();
          insertMarkdown('*', '*', selectedText);
          break;
        case 'k':
          e.preventDefault();
          insertLink(selectedText);
          break;
        case '`':
          e.preventDefault();
          insertMarkdown('`', '`', selectedText);
          break;
        case 'Enter':
          e.preventDefault();
          insertCodeBlock();
          break;
      }
    }
  };

  // 마크다운 삽입 함수
  const insertMarkdown = (prefix: string, suffix: string, selectedText?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = selectedText || '텍스트';
    
    const newText = value.substring(0, start) + prefix + text + suffix + value.substring(end);
    onChange(newText);
    
    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + text.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 링크 삽입 함수
  const insertLink = (selectedText?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const linkText = selectedText || '링크 텍스트';
    const url = 'https://example.com';
    
    const newText = value.substring(0, start) + `[${linkText}](${url})` + value.substring(end);
    onChange(newText);
    
    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + linkText.length + 3; // [텍스트](
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 코드 블록 삽입 함수
  const insertCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = value.substring(0, start) + '\n```\n코드\n```\n' + value.substring(end);
    onChange(newText);
    
    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + 5; // \n```\n
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 헤딩 삽입 함수
  const insertHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const headingText = selectedText || '제목';
    const prefix = '#'.repeat(level) + ' ';
    
    const newText = value.substring(0, start) + prefix + headingText + value.substring(end);
    onChange(newText);
    
    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + headingText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 리스트 삽입 함수
  const insertList = (ordered: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const listText = selectedText || '리스트 항목';
    const prefix = ordered ? '1. ' : '- ';
    
    const newText = value.substring(0, start) + prefix + listText + '\n' + value.substring(end);
    onChange(newText);
    
    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + listText.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 인용구 삽입 함수
  const insertQuote = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const quoteText = selectedText || '인용구';
    
    const newText = value.substring(0, start) + '> ' + quoteText + value.substring(end);
    onChange(newText);
    
    // 커서 위치 설정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + 2 + quoteText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden",
      isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200",
      className
    )} data-testid="markdown-editor">
      {/* 툴바 */}
      <div className={cn(
        "flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800"
      )}>
        {/* 포맷 버튼들 */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertMarkdown('**', '**')}
            className="h-8 w-8 p-0"
            title="굵게 (Ctrl+B)"
          >
            <Type className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertMarkdown('*', '*')}
            className="h-8 w-8 p-0"
            title="기울임 (Ctrl+I)"
          >
            <Type className="h-4 w-4" style={{ fontStyle: 'italic' }} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertMarkdown('`', '`')}
            className="h-8 w-8 p-0"
            title="인라인 코드 (Ctrl+`)"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* 헤딩 버튼들 */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertHeading(1)}
            className="h-8 px-2 text-xs"
            title="제목 1"
          >
            H1
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertHeading(2)}
            className="h-8 px-2 text-xs"
            title="제목 2"
          >
            H2
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertHeading(3)}
            className="h-8 px-2 text-xs"
            title="제목 3"
          >
            H3
          </Button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* 리스트 버튼들 */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertList(false)}
            className="h-8 w-8 p-0"
            title="순서 없는 리스트"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => insertList(true)}
            className="h-8 w-8 p-0"
            title="순서 있는 리스트"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={insertQuote}
            className="h-8 w-8 p-0"
            title="인용구"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* 링크 및 코드 블록 */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={insertLink}
            className="h-8 w-8 p-0"
            title="링크 (Ctrl+K)"
          >
            <Link className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={insertCodeBlock}
            className="h-8 w-8 p-0"
            title="코드 블록 (Ctrl+Enter)"
          >
            <Code className="h-4 w-4" />
          </Button>
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

        {/* 미리보기 토글 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="h-8 w-8 p-0"
          title={showPreview ? "편집 모드" : "미리보기 모드"}
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>

        {/* 테마 토글 */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="h-8 w-8 p-0"
          title={isDarkMode ? "라이트 모드" : "다크 모드"}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      {/* 에디터/미리보기 영역 */}
      <div className="relative">
        {showPreview ? (
          <div className="min-h-[200px]">
            <MarkdownPreview 
              content={value} 
              className={cn(
                isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
              )}
            />
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={rows}
            className={cn(
              "border-0 rounded-none resize-none focus:ring-0 focus:outline-none",
              isDarkMode 
                ? "bg-gray-900 text-white placeholder-gray-400" 
                : "bg-white text-gray-900 placeholder-gray-500"
            )}
          />
        )}
        
        {/* 글자 수 표시 */}
        <div className={cn(
          "absolute bottom-2 right-2 text-xs px-2 py-1 rounded",
          isDarkMode 
            ? "bg-gray-800 text-gray-300" 
            : "bg-gray-100 text-gray-600"
        )}>
          {charCount.toLocaleString()}/{maxLength.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
