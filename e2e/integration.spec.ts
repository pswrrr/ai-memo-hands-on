// e2e/integration.spec.ts
// 전체 통합 브라우저 테스트

import { test, expect } from '@playwright/test';

test.describe('전체 통합 테스트', () => {
  test('노트 생성부터 저장까지 전체 플로우', async ({ page }) => {
    // 노트 생성 페이지로 이동
    await page.goto('/notes/new');
    
    // 제목 입력
    await page.getByPlaceholder('노트 제목을 입력하세요').fill('통합 테스트 노트');
    
    // 리치 텍스트 에디터에서 내용 입력
    const textarea = page.locator('textarea').first();
    await textarea.fill('이것은 통합 테스트를 위한 노트입니다.');
    
    // 굵게 적용
    await textarea.selectText();
    await page.getByTitle('굵게 (Ctrl+B)').click();
    
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    // 마크다운 내용 추가
    await textarea.fill('# 통합 테스트\n\n**굵은 텍스트**\n\n*기울임 텍스트*\n\n- 항목 1\n- 항목 2');
    
    // 미리보기 확인
    await page.getByText('미리보기').click();
    await expect(page.locator('h1')).toContainText('통합 테스트');
    await expect(page.locator('strong')).toContainText('굵은 텍스트');
    await expect(page.locator('em')).toContainText('기울임 텍스트');
    
    // 편집 모드로 돌아가기
    await page.getByText('편집').click();
    
    // 고급 편집 도구 사용
    await page.getByTitle('텍스트 통계').click();
    await expect(page.getByText('텍스트 통계')).toBeVisible();
    await page.getByText('닫기').click();
    
    // 검색 및 바꾸기 사용
    await page.getByTitle('검색 및 바꾸기 (Ctrl+F)').click();
    await page.getByPlaceholder('검색할 텍스트를 입력하세요').fill('통합');
    await page.getByPlaceholder('바꿀 텍스트를 입력하세요').fill('Integration');
    await page.getByText('바꾸기').click();
    
    // 전체화면 모드 테스트
    await page.getByTitle('전체화면 편집 (F11)').click();
    await expect(page.getByText('집중 편집 모드')).toBeVisible();
    await page.getByText('종료').click();
    
    // 저장 버튼 클릭
    await page.getByText('저장').click();
    
    // 저장 완료 후 리다이렉트 확인
    await expect(page).toHaveURL(/\/notes\/\d+/);
  });

  test('다양한 브라우저에서 일관된 동작', async ({ page }) => {
    await page.goto('/notes/new');
    
    // 기본 기능들이 모든 브라우저에서 작동하는지 확인
    await expect(page.getByText('리치 텍스트')).toBeVisible();
    await expect(page.getByText('마크다운')).toBeVisible();
    await expect(page.getByTitle('검색 및 바꾸기 (Ctrl+F)')).toBeVisible();
    await expect(page.getByTitle('자동 완성 (Ctrl+Space)')).toBeVisible();
    await expect(page.getByTitle('텍스트 통계')).toBeVisible();
    await expect(page.getByTitle('전체화면 편집 (F11)')).toBeVisible();
  });

  test('반응형 디자인이 모바일에서 작동한다', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/notes/new');
    
    // 모바일에서도 모든 기능이 접근 가능한지 확인
    await expect(page.getByText('리치 텍스트')).toBeVisible();
    await expect(page.getByText('마크다운')).toBeVisible();
    
    // 터치 인터랙션 테스트
    await page.getByText('마크다운').tap();
    await expect(page.getByText('마크다운')).toHaveClass(/bg-primary/);
    
    // 텍스트 입력 테스트
    const textarea = page.locator('textarea').first();
    await textarea.fill('모바일 테스트');
    
    // 툴바 버튼들이 터치로 작동하는지 확인
    await page.getByTitle('굵게 (Ctrl+B)').tap();
    await expect(textarea).toHaveValue('**모바일 테스트**');
  });

  test('키보드 접근성이 작동한다', async ({ page }) => {
    await page.goto('/notes/new');
    
    // Tab 키로 네비게이션
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Enter로 버튼 활성화
    await page.keyboard.press('Enter');
    
    // 키보드로 리치 텍스트 기능 사용
    const textarea = page.locator('textarea').first();
    await textarea.focus();
    await textarea.fill('키보드 테스트');
    await textarea.selectText();
    
    // Ctrl+B로 굵게 적용
    await page.keyboard.press('Control+b');
    await expect(textarea).toHaveValue('**키보드 테스트**');
  });

  test('에러 처리가 올바르게 작동한다', async ({ page }) => {
    await page.goto('/notes/new');
    
    // 빈 제목으로 저장 시도
    await page.getByText('저장').click();
    
    // 에러 메시지가 표시되는지 확인
    await expect(page.getByText('제목을 입력해주세요')).toBeVisible();
    
    // 제목 입력 후 다시 저장
    await page.getByPlaceholder('노트 제목을 입력하세요').fill('에러 처리 테스트');
    await page.getByText('저장').click();
    
    // 성공적으로 저장되는지 확인
    await expect(page).toHaveURL(/\/notes\/\d+/);
  });

  test('성능이 적절한 수준을 유지한다', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/notes/new');
    
    // 페이지 로드 시간 측정
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3초 이내 로드
    
    // 대량 텍스트 입력 시 성능 테스트
    const textarea = page.locator('textarea').first();
    const longText = '성능 테스트를 위한 긴 텍스트입니다. '.repeat(100);
    
    const inputStartTime = Date.now();
    await textarea.fill(longText);
    const inputTime = Date.now() - inputStartTime;
    
    expect(inputTime).toBeLessThan(1000); // 1초 이내 입력 처리
    
    // 글자 수 카운터가 실시간으로 업데이트되는지 확인
    await expect(page.getByText(/글자 수/)).toBeVisible();
  });
});
