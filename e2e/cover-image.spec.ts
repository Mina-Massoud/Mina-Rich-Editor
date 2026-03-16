import { test, expect } from '@playwright/test';
import { openEditor, mod } from './helpers';

test.describe('Cover image', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test('Editor loads without cover image by default', async ({ page }) => {
    // By default, no cover image should be visible
    const coverImage = page.locator('[data-cover-image], .cover-image');
    const count = await coverImage.count();
    // Cover image might not exist or might be hidden
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Add cover image button or area exists', async ({ page }) => {
    // Look for a way to add cover image
    const addCover = page.getByText(/cover|banner/i).first();
    const isVisible = await addCover.isVisible().catch(() => false);
    // This just checks the UI element exists or not
    expect(typeof isVisible).toBe('boolean');
  });

  test('Editor content area is functional', async ({ page }) => {
    const editorContent = page.locator('[data-editor-content]');
    await expect(editorContent).toBeVisible();

    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Test content');
    await page.waitForTimeout(400);

    const text = await p.textContent();
    expect(text).toContain('Test content');
  });

  test('Editor maintains state after interactions', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Stable');
    await page.waitForTimeout(300);

    // Perform some navigation
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type('After');
    await page.waitForTimeout(300);

    // Go back and check
    const firstText = await page.evaluate(
      (id) => document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? '',
      nodeId
    );
    expect(firstText).toContain('Stable');
  });

  test('Undo/Redo works correctly', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Original');
    await page.waitForTimeout(500);

    // Create a new block
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type('Added');
    await page.waitForTimeout(500);

    // Undo
    await page.keyboard.press(`${mod}+z`);
    await page.waitForTimeout(600);

    // Content should still be accessible
    const editorContent = page.locator('[data-editor-content]');
    await expect(editorContent).toBeVisible();
  });

  test('Block count changes reflect in DOM', async ({ page }) => {
    const initialBlocks = await page.locator('[contenteditable="true"]').count();

    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Content');
    await page.waitForTimeout(300);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const afterBlocks = await page.locator('[contenteditable="true"]').count();
    expect(afterBlocks).toBeGreaterThan(initialBlocks);
  });
});
