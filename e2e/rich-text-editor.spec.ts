// e2e/rich-text-editor.spec.ts
// 리치 텍스트 에디터 브라우저 테스트

import { test, expect } from '@playwright/test';

test.describe('리치 텍스트 에디터', () => {
  test.beforeEach(async ({ page }) => {
    // 노트 편집 페이지로 이동
    await page.goto('/notes/new');
  });

  test('리치 텍스트 에디터가 올바르게 렌더링된다', async ({ page }) => {
    // 리치 텍스트 버튼이 표시되는지 확인
    await expect(page.getByText('리치 텍스트')).toBeVisible();
    
    // 리치 텍스트 모드가 기본으로 선택되어 있는지 확인
    await expect(page.getByText('리치 텍스트')).toHaveClass(/bg-primary/);
  });

  test('굵게 기능이 작동한다', async ({ page }) => {
    // 본문 입력 필드에 텍스트 입력
    const textarea = page.locator('textarea').first();
    await textarea.fill('테스트 텍스트');
    
    // 텍스트 선택
    await textarea.selectText();
    
    // 굵게 버튼 클릭
    await page.getByTitle('굵게 (Ctrl+B)').click();
    
    // 굵게가 적용되었는지 확인
    await expect(textarea).toHaveValue('**테스트 텍스트**');
  });

  test('기울임 기능이 작동한다', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('기울임 텍스트');
    await textarea.selectText();
    
    // 기울임 버튼 클릭
    await page.getByTitle('기울임 (Ctrl+I)').click();
    
    // 기울임이 적용되었는지 확인
    await expect(textarea).toHaveValue('*기울임 텍스트*');
  });

  test('밑줄 기능이 작동한다', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('밑줄 텍스트');
    await textarea.selectText();
    
    // 밑줄 버튼 클릭
    await page.getByTitle('밑줄 (Ctrl+U)').click();
    
    // 밑줄이 적용되었는지 확인
    await expect(textarea).toHaveValue('<u>밑줄 텍스트</u>');
  });

  test('헤딩 스타일이 작동한다', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('제목 텍스트');
    await textarea.selectText();
    
    // 헤딩 스타일 선택
    await page.getByText('스타일').click();
    await page.getByText('제목 1').click();
    
    // H1 헤딩이 적용되었는지 확인
    await expect(textarea).toHaveValue('# 제목 텍스트');
  });

  test('키보드 단축키가 작동한다', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    await textarea.fill('단축키 테스트');
    await textarea.selectText();
    
    // Ctrl+B 단축키 테스트
    await page.keyboard.press('Control+b');
    await expect(textarea).toHaveValue('**단축키 테스트**');
  });

  test('다크 모드 토글이 작동한다', async ({ page }) => {
    // 다크 모드 버튼 클릭
    await page.getByTitle('다크/라이트 모드').click();
    
    // 다크 모드가 적용되었는지 확인 (body에 dark 클래스가 있는지)
    await expect(page.locator('body')).toHaveClass(/dark/);
  });

  test('글자 수 카운터가 작동한다', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    
    // 텍스트 입력
    await textarea.fill('글자 수 테스트');
    
    // 글자 수가 표시되는지 확인
    await expect(page.getByText(/글자 수/)).toBeVisible();
  });

  test('최대 글자 수 제한이 작동한다', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    
    // 긴 텍스트 입력 (10,000자 초과)
    const longText = 'a'.repeat(10001);
    await textarea.fill(longText);
    
    // 에러 메시지가 표시되는지 확인
    await expect(page.getByText('본문은 10,000자를 초과할 수 없습니다')).toBeVisible();
  });
});
