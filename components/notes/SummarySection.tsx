'use client';

import { useState, useEffect } from 'react';
import { generateSummary, getSummary, generateSummaryDraft, applySummary, updateSummary } from '@/app/actions/notes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw, AlertCircle, RotateCcw, Edit3, Save, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import RegenerateConfirmDialog from './RegenerateConfirmDialog';

interface SummarySectionProps {
  noteId: string;
  noteTitle: string;
}

interface SummaryData {
  id: string;
  content: string;
  model: string;
  created_at: string;
}

interface SummaryResult {
  summary: string;
  bulletPoints: string[];
  quality: number;
  processingTime: number;
}

export default function SummarySection({ noteId, noteTitle }: SummarySectionProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null);
  const [draftSummary, setDraftSummary] = useState<SummaryResult | null>(null);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 컴포넌트 마운트 시 기존 요약 로드
  useEffect(() => {
    loadExistingSummary();
  }, [noteId]);

  const loadExistingSummary = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getSummary(noteId);
      
      if (result.success && result.data) {
        setSummary(result.data);
      }
    } catch (err) {
      console.error('요약 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSummary = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setSummaryResult(null);
      setDraftSummary(null); // 초안 제거
      
      const result = await generateSummary(noteId);
      
      if (result.success && result.data) {
        setSummaryResult(result.data);
        // 기존 요약도 업데이트
        await loadExistingSummary();
      } else {
        setError(result.error || '요약 생성에 실패했습니다');
      }
    } catch (err) {
      console.error('요약 생성 실패:', err);
      setError('요약 생성 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSummary = async () => {
    await handleGenerateSummary();
  };

  const handleGenerateDraft = async () => {
    try {
      setIsGeneratingDraft(true);
      setError(null);
      
      const result = await generateSummaryDraft(noteId);
      
      if (result.success && result.data) {
        setDraftSummary(result.data);
      } else {
        setError(result.error || '요약 초안 생성에 실패했습니다');
      }
    } catch (err) {
      console.error('요약 초안 생성 실패:', err);
      setError('요약 초안 생성 중 오류가 발생했습니다');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleApplyDraft = async () => {
    if (!draftSummary) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      
      const result = await applySummary(noteId, draftSummary.summary);
      
      if (result.success) {
        setSummary({
          id: 'temp',
          content: draftSummary.summary,
          model: 'gemini-2.0-flash-exp',
          created_at: new Date().toISOString()
        });
        setSummaryResult(draftSummary);
        setDraftSummary(null); // 초안 제거
      } else {
        setError(result.error || '요약 적용에 실패했습니다');
      }
    } catch (err) {
      console.error('요약 적용 실패:', err);
      setError('요약 적용 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelDraft = () => {
    setDraftSummary(null);
    setError(null);
  };

  // 재생성 관련 핸들러들
  const handleRegenerateClick = () => {
    setShowRegenerateDialog(true);
  };

  const handleRegenerateConfirm = async () => {
    try {
      setIsRegenerating(true);
      setError(null);
      setDraftSummary(null);
      setSummaryResult(null);

      // 기존 요약 삭제 후 새로 생성
      const result = await generateSummary(noteId);
      
      if (result.success && result.data) {
        setSummaryResult(result.data);
        // 기존 요약도 새로 로드
        await loadExistingSummary();
      } else {
        setError(result.error || '요약 재생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('요약 재생성 실패:', error);
      setError('요약 재생성에 실패했습니다.');
    } finally {
      setIsRegenerating(false);
      setShowRegenerateDialog(false);
    }
  };

  const handleRegenerateCancel = () => {
    setShowRegenerateDialog(false);
  };

  // 편집 관련 핸들러들
  const handleEditClick = () => {
    setIsEditing(true);
    setEditContent(summary?.content || '');
    setError(null);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditContent('');
    setError(null);
  };

  const handleEditSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const result = await updateSummary(noteId, editContent);
      
      if (result.success) {
        setIsEditing(false);
        setEditContent('');
        // 기존 요약 새로 로드
        await loadExistingSummary();
      } else {
        setError(result.error || '요약 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('요약 저장 실패:', error);
      setError('요약 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>요약을 불러오는 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI 요약
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {summaryResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-green-700">새로운 요약이 생성되었습니다!</h4>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="secondary">
                  품질: {Math.round(summaryResult.quality * 100)}%
                </Badge>
                <Badge variant="outline">
                  {summaryResult.processingTime}ms
                </Badge>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <ul className="space-y-2">
                {summaryResult.bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">•</span>
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {summary && !summaryResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">기존 요약</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {new Date(summary.created_at).toLocaleDateString()}
                </Badge>
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEditClick}
                    className="flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    편집
                  </Button>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="요약 내용을 편집하세요..."
                  className="min-h-[120px] resize-none"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {editContent.length}/1000자
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
                      disabled={isSaving || !editContent.trim()}
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
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="prose prose-sm max-w-none">
                  {summary.content.split('\n').map((line, index) => (
                    <p key={index} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 초안 요약 미리보기 */}
        {draftSummary && (
          <div className="space-y-3 border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-blue-700">새로운 요약 초안</h4>
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Badge variant="secondary">
                  품질: {Math.round(draftSummary.quality * 100)}%
                </Badge>
                <Badge variant="outline">
                  {draftSummary.processingTime}ms
                </Badge>
              </div>
            </div>
            
            <div className="bg-white border border-blue-200 rounded-lg p-4">
              <ul className="space-y-2">
                {draftSummary.bulletPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span className="text-sm">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleApplyDraft}
                disabled={isGenerating}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    적용 중...
                  </>
                ) : (
                  '이 요약 적용하기'
                )}
              </Button>
              <Button
                onClick={handleCancelDraft}
                variant="outline"
                size="sm"
              >
                취소
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleGenerateSummary}
            disabled={isGenerating || isGeneratingDraft}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                재생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {summary ? '요약 재생성' : 'AI 요약 생성'}
              </>
            )}
          </Button>
          
          {summary && (
            <Button
              onClick={handleGenerateDraft}
              disabled={isGenerating || isGeneratingDraft || isRegenerating}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isGeneratingDraft ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  초안 생성 중...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  다른 요약 시도
                </>
              )}
            </Button>
          )}
          
          {summary && (
            <Button
              onClick={handleRegenerateClick}
              disabled={isGenerating || isGeneratingDraft || isRegenerating}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  재생성 중...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  완전 재생성
                </>
              )}
            </Button>
          )}
        </div>

        {isGenerating && (
          <div className="text-sm text-gray-500 text-center">
            AI가 노트를 분석하고 요약을 생성하고 있습니다. 잠시만 기다려주세요...
          </div>
        )}
      </CardContent>
      
      {/* 재생성 확인 다이얼로그 */}
      <RegenerateConfirmDialog
        isOpen={showRegenerateDialog}
        onClose={handleRegenerateCancel}
        onConfirm={handleRegenerateConfirm}
        type="summary"
        isLoading={isRegenerating}
      />
    </Card>
  );
}
