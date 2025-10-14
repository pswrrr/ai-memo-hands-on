import { 
  createNoteSchema, 
  updateNoteSchema, 
  deleteNoteSchema,
  NOTE_ERROR_MESSAGES 
} from '../lib/validations/notes';

describe('Notes Validations', () => {
  describe('createNoteSchema', () => {
    it('validates valid note data', () => {
      const validData = {
        title: 'Test Title',
        content: 'Test Content'
      };

      const result = createNoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('validates note with empty content', () => {
      const validData = {
        title: 'Test Title',
        content: ''
      };

      const result = createNoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('validates note without content field', () => {
      const validData = {
        title: 'Test Title'
      };

      const result = createNoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe('');
      }
    });

    it('rejects empty title', () => {
      const invalidData = {
        title: '',
        content: 'Test Content'
      };

      const result = createNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(NOTE_ERROR_MESSAGES.TITLE_REQUIRED);
      }
    });

    it('rejects title that is too long', () => {
      const invalidData = {
        title: 'a'.repeat(256),
        content: 'Test Content'
      };

      const result = createNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(NOTE_ERROR_MESSAGES.TITLE_TOO_LONG);
      }
    });

    it('rejects content that is too long', () => {
      const invalidData = {
        title: 'Test Title',
        content: 'a'.repeat(10001)
      };

      const result = createNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(NOTE_ERROR_MESSAGES.CONTENT_TOO_LONG);
      }
    });

    it('trims whitespace from title', () => {
      const data = {
        title: '  Test Title  ',
        content: 'Test Content'
      };

      const result = createNoteSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Test Title');
      }
    });
  });

  describe('updateNoteSchema', () => {
    it('validates valid update data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Updated Title',
        content: 'Updated Content'
      };

      const result = updateNoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const invalidData = {
        id: 'invalid-uuid',
        title: 'Updated Title',
        content: 'Updated Content'
      };

      const result = updateNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(NOTE_ERROR_MESSAGES.INVALID_ID);
      }
    });

    it('rejects empty title', () => {
      const invalidData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: '',
        content: 'Updated Content'
      };

      const result = updateNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(NOTE_ERROR_MESSAGES.TITLE_REQUIRED);
      }
    });
  });

  describe('deleteNoteSchema', () => {
    it('validates valid delete data', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = deleteNoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const invalidData = {
        id: 'invalid-uuid'
      };

      const result = deleteNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(NOTE_ERROR_MESSAGES.INVALID_ID);
      }
    });

    it('rejects empty id', () => {
      const invalidData = {
        id: ''
      };

      const result = deleteNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(NOTE_ERROR_MESSAGES.INVALID_ID);
      }
    });
  });

  describe('NOTE_ERROR_MESSAGES', () => {
    it('contains all required error messages', () => {
      expect(NOTE_ERROR_MESSAGES.TITLE_REQUIRED).toBe('제목을 입력해주세요');
      expect(NOTE_ERROR_MESSAGES.TITLE_TOO_LONG).toBe('제목은 255자를 초과할 수 없습니다');
      expect(NOTE_ERROR_MESSAGES.CONTENT_TOO_LONG).toBe('내용은 10,000자를 초과할 수 없습니다');
      expect(NOTE_ERROR_MESSAGES.INVALID_ID).toBe('유효하지 않은 노트 ID입니다');
      expect(NOTE_ERROR_MESSAGES.SAVE_FAILED).toBe('노트 저장에 실패했습니다');
      expect(NOTE_ERROR_MESSAGES.DELETE_FAILED).toBe('노트 삭제에 실패했습니다');
      expect(NOTE_ERROR_MESSAGES.NOT_FOUND).toBe('노트를 찾을 수 없습니다');
      expect(NOTE_ERROR_MESSAGES.UNAUTHORIZED).toBe('이 노트에 접근할 권한이 없습니다');
    });
  });
});
