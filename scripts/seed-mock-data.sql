-- AI 메모장 목업 데이터 생성 SQL
-- Supabase SQL Editor에서 실행

-- ============================================
-- 1. 기존 목업 데이터 삭제 (선택사항)
-- ============================================
-- 주의: 이 쿼리는 모든 노트, 태그, 요약을 삭제합니다
-- DELETE FROM note_tags;
-- DELETE FROM summaries;
-- DELETE FROM notes;

-- ============================================
-- 2. 변수 설정 (사용자 ID)
-- ============================================
-- 실제 사용자 ID로 교체하세요
-- Supabase Auth 대시보드 또는 다음 쿼리로 확인 가능:
-- SELECT id, email FROM auth.users LIMIT 10;

-- 예시: 실제 사용자 ID를 여기에 입력하세요
DO $$
DECLARE
  v_user_id uuid := '6ec8af02-cca1-479e-9efb-0432af7c2b56'; -- 여기에 실제 사용자 ID 입력
  v_note_id_1 uuid;
  v_note_id_2 uuid;
  v_note_id_3 uuid;
  v_note_id_4 uuid;
  v_note_id_5 uuid;
  v_note_id_6 uuid;
  v_note_id_7 uuid;
  v_note_id_8 uuid;
BEGIN

-- ============================================
-- 3. 노트 데이터 생성
-- ============================================

-- 노트 1: 최근 작성된 업무 노트
INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  v_user_id,
  '프로젝트 킥오프 미팅 노트',
  E'# 프로젝트 킥오프 미팅\n\n## 참석자\n- 김철수 (PM)\n- 이영희 (개발자)\n- 박지민 (디자이너)\n\n## 안건\n1. 프로젝트 목표 및 범위 정의\n2. 일정 및 마일스톤 설정\n3. 역할 및 책임 분담\n\n## 결정사항\n- MVP 출시 목표: 3개월\n- 2주 단위 스프린트 진행\n- 매주 월요일 스탠드업 미팅',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
) RETURNING id INTO v_note_id_1;

-- 노트 2: 학습 노트
INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  v_user_id,
  'React 19 새로운 기능 정리',
  E'# React 19 주요 변경사항\n\n## 1. Server Components\n- 서버에서 렌더링되는 컴포넌트\n- 번들 크기 감소\n- 초기 로딩 속도 향상\n\n## 2. Actions\n- 폼 제출을 간단하게 처리\n- useTransition과 통합\n\n## 3. Document Metadata\n- <title>, <meta> 태그를 컴포넌트에서 직접 관리\n- 더 이상 react-helmet 불필요\n\n## 참고 링크\nhttps://react.dev/blog/2024/04/25/react-19',
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '3 hours'
) RETURNING id INTO v_note_id_2;

-- 노트 3: 아이디어 노트
INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  v_user_id,
  '새로운 앱 아이디어: 일일 감사 일기',
  E'매일 감사한 일 3가지를 기록하는 앱\n\n**주요 기능:**\n- 하루에 3가지 감사한 일 기록\n- 사진 첨부 가능\n- 월별/연도별 회고 기능\n- 감사 통계 (가장 많이 감사한 주제 등)\n\n**차별화 포인트:**\n- 알림 기능으로 매일 저녁 리마인더\n- 감사 카드 공유 기능\n- 간단한 UI/UX\n\n**기술 스택:**\n- Next.js 15\n- Supabase\n- Tailwind CSS',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
) RETURNING id INTO v_note_id_3;

-- 노트 4: 회의 노트 (오래된 노트)
INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  v_user_id,
  '2024년 1분기 회고',
  E'## 잘한 점 (Keep)\n- 테스트 커버리지 80% 달성\n- 배포 자동화 구축\n- 팀 커뮤니케이션 개선\n\n## 개선할 점 (Problem)\n- 기술 부채 누적\n- 문서화 부족\n- 코드 리뷰 시간 부족\n\n## 시도할 점 (Try)\n- 매주 금요일 리팩토링 시간 확보\n- README 작성 의무화\n- PR 템플릿 개선',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '30 days'
) RETURNING id INTO v_note_id_4;

-- 노트 5: 짧은 메모
INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  v_user_id,
  '장보기 목록',
  E'우유, 계란, 빵, 사과, 바나나, 양파, 마늘, 간장, 참기름, 휴지',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
) RETURNING id INTO v_note_id_5;

-- 노트 6: 긴 내용의 노트
INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  v_user_id,
  'TypeScript 베스트 프랙티스',
  E'# TypeScript 베스트 프랙티스\n\n## 1. 타입 정의\n\n### any 사용 지양\n```typescript\n// ❌ 나쁜 예\nconst data: any = fetchData();\n\n// ✅ 좋은 예\ninterface UserData {\n  id: string;\n  name: string;\n}\nconst data: UserData = fetchData();\n```\n\n### unknown 활용\n```typescript\nfunction processValue(value: unknown) {\n  if (typeof value === "string") {\n    console.log(value.toUpperCase());\n  }\n}\n```\n\n## 2. 유틸리티 타입 활용\n\n### Partial\n```typescript\ninterface User {\n  id: string;\n  name: string;\n  email: string;\n}\n\nfunction updateUser(id: string, updates: Partial<User>) {\n  // 일부 필드만 업데이트 가능\n}\n```\n\n### Pick과 Omit\n```typescript\ntype UserPreview = Pick<User, "id" | "name">;\ntype UserWithoutId = Omit<User, "id">;\n```\n\n## 3. 타입 가드\n```typescript\nfunction isString(value: unknown): value is string {\n  return typeof value === "string";\n}\n```\n\n## 4. 제네릭 활용\n```typescript\nfunction identity<T>(arg: T): T {\n  return arg;\n}\n```',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
) RETURNING id INTO v_note_id_6;

-- 노트 7: 삭제된 노트 (휴지통)
INSERT INTO notes (id, user_id, title, content, created_at, updated_at, deleted_at)
VALUES (
  gen_random_uuid(),
  v_user_id,
  '오래된 회의록 (삭제됨)',
  E'이 노트는 더 이상 필요 없어서 삭제되었습니다.',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '2 days'
) RETURNING id INTO v_note_id_7;

-- 노트 8: 최근 삭제된 노트
INSERT INTO notes (id, user_id, title, content, created_at, updated_at, deleted_at)
VALUES (
  gen_random_uuid(),
  v_user_id,
  '임시 메모 (삭제됨)',
  E'테스트용 임시 메모입니다.',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '1 hour'
) RETURNING id INTO v_note_id_8;

-- ============================================
-- 4. 태그 데이터 생성
-- ============================================

-- 노트 1 태그
INSERT INTO note_tags (note_id, tag, created_at)
VALUES 
  (v_note_id_1, '업무', NOW()),
  (v_note_id_1, '미팅', NOW()),
  (v_note_id_1, '프로젝트', NOW());

-- 노트 2 태그
INSERT INTO note_tags (note_id, tag, created_at)
VALUES 
  (v_note_id_2, '학습', NOW()),
  (v_note_id_2, 'React', NOW()),
  (v_note_id_2, '프론트엔드', NOW());

-- 노트 3 태그
INSERT INTO note_tags (note_id, tag, created_at)
VALUES 
  (v_note_id_3, '아이디어', NOW()),
  (v_note_id_3, '앱개발', NOW()),
  (v_note_id_3, '사이드프로젝트', NOW());

-- 노트 4 태그
INSERT INTO note_tags (note_id, tag, created_at)
VALUES 
  (v_note_id_4, '회고', NOW()),
  (v_note_id_4, '업무', NOW());

-- 노트 5 태그
INSERT INTO note_tags (note_id, tag, created_at)
VALUES 
  (v_note_id_5, '개인', NOW()),
  (v_note_id_5, '장보기', NOW());

-- 노트 6 태그
INSERT INTO note_tags (note_id, tag, created_at)
VALUES 
  (v_note_id_6, '학습', NOW()),
  (v_note_id_6, 'TypeScript', NOW()),
  (v_note_id_6, '베스트프랙티스', NOW());

-- ============================================
-- 5. AI 요약 데이터 생성
-- ============================================

-- 노트 1 요약
INSERT INTO summaries (note_id, model, content, created_at)
VALUES (
  v_note_id_1,
  'gemini-1.5-flash',
  '프로젝트 킥오프 미팅에서 MVP 3개월 출시 목표와 2주 스프린트를 결정했습니다. 팀 구성은 PM, 개발자, 디자이너로 이루어져 있으며 매주 월요일 스탠드업 미팅을 진행합니다.',
  NOW()
);

-- 노트 2 요약
INSERT INTO summaries (note_id, model, content, created_at)
VALUES (
  v_note_id_2,
  'gemini-1.5-flash',
  'React 19의 주요 기능으로 Server Components, Actions, Document Metadata가 추가되었습니다. Server Components는 번들 크기를 줄이고 초기 로딩 속도를 향상시킵니다.',
  NOW()
);

-- 노트 3 요약
INSERT INTO summaries (note_id, model, content, created_at)
VALUES (
  v_note_id_3,
  'gemini-1.5-pro',
  '일일 감사 일기 앱 아이디어입니다. 매일 3가지 감사한 일을 기록하고, 사진을 첨부할 수 있으며, 월별/연도별 회고 기능을 제공합니다. Next.js, Supabase, Tailwind CSS를 사용하여 개발할 계획입니다.',
  NOW()
);

-- 노트 6 요약
INSERT INTO summaries (note_id, model, content, created_at)
VALUES (
  v_note_id_6,
  'gemini-1.5-flash',
  'TypeScript 베스트 프랙티스: any 대신 구체적인 타입 정의, unknown 활용, Partial/Pick/Omit 등 유틸리티 타입 사용, 타입 가드와 제네릭 활용을 권장합니다.',
  NOW()
);

-- ============================================
-- 완료 메시지
-- ============================================
RAISE NOTICE '✅ 목업 데이터 생성 완료!';
RAISE NOTICE '생성된 노트: 8개 (활성 6개, 삭제됨 2개)';
RAISE NOTICE '생성된 태그: 17개';
RAISE NOTICE '생성된 요약: 4개';

END $$;

-- ============================================
-- 6. 데이터 확인 쿼리
-- ============================================

-- 생성된 노트 확인
-- SELECT id, title, created_at, deleted_at
-- FROM notes
-- ORDER BY created_at DESC;

-- 태그가 있는 노트 확인
-- SELECT n.title, array_agg(nt.tag) as tags
-- FROM notes n
-- LEFT JOIN note_tags nt ON n.id = nt.note_id
-- WHERE n.deleted_at IS NULL
-- GROUP BY n.id, n.title;

-- 요약이 있는 노트 확인
-- SELECT n.title, s.model, s.content
-- FROM notes n
-- INNER JOIN summaries s ON n.id = s.note_id
-- WHERE n.deleted_at IS NULL;

