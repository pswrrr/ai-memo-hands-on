// components/notes/SearchReplace.tsx
// 검색 및 바꾸기 컴포넌트
// 텍스트 검색, 바꾸기, 정규식 지원 기능

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Replace, X, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchReplaceProps {
  content: string;
  onReplace: (newContent: string) => void;
  className?: string;
}

export default function SearchReplace({ content, onReplace, className }: SearchReplaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [matches, setMatches] = useState<Array<{ start: number; end: number; text: string }>>([]);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // 검색 실행
  const performSearch = () => {
    if (!searchText) {
      setMatches([]);
      setTotalMatches(0);
      setCurrentMatch(0);
      return;
    }

    const flags = caseSensitive ? 'g' : 'gi';
    let searchPattern = searchText;
    
    if (useRegex) {
      try {
        new RegExp(searchPattern, flags);
      } catch (e) {
        return; // 잘못된 정규식
      }
    } else {
      // 특수 문자 이스케이프
      searchPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    if (wholeWord && !useRegex) {
      searchPattern = `\\b${searchPattern}\\b`;
    }

    const regex = new RegExp(searchPattern, flags);
    const newMatches: Array<{ start: number; end: number; text: string }> = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      newMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0]
      });
    }

    setMatches(newMatches);
    setTotalMatches(newMatches.length);
    setCurrentMatch(newMatches.length > 0 ? 1 : 0);
  };

  // 다음 매치로 이동
  const goToNext = () => {
    if (totalMatches > 0) {
      setCurrentMatch(prev => (prev % totalMatches) + 1);
    }
  };

  // 이전 매치로 이동
  const goToPrevious = () => {
    if (totalMatches > 0) {
      setCurrentMatch(prev => prev === 1 ? totalMatches : prev - 1);
    }
  };

  // 바꾸기 실행
  const performReplace = () => {
    if (!searchText || matches.length === 0) return;

    const currentMatchIndex = currentMatch - 1;
    const match = matches[currentMatchIndex];
    
    if (!match) return;

    const newContent = 
      content.substring(0, match.start) + 
      replaceText + 
      content.substring(match.end);
    
    onReplace(newContent);
    
    // 매치 목록 업데이트
    const newMatches = matches.map((m, index) => {
      if (index === currentMatchIndex) {
        return {
          start: match.start,
          end: match.start + replaceText.length,
          text: replaceText
        };
      } else if (index > currentMatchIndex) {
        const lengthDiff = replaceText.length - match.text.length;
        return {
          start: m.start + lengthDiff,
          end: m.end + lengthDiff,
          text: m.text
        };
      }
      return m;
    });
    
    setMatches(newMatches);
    setCurrentMatch(prev => Math.min(prev, newMatches.length));
  };

  // 모두 바꾸기
  const replaceAll = () => {
    if (!searchText) return;

    const flags = caseSensitive ? 'g' : 'gi';
    let searchPattern = searchText;
    
    if (useRegex) {
      try {
        new RegExp(searchPattern, flags);
      } catch (e) {
        return;
      }
    } else {
      searchPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    if (wholeWord && !useRegex) {
      searchPattern = `\\b${searchPattern}\\b`;
    }

    const regex = new RegExp(searchPattern, flags);
    const newContent = content.replace(regex, replaceText);
    
    onReplace(newContent);
    setMatches([]);
    setTotalMatches(0);
    setCurrentMatch(0);
  };

  // 검색어 변경 시 자동 검색
  useEffect(() => {
    if (searchText) {
      const timeoutId = setTimeout(performSearch, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setMatches([]);
      setTotalMatches(0);
      setCurrentMatch(0);
    }
  }, [searchText, useRegex, caseSensitive, wholeWord, content]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 w-8 p-0", className)}
          title="검색 및 바꾸기 (Ctrl+F)"
        >
          <Search className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>검색 및 바꾸기</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 검색 입력 */}
          <div className="space-y-2">
            <Label htmlFor="search">검색</Label>
            <div className="flex gap-2">
              <Input
                ref={searchInputRef}
                id="search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="검색할 텍스트를 입력하세요"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={totalMatches === 0}
                className="h-10 w-10 p-0"
                title="이전 매치"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={totalMatches === 0}
                className="h-10 w-10 p-0"
                title="다음 매치"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
            {totalMatches > 0 && (
              <div className="text-sm text-gray-500">
                {currentMatch} / {totalMatches} 매치
              </div>
            )}
          </div>

          {/* 바꾸기 입력 */}
          <div className="space-y-2">
            <Label htmlFor="replace">바꾸기</Label>
            <Input
              ref={replaceInputRef}
              id="replace"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="바꿀 텍스트를 입력하세요"
            />
          </div>

          {/* 옵션 */}
          <div className="space-y-2">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">대소문자 구분</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">전체 단어</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useRegex}
                  onChange={(e) => setUseRegex(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">정규식</span>
              </label>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                onClick={performReplace}
                disabled={totalMatches === 0}
                size="sm"
              >
                <Replace className="h-4 w-4 mr-1" />
                바꾸기
              </Button>
              <Button
                onClick={replaceAll}
                disabled={totalMatches === 0}
                variant="outline"
                size="sm"
              >
                모두 바꾸기
              </Button>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4 mr-1" />
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
