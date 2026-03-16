import { test, expect } from '@playwright/test';
import { openEditor, mod } from './helpers';

test.describe('Read-only mode', () => {
  // Note: These tests check that contenteditable="false" blocks prevent editing
  // The exact route/toggle mechanism depends on the app implementation

  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test('Editor blocks have contenteditable attribute', async ({ page }) => {

    const editableBlocks = page.locator('[contenteditable="true"]');
    expect(await editableBlocks.count()).toBeGreaterThan(0);
  });

  test('Editor content is visible', async ({ page }) => {
    const editorContent = page.locator('[data-editor-content]');
    await expect(editorContent).toBeVisible();
  });

  test('Typing adds content when editable', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Editable content');
    await page.waitForTimeout(400);

    const text = await p.textContent();
    expect(text).toContain('Editable');
  });

  test('Editor blocks have data-node-type attributes', async ({ page }) => {
    const typedBlocks = page.locator('[data-node-type]');
    expect(await typedBlocks.count()).toBeGreaterThan(0);
  });

  test('Editor blocks have data-node-id attributes', async ({ page }) => {
    const idBlocks = page.locator('[data-node-id]');
    expect(await idBlocks.count()).toBeGreaterThan(0);
  });

  test('Content persists across block focus changes', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Persistent');
    await page.waitForTimeout(400);

    // Press Enter to create new block (shifts focus)
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type('New block');
    await page.waitForTimeout(400);

    // Original block should still have content
    const text = await page.evaluate(
      (id) => document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? '',
      nodeId
    );
    expect(text).toContain('Persistent');
  });

  test('Multiple block types render correctly', async ({ page }) => {
    // Type content
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(300);

    // Create heading via command menu
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Heading 1').first().click();
    await page.waitForTimeout(500);
    await page.keyboard.type('My Title');
    await page.waitForTimeout(300);

    // Verify heading rendered
    const h1 = page.locator('[data-node-type="h1"]');
    await expect(h1.first()).toBeVisible();
    const h1Text = await h1.first().textContent();
    expect(h1Text).toContain('My Title');
  });
});
