# 목업 데이터 생성 가이드

AI 메모장 애플리케이션의 목업 데이터를 Supabase에 추가하는 방법입니다.

## 📋 생성되는 데이터

### 노트 (8개)
1. **프로젝트 킥오프 미팅 노트** - 1시간 전 (업무, 미팅, 프로젝트)
2. **React 19 새로운 기능 정리** - 3시간 전 (학습, React, 프론트엔드)
3. **새로운 앱 아이디어: 일일 감사 일기** - 1일 전 (아이디어, 앱개발, 사이드프로젝트)
4. **2024년 1분기 회고** - 30일 전 (회고, 업무)
5. **장보기 목록** - 2일 전 (개인, 장보기)
6. **TypeScript 베스트 프랙티스** - 5일 전 (학습, TypeScript, 베스트프랙티스)
7. **오래된 회의록 (삭제됨)** - 10일 전 생성, 2일 전 삭제
8. **임시 메모 (삭제됨)** - 3일 전 생성, 1시간 전 삭제

### 태그 (17개)
다양한 카테고리의 태그가 노트에 자동으로 연결됩니다.

### AI 요약 (4개)
주요 노트에 대한 AI 요약이 생성됩니다.

## 🚀 사용 방법

### 1. 사용자 ID 확인

먼저 Supabase에서 현재 로그인한 사용자의 ID를 확인합니다.

**방법 1: Supabase Dashboard**
1. Supabase 프로젝트 대시보드로 이동
2. Authentication > Users 메뉴 클릭
3. 사용자 목록에서 본인의 User UID 복사

**방법 2: SQL Editor에서 조회**
```sql
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 10;
```

### 2. SQL 파일 수정

`scripts/seed-mock-data.sql` 파일을 열고, 8번째 줄의 사용자 ID를 변경합니다:

```sql
DECLARE
  v_user_id uuid := 'YOUR_USER_ID_HERE'; -- 여기에 실제 사용자 ID 입력
```

예시:
```sql
DECLARE
  v_user_id uuid := 'fbd8f4ba-2a67-4cb1-9b2c-3f48100968dd';
```

### 3. Supabase SQL Editor에서 실행

1. Supabase 프로젝트 대시보드로 이동
2. **SQL Editor** 메뉴 클릭
3. **New Query** 버튼 클릭
4. `scripts/seed-mock-data.sql` 파일의 내용을 복사하여 붙여넣기
5. **Run** 버튼 클릭 (또는 Ctrl/Cmd + Enter)

### 4. 실행 결과 확인

성공적으로 실행되면 다음과 같은 메시지가 표시됩니다:
```
✅ 목업 데이터 생성 완료!
생성된 노트: 8개 (활성 6개, 삭제됨 2개)
생성된 태그: 17개
생성된 요약: 4개
```

## 📊 데이터 확인 쿼리

### 모든 노트 조회
```sql
SELECT id, title, created_at, deleted_at
FROM notes
ORDER BY created_at DESC;
```

### 활성 노트만 조회 (삭제되지 않은 노트)
```sql
SELECT id, title, created_at
FROM notes
WHERE deleted_at IS NULL
ORDER BY created_at DESC;
```

### 삭제된 노트 조회 (휴지통)
```sql
SELECT id, title, deleted_at
FROM notes
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

### 태그가 있는 노트 조회
```sql
SELECT n.title, array_agg(nt.tag) as tags
FROM notes n
LEFT JOIN note_tags nt ON n.id = nt.note_id
WHERE n.deleted_at IS NULL
GROUP BY n.id, n.title
ORDER BY n.created_at DESC;
```

### 요약이 있는 노트 조회
```sql
SELECT n.title, s.model, s.content
FROM notes n
INNER JOIN summaries s ON n.id = s.note_id
WHERE n.deleted_at IS NULL
ORDER BY n.created_at DESC;
```

## 🧹 데이터 삭제 (선택사항)

모든 목업 데이터를 삭제하려면:

```sql
-- 주의: 이 쿼리는 모든 노트, 태그, 요약을 삭제합니다!
DELETE FROM note_tags;
DELETE FROM summaries;
DELETE FROM notes;
```

특정 사용자의 데이터만 삭제:
```sql
DELETE FROM note_tags 
WHERE note_id IN (SELECT id FROM notes WHERE user_id = 'YOUR_USER_ID');

DELETE FROM summaries 
WHERE note_id IN (SELECT id FROM notes WHERE user_id = 'YOUR_USER_ID');

DELETE FROM notes 
WHERE user_id = 'YOUR_USER_ID';
```

## 🎯 테스트 시나리오

생성된 목업 데이터로 다음 기능들을 테스트할 수 있습니다:

### Story 2.3: 노트 목록 조회 및 페이지네이션
- 8개의 노트로 페이지네이션 동작 확인

### Story 2.4: 노트 상세 조회
- 다양한 길이의 노트 내용 확인
- 짧은 메모부터 긴 기술 문서까지

### Story 2.6: 노트 삭제 및 복구
- 휴지통에 2개의 삭제된 노트 확인
- 복구 기능 테스트

### Story 2.7: 노트 정렬 옵션
- **최신순**: 1시간 전 → 10일 전 순서
- **과거순**: 30일 전 → 1시간 전 순서
- **제목순**: ㄱ, ㅈ, ㅌ, ㅍ 순서
- **제목 역순**: ㅍ, ㅌ, ㅈ, ㄱ 순서

### Epic 4: AI 요약 및 태그
- 4개의 노트에 AI 요약 데이터
- 17개의 태그로 필터링 테스트

### Epic 5: 검색 및 필터링
- 다양한 키워드로 검색 테스트
- 태그 기반 필터링 테스트

## 💡 팁

1. **여러 사용자 테스트**: 다른 사용자 ID로 스크립트를 여러 번 실행하여 다중 사용자 환경 시뮬레이션

2. **시간 조정**: `NOW() - INTERVAL` 값을 변경하여 생성 시간 조정 가능
   ```sql
   NOW() - INTERVAL '1 hour'  -- 1시간 전
   NOW() - INTERVAL '3 days'  -- 3일 전
   NOW() - INTERVAL '2 weeks' -- 2주 전
   ```

3. **데이터 추가**: 필요한 경우 스크립트에 더 많은 노트를 추가할 수 있습니다.

4. **백업**: 프로덕션 환경에서 실행하기 전에 항상 데이터베이스 백업을 만드세요!

## 🐛 문제 해결

### "Permission denied" 오류
- Supabase의 RLS (Row Level Security) 정책을 확인하세요
- SQL Editor에서 실행 시 Service Role 권한이 필요할 수 있습니다

### "Foreign key constraint" 오류
- 사용자 ID가 올바른지 확인하세요
- 해당 사용자가 `auth.users` 테이블에 존재하는지 확인하세요

### "Column does not exist" 오류
- 데이터베이스 마이그레이션이 완료되었는지 확인하세요
- 특히 `deleted_at` 컬럼이 추가되었는지 확인 (`0002_daily_colonel_america.sql`)

## 📚 관련 파일

- `lib/db/schema.ts` - 데이터베이스 스키마 정의
- `lib/db/migrations/` - 데이터베이스 마이그레이션 파일
- `app/actions/notes.ts` - 노트 관련 서버 액션

---

**행복한 테스팅 되세요! 🚀**

