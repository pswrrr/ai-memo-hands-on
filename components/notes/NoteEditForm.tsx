// components/notes/NoteEditForm.tsx
// 노트 편집 폼 컴포넌트 - 제목과 본문을 수정하고 자동 저장 기능 제공
// 실시간 자동 저장, 수동 저장, 취소 기능을 포함한 편집 인터페이스
// hooks/useAutoSave.ts, components/notes/SaveStatusIndicator.tsx, app/actions/notes.ts

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import MarkdownEditor from './MarkdownEditor';
import AdvancedToolbar from './AdvancedToolbar';
import { useAutoSave, SaveStatus } from '@/hooks/useAutoSave';
import { updateNote } from '@/app/actions/notes';
import SaveStatusIndicator from './SaveStatusIndicator';
import Link from 'next/link';

interface Note {
  id: string;
  title: string;
  content: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface NoteEditFormProps {
  note: Note;
  onCancel: () => void;
}

export default function NoteEditForm({ note, onCancel }: NoteEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content || '');
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [editorMode, setEditorMode] = useState<'rich' | 'markdown'>('rich');

  // 변경사항 감지
  useEffect(() => {
    const titleChanged = title !== note.title;
    const contentChanged = content !== (note.content || '');
    setHasChanges(titleChanged || contentChanged);
  }, [title, content, note.title, note.content]);

  // 자동 저장 함수
  const handleAutoSave = useCallback(async (data: { title: string; content: string }) => {
    if (!hasChanges) return { success: true };
    
    const result = await updateNote(note.id, data.title, data.content);
    return result;
  }, [note.id, hasChanges]);

  // 자동 저장 훅
  const { saveStatus, lastSaved, save, reset } = useAutoSave(
    { title, content },
    {
      onSave: handleAutoSave,
      delay: 3000,
      enabled: hasChanges,
    }
  );

  // 수동 저장
  const handleManualSave = async () => {
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setIsManualSaving(true);
    
    try {
      const result = await updateNote(note.id, title.trim(), content);
      
      if (result.success) {
        router.refresh();
        onCancel();
      } else {
        alert(result.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsManualSaving(false);
    }
  };

  // 취소 처리
  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm('변경사항이 있습니다. 정말 취소하시겠습니까?');
      if (!confirmed) return;
    }
    reset();
    onCancel();
  };

  // 폼 유효성 검증
  const isTitleValid = title.trim().length > 0 && title.length <= 255;
  const isContentValid = content.length <= 10000;
  const canSave = isTitleValid && isContentValid && hasChanges;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                대시보드로 돌아가기
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <SaveStatusIndicator status={saveStatus} lastSaved={lastSaved} />
            </div>
          </div>
        </div>

        {/* 편집 폼 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              노트 편집
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 제목 입력 */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                제목 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="노트 제목을 입력하세요"
                maxLength={255}
                className={!isTitleValid && title.length > 0 ? 'border-red-500' : ''}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {title.length > 0 && !isTitleValid && (
                    <span className="text-red-500">제목을 입력해주세요</span>
                  )}
                </span>
                <span>{title.length}/255</span>
              </div>
            </div>

            {/* 본문 입력 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-sm font-medium">
                  본문
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant={editorMode === 'rich' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorMode('rich')}
                    className="text-xs"
                  >
                    리치 텍스트
                  </Button>
                  <Button
                    variant={editorMode === 'markdown' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorMode('markdown')}
                    className="text-xs"
                  >
                    마크다운
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                {/* 고급 편집 도구 툴바 */}
                <AdvancedToolbar
                  content={content}
                  onContentChange={setContent}
                  onSave={handleManualSave}
                />
                
                {/* 에디터 */}
                {editorMode === 'rich' ? (
                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="노트 내용을 입력하세요"
                    maxLength={10000}
                    rows={15}
                    className={!isContentValid ? 'border-red-500' : ''}
                  />
                ) : (
                  <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder="마크다운을 입력하세요"
                    maxLength={10000}
                    rows={15}
                    className={!isContentValid ? 'border-red-500' : ''}
                  />
                )}
              </div>
              
              <div className="flex justify-between text-xs text-gray-500">
                <span>
                  {!isContentValid && (
                    <span className="text-red-500">본문은 10,000자를 초과할 수 없습니다</span>
                  )}
                </span>
                <div className="text-xs text-gray-500">
                  <span>{editorMode === 'rich' ? '리치 텍스트 편집기' : '마크다운 편집기'} 사용 중</span>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-500">
                {hasChanges && (
                  <span className="text-blue-600">변경사항이 있습니다</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isManualSaving}
                >
                  <X className="h-4 w-4 mr-2" />
                  취소
                </Button>
                <Button
                  onClick={handleManualSave}
                  disabled={!canSave || isManualSaving}
                  className="min-w-[100px]"
                >
                  {isManualSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      저장
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
