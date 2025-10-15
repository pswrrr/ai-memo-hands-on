// components/notes/AutoComplete.tsx
// 자동 완성 컴포넌트
// 이전 노트 제목/내용 기반 자동 완성 기능

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, X, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoCompleteProps {
  content: string;
  onInsert: (text: string) => void;
  className?: string;
}

interface Suggestion {
  id: string;
  text: string;
  type: 'title' | 'content';
  timestamp: Date;
}

export default function AutoComplete({ content, onInsert, className }: AutoCompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 로컬 스토리지에서 이전 노트 데이터 가져오기
  useEffect(() => {
    const loadSuggestions = () => {
      try {
        const savedNotes = localStorage.getItem('ai-memo-notes');
        if (savedNotes) {
          const notes = JSON.parse(savedNotes);
          const suggestions: Suggestion[] = [];
          
          notes.forEach((note: any) => {
            if (note.title) {
              suggestions.push({
                id: `title-${note.id}`,
                text: note.title,
                type: 'title',
                timestamp: new Date(note.updatedAt || note.createdAt)
              });
            }
            
            if (note.content && note.content.length > 10) {
              // 내용을 문장 단위로 분할
              const sentences = note.content
                .split(/[.!?]\s+/)
                .filter((sentence: string) => sentence.trim().length > 10)
                .slice(0, 3); // 최대 3개 문장
              
              sentences.forEach((sentence: string, index: number) => {
                suggestions.push({
                  id: `content-${note.id}-${index}`,
                  text: sentence.trim(),
                  type: 'content',
                  timestamp: new Date(note.updatedAt || note.createdAt)
                });
              });
            }
          });
          
          // 최신순으로 정렬
          suggestions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          setSuggestions(suggestions.slice(0, 50)); // 최대 50개
        }
      } catch (error) {
        console.error('자동 완성 데이터 로드 실패:', error);
      }
    };

    loadSuggestions();
  }, []);

  // 검색어에 따른 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSuggestions(suggestions.slice(0, 10));
    } else {
      const filtered = suggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 10));
    }
    setSelectedIndex(0);
  }, [searchQuery, suggestions]);

  // 키보드 네비게이션
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          Math.min(prev + 1, filteredSuggestions.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredSuggestions[selectedIndex]) {
          handleInsert(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // 텍스트 삽입
  const handleInsert = (suggestion: Suggestion) => {
    onInsert(suggestion.text);
    setIsOpen(false);
    setSearchQuery('');
  };

  // 현재 커서 위치에 텍스트 삽입
  const insertAtCursor = (text: string) => {
    // 실제 구현에서는 textarea의 커서 위치를 찾아서 삽입
    onInsert(text);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 w-8 p-0", className)}
          title="자동 완성 (Ctrl+Space)"
        >
          <Zap className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>자동 완성</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 검색 입력 */}
          <div className="space-y-2">
            <Label htmlFor="autocomplete-search">검색</Label>
            <Input
              ref={searchInputRef}
              id="autocomplete-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이전 노트에서 텍스트를 검색하세요"
              className="w-full"
            />
          </div>

          {/* 제안 목록 */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredSuggestions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                {searchQuery ? '검색 결과가 없습니다' : '제안할 내용이 없습니다'}
              </div>
            ) : (
              filteredSuggestions.map((suggestion, index) => (
                <Card
                  key={suggestion.id}
                  className={cn(
                    "cursor-pointer transition-colors",
                    index === selectedIndex 
                      ? "bg-blue-50 border-blue-200" 
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => handleInsert(suggestion)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-1">
                        {suggestion.type === 'title' ? (
                          <FileText className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Clock className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.text}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {suggestion.type === 'title' ? '제목' : '내용'} • {' '}
                          {suggestion.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* 도움말 */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <div className="font-medium mb-1">사용법:</div>
            <div>• ↑↓ 키로 선택</div>
            <div>• Enter로 삽입</div>
            <div>• Esc로 닫기</div>
          </div>

          {/* 닫기 버튼 */}
          <div className="flex justify-end">
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
