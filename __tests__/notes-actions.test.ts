import { createNote, updateNote, deleteNote } from '../app/actions/notes';
import { db } from '../lib/db';
import { createClient } from '../lib/supabase-server';

// Mock dependencies
jest.mock('../lib/db', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ id: 'test-note-id' }]))
      }))
    })),
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve([{ id: 'test-note-id', userId: 'test-user-id' }]))
        }))
      }))
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([{ id: 'test-note-id' }]))
        }))
      }))
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({
        returning: jest.fn(() => Promise.resolve([{ id: 'test-note-id' }]))
      }))
    }))
  }
}));

jest.mock('../lib/supabase-server', () => ({
  createClient: jest.fn()
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

describe('Notes Actions', () => {
  const mockSupabase = {
    auth: {
      getUser: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('createNote', () => {
    it('creates note successfully with authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('content', 'Test Content');

      const result = await createNote(formData);

      expect(result).toEqual({
        success: true,
        noteId: 'test-note-id'
      });
      expect(db.insert).toHaveBeenCalled();
    });

    it('returns error for unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      });

      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('content', 'Test Content');

      const result = await createNote(formData);

      expect(result).toEqual({
        success: false,
        error: '로그인이 필요합니다'
      });
    });

    it('validates input data', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const formData = new FormData();
      formData.append('title', ''); // Empty title
      formData.append('content', 'Test Content');

      const result = await createNote(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('제목을 입력해주세요');
    });

    it('handles database errors', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      (db.insert as jest.Mock).mockImplementation(() => {
        throw new Error('Database error');
      });

      const formData = new FormData();
      formData.append('title', 'Test Title');
      formData.append('content', 'Test Content');

      const result = await createNote(formData);

      expect(result).toEqual({
        success: false,
        error: 'Database error'
      });
    });
  });

  describe('updateNote', () => {
    it('updates note successfully with authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const formData = new FormData();
      formData.append('id', 'test-note-id');
      formData.append('title', 'Updated Title');
      formData.append('content', 'Updated Content');

      const result = await updateNote(formData);

      expect(result).toEqual({
        success: true,
        noteId: 'test-note-id'
      });
    });

    it('returns error when note not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve([])) // Empty result
          }))
        }))
      });

      const formData = new FormData();
      formData.append('id', 'non-existent-id');
      formData.append('title', 'Updated Title');
      formData.append('content', 'Updated Content');

      const result = await updateNote(formData);

      expect(result).toEqual({
        success: false,
        error: '노트를 찾을 수 없습니다'
      });
    });
  });

  describe('deleteNote', () => {
    it('deletes note successfully with authenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      const formData = new FormData();
      formData.append('id', 'test-note-id');

      const result = await deleteNote(formData);

      expect(result).toEqual({
        success: true
      });
    });

    it('returns error when note not found', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      });

      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn(() => ({
          returning: jest.fn(() => Promise.resolve([])) // Empty result
        }))
      });

      const formData = new FormData();
      formData.append('id', 'non-existent-id');

      const result = await deleteNote(formData);

      expect(result).toEqual({
        success: false,
        error: '노트를 찾을 수 없습니다'
      });
    });
  });
});
