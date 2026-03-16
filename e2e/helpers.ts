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

/**
 * Returns an ordered array of data-node-id values from the editor content area.
 */
export async function getBlockOrder(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const editor = document.querySelector('[data-editor-content]');
    if (!editor) return [];
    const blocks = editor.querySelectorAll('[data-node-id]');
    return Array.from(blocks).map((el) => el.getAttribute('data-node-id')!).filter(Boolean);
  });
}

/**
 * Insert an image block via the /image slash command.
 * Returns the data-node-id of the new image block.
 */
export async function insertImageBlock(page: Page): Promise<string> {
  // Ensure we have a fresh paragraph to type into
  const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
  await p.click();
  await page.keyboard.press(`${mod}+a`);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(300);
  // Type "/" to open command menu
  await page.keyboard.type('/');
  await page.waitForTimeout(500);
  // Click the Image option directly
  await page.locator('[cmdk-item]').filter({ hasText: /image/i }).first().click();
  await page.waitForTimeout(1000);
  const imgBlock = page.locator('[data-node-type="img"]').last();
  await imgBlock.waitFor({ state: 'attached', timeout: 5000 });
  const nodeId = await imgBlock.getAttribute('data-node-id');
  return nodeId!;
}

/**
 * Get the text content of a block by its data-node-id.
 */
export async function getBlockText(page: Page, nodeId: string): Promise<string> {
  return page.evaluate((id) => {
    const el = document.querySelector(`[data-node-id="${id}"]`);
    return el?.textContent ?? '';
  }, nodeId);
}

/**
 * Perform a drag-and-drop from one block's drag handle to a target block.
 * position: 'before' drops above the midpoint, 'after' drops below.
 */
export async function dragBlockToBlock(
  page: Page,
  sourceNodeId: string,
  targetNodeId: string,
  position: 'before' | 'after' = 'after'
) {
  const source = page.locator(`[data-node-id="${sourceNodeId}"]`);
  const target = page.locator(`[data-node-id="${targetNodeId}"]`);

  // Hover source to reveal its drag handle
  await source.hover();
  await page.waitForTimeout(400);

  // The drag handle is the [draggable="true"] element in the source block's group wrapper
  const sourceParentGroup = source.locator('xpath=ancestor::div[contains(@class,"group")]').first();
  const dragHandle = sourceParentGroup.locator('[draggable="true"]').first();

  const targetBox = await target.boundingBox();
  if (!targetBox) throw new Error(`Target block ${targetNodeId} not found`);

  const targetY = position === 'before'
    ? targetBox.y + 5
    : targetBox.y + targetBox.height - 5;

  await dragHandle.dragTo(target, {
    targetPosition: { x: targetBox.width / 2, y: position === 'before' ? 5 : targetBox.height - 5 },
  });

  await page.waitForTimeout(500);
}
