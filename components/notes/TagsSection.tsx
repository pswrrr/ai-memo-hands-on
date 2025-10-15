'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tags, RefreshCw, XCircle, RotateCcw, Plus, X, Edit3, Save } from 'lucide-react';
import { generateTags, getTags, updateTags } from '@/app/actions/notes';
import { Input } from '@/components/ui/input';
import RegenerateConfirmDialog from './RegenerateConfirmDialog';

interface TagsSectionProps {
  noteId: string;
}

export default function TagsSection({ noteId }: TagsSectionProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId]);

  async function fetchTags() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getTags(noteId);
      if (res.success && res.data) {
        setTags(res.data.tags || []);
      } else if (!res.success && res.error !== '노트를 찾을 수 없습니다') {
        setError(res.error || '태그를 불러오는데 실패했습니다');
      }
    } catch (e) {
      setError('태그를 불러오는데 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await generateTags(noteId);
      if (res.success && res.data) {
        setTags(res.data.tags || []);
      } else {
        setError(res.error || '태그 생성에 실패했습니다');
      }
    } catch (e) {
      setError('태그 생성 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  }

  // 재생성 관련 핸들러들
  const handleRegenerateClick = () => {
    setShowRegenerateDialog(true);
  };

  const handleRegenerateConfirm = async () => {
    try {
      setIsRegenerating(true);
      setError(null);

      // 기존 태그 삭제 후 새로 생성
      const result = await generateTags(noteId);
      
      if (result.success && result.data) {
        setTags(result.data.tags || []);
      } else {
        setError(result.error || '태그 재생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('태그 재생성 실패:', error);
      setError('태그 재생성에 실패했습니다.');
    } finally {
      setIsRegenerating(false);
      setShowRegenerateDialog(false);
    }
  };

  const handleRegenerateCancel = () => {
    setShowRegenerateDialog(false);
  };

  // 태그 편집 관련 핸들러들
  const handleEditClick = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setNewTag('');
    setError(null);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 6) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleEditSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const result = await updateTags(noteId, tags);
      
      if (result.success) {
        setIsEditing(false);
        setNewTag('');
      } else {
        setError(result.error || '태그 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('태그 저장 실패:', error);
      setError('태그 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Tags className="h-5 w-5" /> AI 태그
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleGenerate} disabled={isLoading || isRegenerating || isEditing} variant="secondary">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isLoading ? '태그 생성 중...' : '태그 생성'}
          </Button>
          {tags.length > 0 && !isEditing && (
            <Button 
              size="sm" 
              onClick={handleRegenerateClick} 
              disabled={isLoading || isRegenerating} 
              variant="outline"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  재생성 중...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  완전 재생성
                </>
              )}
            </Button>
          )}
          {tags.length > 0 && !isEditing && (
            <Button 
              size="sm" 
              onClick={handleEditClick} 
              disabled={isLoading || isRegenerating} 
              variant="outline"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              편집
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {error && (
          <div className="flex items-start gap-2 text-red-600 mb-3">
            <XCircle className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isLoading && tags.length === 0 && (
          <div className="flex items-center text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>AI가 태그를 생성하고 있습니다...</span>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={`${tag}-${index}`} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            
            {tags.length < 6 && (
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="새 태그 입력..."
                  maxLength={50}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || tags.includes(newTag.trim())}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {tags.length}/6개 태그
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEditCancel}
                  disabled={isSaving}
                >
                  <X className="h-3 w-3 mr-1" />
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleEditSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      저장
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <Badge key={`${t}-${i}`} variant="secondary">{t}</Badge>
              ))}
            </div>
          ) : (
            !isLoading && !error && (
              <div className="text-gray-500 italic">아직 생성된 태그가 없습니다. &lsquo;태그 생성&rsquo; 버튼을 눌러보세요.</div>
            )
          )
        )}
      </CardContent>
      
      {/* 재생성 확인 다이얼로그 */}
      <RegenerateConfirmDialog
        isOpen={showRegenerateDialog}
        onClose={handleRegenerateCancel}
        onConfirm={handleRegenerateConfirm}
        type="tags"
        isLoading={isRegenerating}
      />
    </Card>
  );
}


