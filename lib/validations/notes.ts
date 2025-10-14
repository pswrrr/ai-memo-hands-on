import { z } from 'zod';

// 노트 생성 스키마
export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(255, '제목은 255자를 초과할 수 없습니다')
    .trim(),
  content: z
    .string()
    .max(10000, '내용은 10,000자를 초과할 수 없습니다')
    .default(''),
});

// 노트 수정 스키마
export const updateNoteSchema = z.object({
  id: z.string().uuid('유효하지 않은 노트 ID입니다'),
  title: z
    .string()
    .min(1, '제목을 입력해주세요')
    .max(255, '제목은 255자를 초과할 수 없습니다')
    .trim(),
  content: z
    .string()
    .max(10000, '내용은 10,000자를 초과할 수 없습니다')
    .optional()
    .default(''),
});

// 노트 삭제 스키마
export const deleteNoteSchema = z.object({
  id: z.string().uuid('유효하지 않은 노트 ID입니다'),
});

// 타입 추출
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type DeleteNoteInput = z.infer<typeof deleteNoteSchema>;

// 에러 메시지 상수
export const NOTE_ERROR_MESSAGES = {
  TITLE_REQUIRED: '제목을 입력해주세요',
  TITLE_TOO_LONG: '제목은 255자를 초과할 수 없습니다',
  CONTENT_TOO_LONG: '내용은 10,000자를 초과할 수 없습니다',
  INVALID_ID: '유효하지 않은 노트 ID입니다',
  SAVE_FAILED: '노트 저장에 실패했습니다',
  DELETE_FAILED: '노트 삭제에 실패했습니다',
  NOT_FOUND: '노트를 찾을 수 없습니다',
  UNAUTHORIZED: '이 노트에 접근할 권한이 없습니다',
} as const;
