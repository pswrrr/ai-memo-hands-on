// 노트 목록 캐싱 유틸리티
// 메모리 기반 캐싱으로 노트 로딩 성능 향상

interface CachedNotes {
  notes: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalNotes: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  timestamp: number;
  userId: string;
  sortBy: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  lastCleanup: Date;
}

class NotesCache {
  private cache: Map<string, CachedNotes> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    lastCleanup: new Date(),
  };
  private readonly TTL = 5 * 60 * 1000; // 5분
  private readonly MAX_SIZE = 100; // 최대 캐시 항목 수

  // 캐시 키 생성
  private generateKey(userId: string, page: number, sortBy: string): string {
    return `${userId}:${page}:${sortBy}`;
  }

  // 캐시에서 노트 목록 조회
  get(userId: string, page: number, sortBy: string): CachedNotes | null {
    const key = this.generateKey(userId, page, sortBy);
    const cached = this.cache.get(key);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // TTL 확인
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size--;
      return null;
    }

    this.stats.hits++;
    return cached;
  }

  // 캐시에 노트 목록 저장
  set(
    userId: string, 
    page: number, 
    sortBy: string, 
    notes: any[], 
    pagination: any
  ): void {
    const key = this.generateKey(userId, page, sortBy);
    
    // 캐시 크기 제한
    if (this.stats.size >= this.MAX_SIZE) {
      this.cleanup();
    }

    const cached: CachedNotes = {
      notes,
      pagination,
      timestamp: Date.now(),
      userId,
      sortBy,
    };

    this.cache.set(key, cached);
    this.stats.size++;
  }

  // 사용자별 캐시 무효화
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key, cached] of this.cache.entries()) {
      if (cached.userId === userId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.size--;
    });

    console.log(`🗑️ 사용자 ${userId}의 캐시 무효화: ${keysToDelete.length}개 항목 제거`);
  }

  // 특정 노트 관련 캐시 무효화
  invalidateNote(userId: string, noteId: string): void {
    this.invalidateUser(userId);
    console.log(`🗑️ 노트 ${noteId} 관련 캐시 무효화`);
  }

  // 만료된 캐시 정리
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.TTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.stats.size--;
    });

    this.stats.lastCleanup = new Date();
    
    if (keysToDelete.length > 0) {
      console.log(`🧹 캐시 정리: ${keysToDelete.length}개 만료된 항목 제거`);
    }
  }

  // 캐시 통계 조회
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
    };
  }

  // 캐시 초기화
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: new Date(),
    };
    console.log('🗑️ 캐시 초기화 완료');
  }

  // 주기적 정리 (5분마다)
  startPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
}

// 싱글톤 인스턴스
const notesCache = new NotesCache();

// 주기적 정리 시작
notesCache.startPeriodicCleanup();

export default notesCache;

// 편의 함수들
export function getCachedNotes(userId: string, page: number, sortBy: string) {
  return notesCache.get(userId, page, sortBy);
}

export function setCachedNotes(
  userId: string, 
  page: number, 
  sortBy: string, 
  notes: any[], 
  pagination: any
) {
  notesCache.set(userId, page, sortBy, notes, pagination);
}

export function invalidateUserCache(userId: string) {
  notesCache.invalidateUser(userId);
}

export function invalidateNoteCache(userId: string, noteId: string) {
  notesCache.invalidateNote(userId, noteId);
}

export function getCacheStats() {
  return notesCache.getStats();
}

export function clearCache() {
  notesCache.clear();
}
