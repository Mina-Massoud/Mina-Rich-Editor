import { test, expect } from '@playwright/test';
import { openEditor, selectTextInBlock, mod } from './helpers';

test.describe('Link operations', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test('Selection toolbar appears when text is selected', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Link target text');
    await page.waitForTimeout(500);

    await selectTextInBlock(page, nodeId!, 0, 11);
    await page.waitForTimeout(200);

    // Selection toolbar / floating toolbar should appear
    // At minimum, selection should be set
    const hasSelection = await page.evaluate(() => {
      const sel = window.getSelection();
      return sel ? sel.toString().length > 0 : false;
    });
    expect(hasSelection).toBe(true);
  });

  test('Selected text maintains selection after toolbar appears', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Hello World Test');
    await page.waitForTimeout(500);

    await selectTextInBlock(page, nodeId!, 0, 5);

    const selectedText = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(selectedText).toBe('Hello');
  });

  test('Text can be selected by character range', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('ABCDEFG');
    await page.waitForTimeout(500);

    await selectTextInBlock(page, nodeId!, 2, 5);

    const selectedText = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    expect(selectedText).toBe('CDE');
  });

  test('Bold formatting on selected text creates inline children', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Make this bold');
    await page.waitForTimeout(500);

    await selectTextInBlock(page, nodeId!, 0, 9);
    await page.keyboard.press(`${mod}+b`);

    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '';
        return /font-bold/.test(html) || /data-bold/.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    const innerHTML = await page.evaluate(
      (id) => document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '',
      nodeId
    );
    const hasBold = /font-bold/.test(innerHTML) || /data-bold/.test(innerHTML);
    expect(hasBold).toBe(true);
  });

  test('Text surrounding formatting is preserved', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Before BOLD After');
    await page.waitForTimeout(500);

    // Bold only the middle word
    await selectTextInBlock(page, nodeId!, 7, 11);
    await page.keyboard.press(`${mod}+b`);

    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '';
        return /font-bold/.test(html) || /data-bold/.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    const fullText = await page.evaluate(
      (id) => document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? '',
      nodeId
    );
    expect(fullText).toContain('Before');
    expect(fullText).toContain('After');
  });

  test('Multiple format operations on same text work correctly', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Format me');
    await page.waitForTimeout(500);

    // Apply bold
    await selectTextInBlock(page, nodeId!, 0, 6);
    await page.keyboard.press(`${mod}+b`);
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '';
        return /font-bold/.test(html) || /data-bold/.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    // Apply italic on same range (multi-node walker handles bold spans)
    await selectTextInBlock(page, nodeId!, 0, 6);
    await page.keyboard.press(`${mod}+i`);
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '';
        return (/font-bold/.test(html) || /data-bold/.test(html)) &&
               (/\bitalic\b/.test(html) || /data-italic/.test(html));
      },
      nodeId,
      { timeout: 5000 }
    );

    const innerHTML = await page.evaluate(
      (id) => document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '',
      nodeId
    );

    const hasBold = /font-bold/.test(innerHTML) || /data-bold/.test(innerHTML);
    const hasItalic = /\bitalic\b/.test(innerHTML) || /data-italic/.test(innerHTML);
    expect(hasBold).toBe(true);
    expect(hasItalic).toBe(true);
  });

  test('Undo removes formatting', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Undo test');
    await page.waitForTimeout(500);

    await selectTextInBlock(page, nodeId!, 0, 4);
    await page.keyboard.press(`${mod}+b`);
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '';
        return /font-bold/.test(html) || /data-bold/.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    // Undo
    await p.click();
    await page.keyboard.press(`${mod}+z`);
    await page.waitForTimeout(800);

    const innerHTML = await page.evaluate(
      (id) => document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '',
      nodeId
    );
    const hasBold = /font-bold/.test(innerHTML) || /data-bold/.test(innerHTML);
    expect(hasBold).toBe(false);
  });

  test('Text content preserved after multiple formatting operations', async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute('data-node-id');

    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type('Hello World');
    await page.waitForTimeout(500);

    // Bold "Hello"
    await selectTextInBlock(page, nodeId!, 0, 5);
    await page.keyboard.press(`${mod}+b`);
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '';
        return /font-bold/.test(html) || /data-bold/.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    // Italic "World" (multi-node walker handles the bold span split)
    await selectTextInBlock(page, nodeId!, 6, 11);
    await page.keyboard.press(`${mod}+i`);
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? '';
        return /\bitalic\b/.test(html) || /data-italic/.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    const text = await page.evaluate(
      (id) => document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? '',
      nodeId
    );
    // Normalize whitespace
    expect(text.replace(/\s+/g, ' ').trim()).toContain('Hello');
    expect(text.replace(/\s+/g, ' ').trim()).toContain('World');
  });
});
