import { test, expect } from '@playwright/test';

test.describe('컴포넌트 독립 테스트', () => {
  test('리치 텍스트 에디터 컴포넌트가 독립적으로 작동한다', async ({ page }) => {
    // 컴포넌트를 직접 렌더링하는 테스트 페이지로 이동
    await page.goto('/test/rich-text-editor');
    
    // 리치 텍스트 에디터가 렌더링되는지 확인
    await expect(page.locator('[data-testid="rich-text-editor"]')).toBeVisible();
    
    // 툴바 버튼들이 표시되는지 확인
    await expect(page.getByTitle('굵게 (Ctrl+B)')).toBeVisible();
    await expect(page.getByTitle('기울임 (Ctrl+I)')).toBeVisible();
    await expect(page.getByTitle('밑줄 (Ctrl+U)')).toBeVisible();
    
    // 텍스트 입력 테스트
    const textarea = page.locator('textarea').first();
    await textarea.fill('테스트 텍스트');
    await expect(textarea).toHaveValue('테스트 텍스트');
  });

  test('마크다운 에디터 컴포넌트가 독립적으로 작동한다', async ({ page }) => {
    await page.goto('/test/markdown-editor');
    
    // 마크다운 에디터가 렌더링되는지 확인
    await expect(page.locator('[data-testid="markdown-editor"]')).toBeVisible();
    
    // 마크다운 툴바 버튼들이 표시되는지 확인
    await expect(page.getByTitle('굵게 (Ctrl+B)')).toBeVisible();
    await expect(page.getByTitle('제목 1')).toBeVisible();
    
    // 마크다운 입력 테스트
    const textarea = page.locator('textarea').first();
    await textarea.fill('# 제목\n**굵은 텍스트**');
    await expect(textarea).toHaveValue('# 제목\n**굵은 텍스트**');
  });

  test('고급 편집 도구가 독립적으로 작동한다', async ({ page }) => {
    await page.goto('/test/advanced-tools');
    
    // 고급 편집 도구 버튼들이 표시되는지 확인
    await expect(page.getByTitle('검색 및 바꾸기 (Ctrl+F)')).toBeVisible();
    await expect(page.getByTitle('자동 완성 (Ctrl+Space)')).toBeVisible();
    await expect(page.getByTitle('텍스트 통계')).toBeVisible();
    await expect(page.getByTitle('전체화면 편집 (F11)')).toBeVisible();
  });
});
