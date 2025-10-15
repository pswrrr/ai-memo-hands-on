// e2e/markdown-editor.spec.ts
// 마크다운 에디터 브라우저 테스트

import { test, expect } from '@playwright/test';

test.describe('마크다운 에디터', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notes/new');
  });

  test('마크다운 에디터로 전환된다', async ({ page }) => {
    // 마크다운 버튼 클릭
    await page.getByText('마크다운').click();
    
    // 마크다운 모드가 활성화되었는지 확인
    await expect(page.getByText('마크다운')).toHaveClass(/bg-primary/);
  });

  test('마크다운 툴바가 표시된다', async ({ page }) => {
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    // 툴바 버튼들이 표시되는지 확인
    await expect(page.getByTitle('굵게 (Ctrl+B)')).toBeVisible();
    await expect(page.getByTitle('기울임 (Ctrl+I)')).toBeVisible();
    await expect(page.getByTitle('인라인 코드 (Ctrl+`)')).toBeVisible();
  });

  test('마크다운 실시간 미리보기가 작동한다', async ({ page }) => {
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    // 마크다운 텍스트 입력
    const textarea = page.locator('textarea').first();
    await textarea.fill('# 제목\n\n**굵은 텍스트**\n\n*기울임 텍스트*');
    
    // 미리보기 버튼 클릭
    await page.getByText('미리보기').click();
    
    // 미리보기에서 렌더링된 내용 확인
    await expect(page.locator('h1')).toContainText('제목');
    await expect(page.locator('strong')).toContainText('굵은 텍스트');
    await expect(page.locator('em')).toContainText('기울임 텍스트');
  });

  test('마크다운 단축키가 작동한다', async ({ page }) => {
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    const textarea = page.locator('textarea').first();
    await textarea.fill('단축키 테스트');
    await textarea.selectText();
    
    // Ctrl+B 단축키 테스트
    await page.keyboard.press('Control+b');
    await expect(textarea).toHaveValue('**단축키 테스트**');
  });

  test('코드 블록이 올바르게 렌더링된다', async ({ page }) => {
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    const textarea = page.locator('textarea').first();
    await textarea.fill('```javascript\nconst hello = "world";\nconsole.log(hello);\n```');
    
    // 미리보기 버튼 클릭
    await page.getByText('미리보기').click();
    
    // 코드 블록이 렌더링되었는지 확인
    await expect(page.locator('pre code')).toBeVisible();
  });

  test('링크가 올바르게 렌더링된다', async ({ page }) => {
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    const textarea = page.locator('textarea').first();
    await textarea.fill('[Google](https://google.com)');
    
    // 미리보기 버튼 클릭
    await page.getByText('미리보기').click();
    
    // 링크가 렌더링되었는지 확인
    const link = page.locator('a[href="https://google.com"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Google');
  });

  test('리스트가 올바르게 렌더링된다', async ({ page }) => {
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    const textarea = page.locator('textarea').first();
    await textarea.fill('- 항목 1\n- 항목 2\n- 항목 3');
    
    // 미리보기 버튼 클릭
    await page.getByText('미리보기').click();
    
    // 리스트가 렌더링되었는지 확인
    await expect(page.locator('li')).toHaveCount(3);
  });

  test('인용구가 올바르게 렌더링된다', async ({ page }) => {
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    const textarea = page.locator('textarea').first();
    await textarea.fill('> 이것은 인용구입니다.');
    
    // 미리보기 버튼 클릭
    await page.getByText('미리보기').click();
    
    // 인용구가 렌더링되었는지 확인
    await expect(page.locator('blockquote')).toContainText('이것은 인용구입니다.');
  });

  test('다크 모드 토글이 작동한다', async ({ page }) => {
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    // 다크 모드 버튼 클릭
    await page.getByTitle('다크/라이트 모드').click();
    
    // 다크 모드가 적용되었는지 확인
    await expect(page.locator('body')).toHaveClass(/dark/);
  });
});
