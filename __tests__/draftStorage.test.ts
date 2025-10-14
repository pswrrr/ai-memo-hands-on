import { saveDraft, loadDraft, clearDraft, hasDraft, type DraftData } from '@/lib/utils/draftStorage';

describe('draftStorage', () => {
  const testUserId = 'test-user-123';
  const testTitle = '테스트 제목';
  const testContent = '테스트 내용';

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('saveDraft', () => {
    it('임시 저장 데이터를 로컬 스토리지에 저장해야 한다', () => {
      saveDraft(testUserId, testTitle, testContent);

      const key = `note-draft-${testUserId}`;
      const stored = localStorage.getItem(key);

      expect(stored).not.toBeNull();
      
      const parsed: DraftData = JSON.parse(stored!);
      expect(parsed.title).toBe(testTitle);
      expect(parsed.content).toBe(testContent);
      expect(parsed.savedAt).toBeLessThanOrEqual(Date.now());
      expect(parsed.expiresAt).toBeGreaterThan(Date.now());
    });

    it('7일 후 만료 시간을 설정해야 한다', () => {
      saveDraft(testUserId, testTitle, testContent);

      const key = `note-draft-${testUserId}`;
      const stored = localStorage.getItem(key);
      const parsed: DraftData = JSON.parse(stored!);

      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const expectedExpiry = parsed.savedAt + sevenDays;

      expect(parsed.expiresAt).toBe(expectedExpiry);
    });
  });

  describe('loadDraft', () => {
    it('저장된 임시 저장 데이터를 로드해야 한다', () => {
      saveDraft(testUserId, testTitle, testContent);

      const loaded = loadDraft(testUserId);

      expect(loaded).not.toBeNull();
      expect(loaded!.title).toBe(testTitle);
      expect(loaded!.content).toBe(testContent);
    });

    it('저장된 데이터가 없으면 null을 반환해야 한다', () => {
      const loaded = loadDraft(testUserId);

      expect(loaded).toBeNull();
    });

    it('만료된 데이터는 null을 반환하고 자동으로 삭제해야 한다', () => {
      // 과거 시간으로 데이터 저장
      const expiredData: DraftData = {
        title: testTitle,
        content: testContent,
        savedAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10일 전
        expiresAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3일 전 만료
      };

      const key = `note-draft-${testUserId}`;
      localStorage.setItem(key, JSON.stringify(expiredData));

      const loaded = loadDraft(testUserId);

      expect(loaded).toBeNull();
      expect(localStorage.getItem(key)).toBeNull();
    });
  });

  describe('clearDraft', () => {
    it('임시 저장 데이터를 삭제해야 한다', () => {
      saveDraft(testUserId, testTitle, testContent);

      clearDraft(testUserId);

      const key = `note-draft-${testUserId}`;
      expect(localStorage.getItem(key)).toBeNull();
    });
  });

  describe('hasDraft', () => {
    it('임시 저장 데이터가 있으면 true를 반환해야 한다', () => {
      saveDraft(testUserId, testTitle, testContent);

      expect(hasDraft(testUserId)).toBe(true);
    });

    it('임시 저장 데이터가 없으면 false를 반환해야 한다', () => {
      expect(hasDraft(testUserId)).toBe(false);
    });

    it('만료된 데이터는 false를 반환해야 한다', () => {
      const expiredData: DraftData = {
        title: testTitle,
        content: testContent,
        savedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        expiresAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      };

      const key = `note-draft-${testUserId}`;
      localStorage.setItem(key, JSON.stringify(expiredData));

      expect(hasDraft(testUserId)).toBe(false);
    });
  });

  describe('사용자별 키 분리', () => {
    it('다른 사용자의 임시 저장 데이터는 독립적이어야 한다', () => {
      const userId1 = 'user-1';
      const userId2 = 'user-2';

      saveDraft(userId1, '제목1', '내용1');
      saveDraft(userId2, '제목2', '내용2');

      const draft1 = loadDraft(userId1);
      const draft2 = loadDraft(userId2);

      expect(draft1!.title).toBe('제목1');
      expect(draft2!.title).toBe('제목2');
    });
  });
});

