'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createNote } from '@/app/actions/notes';
import { createNoteSchema } from '@/lib/validations/notes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Check } from 'lucide-react';

interface CreateNoteFormProps {
  onSuccess?: (noteId: string) => void;
  onCancel?: () => void;
}

export default function CreateNoteForm({ onSuccess, onCancel }: CreateNoteFormProps = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(createNoteSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  const watchedTitle = watch('title');
  const watchedContent = watch('content');
  const hasContent = watchedTitle.trim() || (watchedContent || '').trim();

  const onSubmit = async (data: { title: string; content: string }) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('content', data.content || '');

      const result = await createNote(formData);

      if (result.success) {
        setSubmitStatus('success');
        reset();
        // 콜백 함수가 있으면 호출, 없으면 기본 리다이렉트
        if (onSuccess) {
          onSuccess(result.noteId!);
        } else {
          router.push('/dashboard');
        }
      } else {
        setSubmitStatus('error');
        setErrorMessage(result.error || '노트 저장에 실패했습니다');
      }
    } catch (error) {
      console.error('노트 생성 오류:', error);
      setSubmitStatus('error');
      setErrorMessage('예상치 못한 오류가 발생했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasContent) {
      const confirmed = window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?');
      if (!confirmed) return;
    }
    reset();
    // 콜백 함수가 있으면 호출, 없으면 기본 리다이렉트
    if (onCancel) {
      onCancel();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          새 노트 작성
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 제목 입력 */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              제목 *
            </label>
            <Input
              id="title"
              {...register('title')}
              placeholder="노트 제목을 입력하세요"
              className={errors.title ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* 본문 입력 */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              내용
            </label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="노트 내용을 입력하세요"
              className={`min-h-[200px] ${errors.content ? 'border-red-500' : ''}`}
              disabled={isSubmitting}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>

          {/* 에러 메시지 */}
          {submitStatus === 'error' && errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* 성공 메시지 */}
          {submitStatus === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                노트가 성공적으로 저장되었습니다!
              </AlertDescription>
            </Alert>
          )}

          {/* 버튼 그룹 */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !watchedTitle.trim()}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
