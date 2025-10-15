import { test, expect } from '@playwright/test';

test.describe('통합 테스트', () => {
  test('리치 텍스트 에디터의 모든 기능이 작동한다', async ({ page }) => {
    await page.goto('/test/rich-text-editor');
    
    // 에디터가 렌더링되는지 확인
    await expect(page.locator('[data-testid="rich-text-editor"]')).toBeVisible();
    
    // 텍스트 입력
    const textarea = page.locator('textarea').first();
    await textarea.fill('테스트 텍스트');
    await textarea.selectText();
    
    // 굵게 버튼 클릭
    await page.getByTitle('굵게 (Ctrl+B)').click();
    
    // 텍스트가 포맷팅되었는지 확인
    await expect(textarea).toHaveValue('**테스트 텍스트**');
    
    // 글자 수 표시 확인
    await expect(page.getByText(/글자 수/)).toBeVisible();
  });

  test('마크다운 에디터의 모든 기능이 작동한다', async ({ page }) => {
    await page.goto('/test/markdown-editor');
    
    // 에디터가 렌더링되는지 확인
    await expect(page.locator('[data-testid="markdown-editor"]')).toBeVisible();
    
    // 텍스트 입력
    const textarea = page.locator('textarea').first();
    await textarea.fill('테스트 텍스트');
    await textarea.selectText();
    
    // 굵게 버튼 클릭
    await page.getByTitle('굵게 (Ctrl+B)').click();
    
    // 텍스트가 포맷팅되었는지 확인
    await expect(textarea).toHaveValue('**테스트 텍스트**');
    
    // 제목 버튼 테스트
    await textarea.fill('제목 텍스트');
    await textarea.selectText();
    await page.getByTitle('제목 1').click();
    await expect(textarea).toHaveValue('# 제목 텍스트');
  });

  test('고급 편집 도구의 모든 기능이 작동한다', async ({ page }) => {
    await page.goto('/test/advanced-tools');
    
    // 고급 도구가 렌더링되는지 확인
    await expect(page.locator('[data-testid="advanced-tools"]')).toBeVisible();
    
    // 검색 및 바꾸기 버튼 클릭
    await page.getByTitle('검색 및 바꾸기 (Ctrl+F)').click();
    
    // 검색 다이얼로그가 열리는지 확인
    await expect(page.getByText('검색 및 바꾸기')).toBeVisible();
    
    // 다이얼로그 닫기
    await page.getByText('취소').click();
    
    // 텍스트 통계 버튼 클릭
    await page.getByTitle('텍스트 통계').click();
    
    // 통계 다이얼로그가 열리는지 확인
    await expect(page.getByText('텍스트 통계')).toBeVisible();
    
    // 다이얼로그 닫기
    await page.getByText('닫기').click();
  });

  test('키보드 단축키가 작동한다', async ({ page }) => {
    await page.goto('/test/rich-text-editor');
    
    const textarea = page.locator('textarea').first();
    await textarea.fill('단축키 테스트');
    await textarea.selectText();
    
    // Ctrl+B 단축키 테스트
    await page.keyboard.press('Control+b');
    await expect(textarea).toHaveValue('**단축키 테스트**');
  });

  test('다크 모드 토글이 작동한다', async ({ page }) => {
    await page.goto('/test/rich-text-editor');
    
    // 다크 모드 버튼 클릭
    await page.getByTitle('다크/라이트 모드').click();
    
    // 다크 모드가 적용되었는지 확인
    await expect(page.locator('[data-testid="rich-text-editor"]')).toHaveClass(/bg-gray-900/);
  });
});
