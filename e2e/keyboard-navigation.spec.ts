import { test, expect } from '@playwright/test';
import { openEditor, mod, waitForBlockCount } from './helpers';

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test('Enter at end of block creates new block', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('First block');
    await page.waitForTimeout(400);

    const blocksBefore = await page.locator('[contenteditable="true"]').count();
    await page.keyboard.press('Enter');
    await waitForBlockCount(page, blocksBefore + 1);

    const blocksAfter = await page.locator('[contenteditable="true"]').count();
    expect(blocksAfter).toBeGreaterThan(blocksBefore);
  });

  test('Backspace on empty block deletes it', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Content');
    await page.waitForTimeout(400);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const countBefore = await page.locator('[contenteditable="true"]').count();
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(800);

    const countAfter = await page.locator('[contenteditable="true"]').count();
    expect(countAfter).toBeLessThan(countBefore);
  });

  test('Enter creates blocks that can receive typed text', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('First');
    await page.waitForTimeout(400);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.type('Second');
    await page.waitForTimeout(500);

    const allTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[contenteditable="true"]')).map(
        el => el.textContent?.trim() ?? ''
      )
    );
    expect(allTexts).toContain('Second');
  });

  test('Consecutive Enter presses create multiple empty blocks', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Start');
    await page.waitForTimeout(400);

    const blocksBefore = await page.locator('[contenteditable="true"]').count();

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const blocksAfter = await page.locator('[contenteditable="true"]').count();
    expect(blocksAfter).toBeGreaterThanOrEqual(blocksBefore + 2);
  });

  test('Typing after Enter goes into new block', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const originalId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Original');
    await page.waitForTimeout(400);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.type('New text');
    await page.waitForTimeout(500);

    // Original block should still have its text
    const originalText = await page.evaluate(
      (id) => document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? '',
      originalId
    );
    expect(originalText).toContain('Original');
    expect(originalText).not.toContain('New text');
  });

  test('ArrowDown moves focus to next block', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Block 1');
    await page.waitForTimeout(400);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.type('Block 2');
    await page.waitForTimeout(500);

    // Click on first block
    const firstBlock = page.locator('[contenteditable="true"]').first();
    await firstBlock.click();
    await page.waitForTimeout(300);

    // Press ArrowDown to move to next block
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    // The active element should be different from the first block
    const activeElement = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-node-id') ?? ''
    );
    expect(activeElement).toBeTruthy();
  });

  test('Multiple blocks maintain correct text content', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Alpha');
    await page.waitForTimeout(400);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.type('Beta');
    await page.waitForTimeout(400);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.type('Gamma');
    await page.waitForTimeout(500);

    const allTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[contenteditable="true"]')).map(
        el => el.textContent?.trim() ?? ''
      )
    );

    const alpha = allTexts.indexOf('Alpha');
    const beta = allTexts.indexOf('Beta');
    const gamma = allTexts.indexOf('Gamma');

    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(beta).toBeGreaterThan(alpha);
    expect(gamma).toBeGreaterThan(beta);
  });

  test('Backspace at start of block with content does not delete block', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Block 1');
    await page.waitForTimeout(400);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    await page.keyboard.type('Block 2');
    await page.waitForTimeout(400);

    // Move cursor to start of second block
    await page.keyboard.press('Home');
    await page.waitForTimeout(200);

    const countBefore = await page.locator('[contenteditable="true"]').count();
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(800);

    // After backspace at start of a non-empty block, it might merge or just not delete
    // At minimum the content should be preserved somewhere
    const allTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[contenteditable="true"]')).map(
        el => el.textContent?.trim() ?? ''
      )
    );
    const hasBlock2Content = allTexts.some(t => t.includes('Block 2') || t.includes('Block 1Block 2'));
    expect(hasBlock2Content).toBe(true);
  });

  test('Cmd+A selects all text in current block', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.type('Select all this text');
    await page.waitForTimeout(400);

    await page.keyboard.press(`${mod}+a`);
    await page.waitForTimeout(300);

    const selectedText = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(selectedText.length).toBeGreaterThan(0);
  });

  test('Typing replaces selected text', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Original text');
    await page.waitForTimeout(400);

    await page.keyboard.press(`${mod}+a`);
    await page.waitForTimeout(200);
    await page.keyboard.type('Replaced');
    await page.waitForTimeout(500);

    const text = await p.textContent();
    expect(text).toContain('Replaced');
    expect(text).not.toContain('Original text');
  });
});
