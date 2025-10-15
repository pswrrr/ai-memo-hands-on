// components/notes/TextStats.tsx
// 텍스트 통계 컴포넌트
// 글자 수, 단어 수, 문장 수, 읽기 시간 등 통계 정보 제공

'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Clock, FileText, Hash, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextStatsProps {
  content: string;
  className?: string;
}

interface TextStatistics {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTime: number;
  speakingTime: number;
  averageWordsPerSentence: number;
  averageCharactersPerWord: number;
}

export default function TextStats({ content, className }: TextStatsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // 텍스트 통계 계산
  const stats = useMemo((): TextStatistics => {
    if (!content) {
      return {
        characters: 0,
        charactersNoSpaces: 0,
        words: 0,
        sentences: 0,
        paragraphs: 0,
        readingTime: 0,
        speakingTime: 0,
        averageWordsPerSentence: 0,
        averageCharactersPerWord: 0,
      };
    }

    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, '').length;
    
    // 단어 수 계산 (공백으로 분리)
    const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
    
    // 문장 수 계산 (마침표, 느낌표, 물음표로 분리)
    const sentences = content.trim() === '' ? 0 : 
      content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    
    // 문단 수 계산 (빈 줄로 분리)
    const paragraphs = content.trim() === '' ? 0 : 
      content.split(/\n\s*\n/).filter(paragraph => paragraph.trim().length > 0).length;
    
    // 읽기 시간 계산 (분당 200단어 기준)
    const readingTime = Math.ceil(words / 200);
    
    // 말하기 시간 계산 (분당 150단어 기준)
    const speakingTime = Math.ceil(words / 150);
    
    // 평균 단어당 글자 수
    const averageCharactersPerWord = words > 0 ? Math.round((charactersNoSpaces / words) * 10) / 10 : 0;
    
    // 평균 문장당 단어 수
    const averageWordsPerSentence = sentences > 0 ? Math.round((words / sentences) * 10) / 10 : 0;

    return {
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      readingTime,
      speakingTime,
      averageWordsPerSentence,
      averageCharactersPerWord,
    };
  }, [content]);

  // 읽기 수준 계산
  const getReadingLevel = (avgWordsPerSentence: number, avgCharsPerWord: number): string => {
    if (avgWordsPerSentence <= 8 && avgCharsPerWord <= 4.5) return '초등학교';
    if (avgWordsPerSentence <= 12 && avgCharsPerWord <= 5.5) return '중학교';
    if (avgWordsPerSentence <= 16 && avgCharsPerWord <= 6.5) return '고등학교';
    return '대학교';
  };

  const readingLevel = getReadingLevel(stats.averageWordsPerSentence, stats.averageCharactersPerWord);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("h-8 w-8 p-0", className)}
          title="텍스트 통계"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>텍스트 통계</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 기본 통계 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                기본 통계
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">글자 수 (공백 포함)</span>
                <span className="font-medium">{stats.characters.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">글자 수 (공백 제외)</span>
                <span className="font-medium">{stats.charactersNoSpaces.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">단어 수</span>
                <span className="font-medium">{stats.words.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">문장 수</span>
                <span className="font-medium">{stats.sentences.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">문단 수</span>
                <span className="font-medium">{stats.paragraphs.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* 시간 통계 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                시간 통계
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">읽기 시간</span>
                <span className="font-medium">
                  {stats.readingTime}분 ({stats.readingTime < 1 ? '< 1분' : `${stats.readingTime}분`})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">말하기 시간</span>
                <span className="font-medium">
                  {stats.speakingTime}분 ({stats.speakingTime < 1 ? '< 1분' : `${stats.speakingTime}분`})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">읽기 수준</span>
                <span className="font-medium text-blue-600">{readingLevel}</span>
              </div>
            </CardContent>
          </Card>

          {/* 평균 통계 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="h-5 w-5" />
                평균 통계
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">문장당 단어 수</span>
                <span className="font-medium">{stats.averageWordsPerSentence}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">단어당 글자 수</span>
                <span className="font-medium">{stats.averageCharactersPerWord}개</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">문단당 문장 수</span>
                <span className="font-medium">
                  {stats.paragraphs > 0 ? Math.round((stats.sentences / stats.paragraphs) * 10) / 10 : 0}개
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 추가 정보 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5" />
                추가 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">공백 비율</span>
                <span className="font-medium">
                  {stats.characters > 0 ? Math.round(((stats.characters - stats.charactersNoSpaces) / stats.characters) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">문장 밀도</span>
                <span className="font-medium">
                  {stats.words > 0 ? Math.round((stats.sentences / stats.words) * 1000) / 10 : 0}문장/1000단어
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">문단 밀도</span>
                <span className="font-medium">
                  {stats.words > 0 ? Math.round((stats.paragraphs / stats.words) * 1000) / 10 : 0}문단/1000단어
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 닫기 버튼 */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
            size="sm"
          >
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
