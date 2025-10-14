// lib/utils/draftStorage.ts
// 로컬 스토리지 기반 노트 임시 저장 유틸리티
// Story 2.9: 노트 작성 중 임시 저장

export interface DraftData {
  title: string;
  content: string;
  savedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp (savedAt + 7 days)
}

const DRAFT_EXPIRY_DAYS = 7;

/**
 * 사용자별 임시 저장 키 생성
 */
function getDraftKey(userId: string): string {
  return `note-draft-${userId}`;
}

/**
 * 임시 저장 데이터 저장
 */
export function saveDraft(userId: string, title: string, content: string): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const expiresAt = now + DRAFT_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7일 후

  const draftData: DraftData = {
    title,
    content,
    savedAt: now,
    expiresAt,
  };

  try {
    const key = getDraftKey(userId);
    localStorage.setItem(key, JSON.stringify(draftData));
  } catch (error) {
    console.error('임시 저장 실패:', error);
  }
}

/**
 * 임시 저장 데이터 로드
 */
export function loadDraft(userId: string): DraftData | null {
  if (typeof window === 'undefined') return null;

  try {
    const key = getDraftKey(userId);
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    const draftData: DraftData = JSON.parse(stored);

    // 만료 확인
    if (Date.now() > draftData.expiresAt) {
      // 만료된 데이터는 자동 삭제
      clearDraft(userId);
      return null;
    }

    return draftData;
  } catch (error) {
    console.error('임시 저장 로드 실패:', error);
    return null;
  }
}

/**
 * 임시 저장 데이터 삭제
 */
export function clearDraft(userId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getDraftKey(userId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('임시 저장 삭제 실패:', error);
  }
}

/**
 * 임시 저장 데이터 존재 여부 확인
 */
export function hasDraft(userId: string): boolean {
  return loadDraft(userId) !== null;
}

