import { test, expect } from '@playwright/test';
import { openEditor, mod } from './helpers';

test.describe('Special characters and content', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test('Emoji characters are preserved', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Hello 🌍🎉');
    await page.waitForTimeout(500);

    const text = await p.textContent();
    expect(text).toContain('🌍');
    expect(text).toContain('🎉');
  });

  test('HTML entities are escaped (XSS prevention)', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('<script>alert("xss")</script>');
    await page.waitForTimeout(500);

    // The text should be displayed as literal text, not executed
    const text = await p.textContent();
    expect(text).toContain('<script>');

    // No alert dialog should have appeared
    // The inner HTML should have escaped the tags
    const innerHTML = await p.innerHTML();
    expect(innerHTML).not.toContain('<script>');
  });

  test('Long text does not break editor layout', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);

    const longText = 'A'.repeat(500);
    await page.keyboard.type(longText);
    await page.waitForTimeout(500);

    const text = await p.textContent();
    expect(text?.length).toBeGreaterThanOrEqual(500);

    // Editor should still be visible and not overflow
    const editorContent = page.locator('[data-editor-content]');
    await expect(editorContent).toBeVisible();
  });

  test('Consecutive Enter creates multiple blocks', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('First');
    await page.waitForTimeout(300);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const blocks = await page.locator('[contenteditable="true"]').count();
    expect(blocks).toBeGreaterThanOrEqual(3);
  });

  test('Special punctuation preserved', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Quotes: "hello" \'world\' — em-dash & ampersand');
    await page.waitForTimeout(500);

    const text = await p.textContent();
    expect(text).toContain('&');
    expect(text).toContain('—');
  });

  test('Whitespace characters handled correctly', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Hello     World');
    await page.waitForTimeout(500);

    const text = await p.textContent();
    expect(text).toContain('Hello');
    expect(text).toContain('World');
  });

  test('Numbers and symbols preserved', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Price: $99.99 | 50% off! #sale @store');
    await page.waitForTimeout(500);

    const text = await p.textContent();
    expect(text).toContain('$99.99');
    expect(text).toContain('50%');
    expect(text).toContain('#sale');
  });

  test('Mixed content types in sequence', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Normal text');
    await page.waitForTimeout(300);

    // Create heading
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Heading 1').first().click();
    await page.waitForTimeout(500);
    await page.keyboard.type('Heading');
    await page.waitForTimeout(300);

    // Back to paragraph
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type('More text');
    await page.waitForTimeout(400);

    // Should have both heading and paragraphs
    const h1 = page.locator('[data-node-type="h1"]');
    const paragraphs = page.locator('[data-node-type="p"]');
    expect(await h1.count()).toBeGreaterThan(0);
    expect(await paragraphs.count()).toBeGreaterThan(0);
  });
});
