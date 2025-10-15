// components/notes/MarkdownPreview.tsx
// 마크다운 실시간 미리보기 컴포넌트
// 마크다운 텍스트를 HTML로 변환하여 렌더링

'use client';

import { useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import 'highlight.js/styles/github.css';
import 'highlight.js/styles/github-dark.css';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  // 하이라이트.js 언어 등록
  useEffect(() => {
    hljs.registerLanguage('javascript', javascript);
    hljs.registerLanguage('typescript', typescript);
    hljs.registerLanguage('python', python);
    hljs.registerLanguage('java', java);
    hljs.registerLanguage('css', css);
    hljs.registerLanguage('xml', xml);
    hljs.registerLanguage('html', xml);
  }, []);

  // 마크다운을 HTML로 변환하는 함수
  const htmlContent = useMemo(() => {
    if (!content) return '';

    let html = content
      // 헤딩 변환
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      
      // 굵게 변환
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      
      // 기울임 변환
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      
      // 밑줄 변환
      .replace(/<u>(.*?)<\/u>/g, '<u class="underline">$1</u>')
      
      // 코드 블록 변환 (언어 지정 지원)
      .replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        const trimmedCode = code.trim();
        const highlightedCode = lang ? hljs.highlight(trimmedCode, { language: lang }).value : trimmedCode;
        return `<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm hljs">${highlightedCode}</code></pre>`;
      })
      
      // 인라인 코드 변환
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      
      // 링크 변환
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // 자동 링크 변환
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
      
      // 정렬 div 태그 처리
      .replace(/<div style="text-align: (left|center|right);">(.*?)<\/div>/g, '<div class="text-$1">$2</div>')
      
      // 줄바꿈 변환
      .replace(/\n/g, '<br>')
      
      // 리스트 변환
      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>');

    // 리스트 래핑
    html = html.replace(/(<li class="ml-4">.*<\/li>)/g, '<ul class="list-disc list-inside my-2">$1</ul>');

    return html;
  }, [content]);

  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none p-4 min-h-[200px]",
        "prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100",
        "prose-p:text-gray-700 dark:prose-p:text-gray-300",
        "prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
        "prose-code:text-gray-900 dark:prose-code:text-gray-100",
        "prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800",
        "prose-a:text-blue-600 dark:prose-a:text-blue-400",
        "prose-ul:list-disc prose-ol:list-decimal",
        className
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
