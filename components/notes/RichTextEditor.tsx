// components/notes/RichTextEditor.tsx
// 리치 텍스트 에디터 컴포넌트
// 툴바와 에디터 영역을 포함한 완전한 리치 텍스트 편집 기능

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import RichTextToolbar from './RichTextToolbar';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  rows?: number;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "텍스트를 입력하세요...",
  maxLength = 10000,
  className,
  rows = 15
}: RichTextEditorProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [charCount, setCharCount] = useState(value.length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 글자 수 업데이트
  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  // 다크 모드 토글
  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 포맷 변경 핸들러
  const handleFormatChange = useCallback((format: string, formatValue?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = '';
    let newCursorPos = start;

    switch (format) {
      case 'bold':
        if (selectedText) {
          newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
          newCursorPos = start + 2 + selectedText.length + 2;
        } else {
          newText = value.substring(0, start) + '**텍스트**' + value.substring(end);
          newCursorPos = start + 2;
        }
        break;
        
      case 'italic':
        if (selectedText) {
          newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
          newCursorPos = start + 1 + selectedText.length + 1;
        } else {
          newText = value.substring(0, start) + '*텍스트*' + value.substring(end);
          newCursorPos = start + 1;
        }
        break;
        
      case 'underline':
        if (selectedText) {
          newText = value.substring(0, start) + `<u>${selectedText}</u>` + value.substring(end);
          newCursorPos = start + 3 + selectedText.length + 4;
        } else {
          newText = value.substring(0, start) + '<u>텍스트</u>' + value.substring(end);
          newCursorPos = start + 3;
        }
        break;
        
      case 'heading':
        if (formatValue === 'h1') {
          if (selectedText) {
            newText = value.substring(0, start) + `# ${selectedText}` + value.substring(end);
            newCursorPos = start + 2 + selectedText.length;
          } else {
            newText = value.substring(0, start) + '# 제목' + value.substring(end);
            newCursorPos = start + 2;
          }
        } else if (formatValue === 'h2') {
          if (selectedText) {
            newText = value.substring(0, start) + `## ${selectedText}` + value.substring(end);
            newCursorPos = start + 3 + selectedText.length;
          } else {
            newText = value.substring(0, start) + '## 제목' + value.substring(end);
            newCursorPos = start + 3;
          }
        } else if (formatValue === 'h3') {
          if (selectedText) {
            newText = value.substring(0, start) + `### ${selectedText}` + value.substring(end);
            newCursorPos = start + 4 + selectedText.length;
          } else {
            newText = value.substring(0, start) + '### 제목' + value.substring(end);
            newCursorPos = start + 4;
          }
        }
        break;
        
      case 'align':
        if (formatValue === 'left') {
          newText = value.substring(0, start) + `<div style="text-align: left;">${selectedText || '텍스트'}</div>` + value.substring(end);
          newCursorPos = start + 30 + (selectedText?.length || 2);
        } else if (formatValue === 'center') {
          newText = value.substring(0, start) + `<div style="text-align: center;">${selectedText || '텍스트'}</div>` + value.substring(end);
          newCursorPos = start + 32 + (selectedText?.length || 2);
        } else if (formatValue === 'right') {
          newText = value.substring(0, start) + `<div style="text-align: right;">${selectedText || '텍스트'}</div>` + value.substring(end);
          newCursorPos = start + 31 + (selectedText?.length || 2);
        }
        break;
    }

    if (newText && newText !== value) {
      onChange(newText);
      
      // 커서 위치 설정
      setTimeout(() => {
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  }, [value, onChange]);

  // 키보드 단축키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          handleFormatChange('bold');
          break;
        case 'i':
          e.preventDefault();
          handleFormatChange('italic');
          break;
        case 'u':
          e.preventDefault();
          handleFormatChange('underline');
          break;
      }
    }
  };

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden",
      isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200",
      className
    )} data-testid="rich-text-editor">
      {/* 툴바 */}
      <RichTextToolbar
        onFormatChange={handleFormatChange}
        onThemeToggle={handleThemeToggle}
        isDarkMode={isDarkMode}
      />
      
      {/* 에디터 영역 */}
      <div className="relative">
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
