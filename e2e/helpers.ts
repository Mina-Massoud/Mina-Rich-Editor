import { Page, expect } from '@playwright/test';

export const mod = process.platform === 'darwin' ? 'Meta' : 'Control';

export async function openEditor(page: Page) {
  await page.goto('/demo');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-editor-content]', { timeout: 10000 });
  await page.waitForTimeout(1000);
}

/**
 * Select text across potentially multiple DOM nodes (e.g. after bold/italic splits the text).
 * Walks all text nodes under the block element and calculates correct start/end positions.
 */
export async function selectTextInBlock(
  page: Page,
  nodeId: string,
  start: number,
  end: number,
) {
  await page.evaluate(
    ({ id, s, e }: { id: string; s: number; e: number }) => {
      const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let offset = 0;
      let startNode: Node | null = null, startOff = 0;
      let endNode: Node | null = null, endOff = 0;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const len = node.textContent?.length ?? 0;
        if (!startNode && offset + len > s) { startNode = node; startOff = s - offset; }
        if (!endNode && offset + len >= e) { endNode = node; endOff = e - offset; break; }
        offset += len;
      }
      if (startNode && endNode) {
        const range = document.createRange();
        range.setStart(startNode, startOff);
        range.setEnd(endNode, endOff);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.dispatchEvent(new Event('selectionchange'));
      }
    },
    { id: nodeId, s: start, e: end },
  );
  // 150ms debounce + render headroom
  await page.waitForTimeout(600);
}

export async function getFreshParagraph(page: Page) {
  const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
  await p.click();
  await page.keyboard.press(`${mod}+a`);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(300);
  return p;
}

export async function typeInEditor(page: Page, text: string) {
  await page.keyboard.type(text, { delay: 40 });
  await page.waitForTimeout(400);
}

/**
 * Wait for a block to have a specific data-node-type attribute.
 */
export async function waitForBlockType(page: Page, nodeId: string, expectedType: string, timeout = 5000) {
  await page.waitForFunction(
    ({ id, type }) => document.querySelector(`[data-node-id="${id}"]`)?.getAttribute('data-node-type') === type,
    { id: nodeId, type: expectedType },
    { timeout }
  );
}

/**
 * Wait until at least `min` contenteditable blocks exist.
 */
export async function waitForBlockCount(page: Page, min: number, timeout = 5000) {
  await page.waitForFunction(
    (n) => document.querySelectorAll('[contenteditable="true"]').length >= n,
    min,
    { timeout }
  );
}
