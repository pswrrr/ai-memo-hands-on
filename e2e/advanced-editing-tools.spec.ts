// e2e/advanced-editing-tools.spec.ts
// 고급 편집 도구 브라우저 테스트

import { test, expect } from '@playwright/test';

test.describe('고급 편집 도구', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notes/new');
  });

  test('고급 편집 도구 툴바가 표시된다', async ({ page }) => {
    // 고급 편집 도구 버튼들이 표시되는지 확인
    await expect(page.getByTitle('검색 및 바꾸기 (Ctrl+F)')).toBeVisible();
    await expect(page.getByTitle('자동 완성 (Ctrl+Space)')).toBeVisible();
    await expect(page.getByTitle('텍스트 통계')).toBeVisible();
    await expect(page.getByTitle('전체화면 편집 (F11)')).toBeVisible();
  });

  test('검색 및 바꾸기 기능이 작동한다', async ({ page }) => {
    // 본문에 텍스트 입력
    const textarea = page.locator('textarea').first();
    await textarea.fill('Hello world! This is a test. Hello again.');
    
    // 검색 및 바꾸기 버튼 클릭
    await page.getByTitle('검색 및 바꾸기 (Ctrl+F)').click();
    
    // 검색 다이얼로그가 열렸는지 확인
    await expect(page.getByText('검색 및 바꾸기')).toBeVisible();
    
    // 검색어 입력
    await page.getByPlaceholder('검색할 텍스트를 입력하세요').fill('Hello');
    
    // 매치 수가 표시되는지 확인
    await expect(page.getByText(/매치/)).toBeVisible();
    
    // 바꿀 텍스트 입력
    await page.getByPlaceholder('바꿀 텍스트를 입력하세요').fill('Hi');
    
    // 바꾸기 버튼 클릭
    await page.getByText('바꾸기').click();
    
    // 텍스트가 바뀌었는지 확인
    await expect(textarea).toHaveValue(/Hi/);
  });

  test('자동 완성 기능이 작동한다', async ({ page }) => {
    // 자동 완성 버튼 클릭
    await page.getByTitle('자동 완성 (Ctrl+Space)').click();
    
    // 자동 완성 다이얼로그가 열렸는지 확인
    await expect(page.getByText('자동 완성')).toBeVisible();
    
    // 검색어 입력
    await page.getByPlaceholder('이전 노트에서 텍스트를 검색하세요').fill('test');
    
    // 검색 결과가 표시되는지 확인 (로컬 스토리지에 데이터가 있다면)
    await expect(page.getByText('검색 결과가 없습니다')).toBeVisible();
  });

  test('텍스트 통계 기능이 작동한다', async ({ page }) => {
    // 본문에 텍스트 입력
    const textarea = page.locator('textarea').first();
    await textarea.fill('Hello world! This is a test sentence. Another sentence here.');
    
    // 텍스트 통계 버튼 클릭
    await page.getByTitle('텍스트 통계').click();
    
    // 통계 다이얼로그가 열렸는지 확인
    await expect(page.getByText('텍스트 통계')).toBeVisible();
    
    // 기본 통계가 표시되는지 확인
    await expect(page.getByText('기본 통계')).toBeVisible();
    await expect(page.getByText('글자 수 (공백 포함)')).toBeVisible();
    await expect(page.getByText('단어 수')).toBeVisible();
    await expect(page.getByText('문장 수')).toBeVisible();
    
    // 시간 통계가 표시되는지 확인
    await expect(page.getByText('시간 통계')).toBeVisible();
    await expect(page.getByText('읽기 시간')).toBeVisible();
    await expect(page.getByText('말하기 시간')).toBeVisible();
    
    // 닫기 버튼 클릭
    await page.getByText('닫기').click();
  });

  test('전체화면 편집 기능이 작동한다', async ({ page }) => {
    // 본문에 텍스트 입력
    const textarea = page.locator('textarea').first();
    await textarea.fill('전체화면 테스트');
    
    // 전체화면 버튼 클릭
    await page.getByTitle('전체화면 편집 (F11)').click();
    
    // 전체화면 모드가 활성화되었는지 확인
    await expect(page.getByText('집중 편집 모드')).toBeVisible();
    
    // 전체화면 헤더가 표시되는지 확인
    await expect(page.getByText('글자 수')).toBeVisible();
    await expect(page.getByText('단어 수')).toBeVisible();
    await expect(page.getByText('읽기 시간')).toBeVisible();
    
    // 미리보기 버튼이 작동하는지 확인
    await page.getByText('미리보기').click();
    await expect(page.getByText('편집')).toBeVisible();
    
    // 다크 모드 토글이 작동하는지 확인
    await page.getByText('다크').click();
    await expect(page.locator('body')).toHaveClass(/dark/);
    
    // 종료 버튼 클릭
    await page.getByText('종료').click();
  });

  test('도움말 패널이 작동한다', async ({ page }) => {
    // 도움말 버튼 클릭
    await page.getByTitle('도움말').click();
    
    // 도움말 패널이 표시되는지 확인
    await expect(page.getByText('고급 편집 도구')).toBeVisible();
    await expect(page.getByText('검색 및 바꾸기:')).toBeVisible();
    await expect(page.getByText('자동 완성:')).toBeVisible();
    await expect(page.getByText('텍스트 통계:')).toBeVisible();
    await expect(page.getByText('전체화면:')).toBeVisible();
    
    // 단축키 정보가 표시되는지 확인
    await expect(page.getByText('단축키')).toBeVisible();
    await expect(page.getByText('Ctrl+F: 검색')).toBeVisible();
    await expect(page.getByText('Ctrl+Space: 자동완성')).toBeVisible();
    await expect(page.getByText('F11: 전체화면')).toBeVisible();
    
    // 닫기 버튼 클릭
    await page.getByText('닫기').click();
  });

  test('키보드 단축키가 작동한다', async ({ page }) => {
    // 본문에 텍스트 입력
    const textarea = page.locator('textarea').first();
    await textarea.fill('단축키 테스트');
    
    // Ctrl+F로 검색 다이얼로그 열기
    await page.keyboard.press('Control+f');
    await expect(page.getByText('검색 및 바꾸기')).toBeVisible();
    
    // ESC로 닫기
    await page.keyboard.press('Escape');
    
    // F11로 전체화면 모드
    await page.keyboard.press('F11');
    await expect(page.getByText('집중 편집 모드')).toBeVisible();
    
    // ESC로 전체화면 종료
    await page.keyboard.press('Escape');
  });

  test('모든 에디터 모드에서 고급 도구가 작동한다', async ({ page }) => {
    // 리치 텍스트 모드에서 고급 도구 확인
    await expect(page.getByTitle('검색 및 바꾸기 (Ctrl+F)')).toBeVisible();
    
    // 마크다운 모드로 전환
    await page.getByText('마크다운').click();
    
    // 마크다운 모드에서도 고급 도구가 표시되는지 확인
    await expect(page.getByTitle('검색 및 바꾸기 (Ctrl+F)')).toBeVisible();
    await expect(page.getByTitle('자동 완성 (Ctrl+Space)')).toBeVisible();
    await expect(page.getByTitle('텍스트 통계')).toBeVisible();
    await expect(page.getByTitle('전체화면 편집 (F11)')).toBeVisible();
  });
});
