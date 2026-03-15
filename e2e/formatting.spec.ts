import { test, expect } from "@playwright/test";

async function openEditor(page: any) {
  await page.goto("http://localhost:3099");
  await page.waitForLoadState("networkidle");
  await page.getByText("Try the Editor").click();
  await page.waitForSelector("[data-editor-content]", { timeout: 10000 });
  await page.waitForTimeout(2000);
}

/**
 * Select the first N chars of the plain text inside a block element and
 * wait long enough for the editor's selectionchange handler to register it.
 */
async function selectTextInBlock(
  page: any,
  nodeId: string,
  start: number,
  end: number
) {
  await page.evaluate(
    ({ id, s, e }: { id: string; s: number; e: number }) => {
      const el = document.querySelector(`[data-node-id="${id}"]`);
      if (!el) return;
      el.focus();
      // Walk into the first text node (works for both plain and inline-children)
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNode = walker.nextNode();
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.setStart(textNode, Math.min(s, (textNode.textContent?.length ?? 0)));
        range.setEnd(textNode, Math.min(e, (textNode.textContent?.length ?? 0)));
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        // Dispatch selectionchange so the editor's listener picks it up
        document.dispatchEvent(new Event("selectionchange"));
      }
    },
    { id: nodeId, s: start, e: end }
  );
  // Give the debounced selectionchange handler time to fire (it uses 150 ms)
  await page.waitForTimeout(400);
}

test.describe("Text formatting", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test("Bold (Cmd+B) wraps selected text in a span with font-bold class and data-bold", async ({
    page,
  }) => {
    const p = page
      .locator('[data-node-type="p"][contenteditable="true"]')
      .first();
    const nodeId = await p.getAttribute("data-node-id");

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hello World", { delay: 40 });
    await page.waitForTimeout(500);

    // Select first 5 chars ("Hello") and register selection with editor
    await selectTextInBlock(page, nodeId!, 0, 5);

    // Apply bold
    await page.keyboard.press("Meta+b");
    await page.waitForTimeout(600);

    const innerHTML = await page.evaluate(
      (id: string) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );
    console.log("Bold innerHTML:", innerHTML);

    // Editor renders bold as <span class="font-bold" data-bold="true">
    const hasBold =
      /font-bold/.test(innerHTML) ||
      /data-bold="true"/.test(innerHTML) ||
      /<strong[\s>]/i.test(innerHTML) ||
      /<b[\s>]/i.test(innerHTML);
    expect(hasBold).toBe(true);
  });

  test("Italic (Cmd+I) wraps selected text with italic class or data-italic", async ({
    page,
  }) => {
    const p = page
      .locator('[data-node-type="p"][contenteditable="true"]')
      .first();
    const nodeId = await p.getAttribute("data-node-id");

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hello World", { delay: 40 });
    await page.waitForTimeout(500);

    await selectTextInBlock(page, nodeId!, 0, 5);
    await page.keyboard.press("Meta+i");
    await page.waitForTimeout(600);

    const innerHTML = await page.evaluate(
      (id: string) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );
    console.log("Italic innerHTML:", innerHTML);

    const hasItalic =
      /\bitalic\b/.test(innerHTML) ||
      /data-italic="true"/.test(innerHTML) ||
      /<em[\s>]/i.test(innerHTML) ||
      /<i[\s>]/i.test(innerHTML);
    expect(hasItalic).toBe(true);
  });

  test("Bold then Italic applies both formats to the selected text", async ({
    page,
  }) => {
    const p = page
      .locator('[data-node-type="p"][contenteditable="true"]')
      .first();
    const nodeId = await p.getAttribute("data-node-id");

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hello World", { delay: 40 });
    await page.waitForTimeout(500);

    // Apply bold
    await selectTextInBlock(page, nodeId!, 0, 5);
    await page.keyboard.press("Meta+b");
    await page.waitForTimeout(600);

    // Re-select and apply italic
    await selectTextInBlock(page, nodeId!, 0, 5);
    await page.keyboard.press("Meta+i");
    await page.waitForTimeout(600);

    const innerHTML = await page.evaluate(
      (id: string) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );
    console.log("Bold+Italic innerHTML:", innerHTML);

    const hasBold =
      /font-bold/.test(innerHTML) ||
      /data-bold="true"/.test(innerHTML) ||
      /<strong[\s>]/i.test(innerHTML);
    const hasItalic =
      /\bitalic\b/.test(innerHTML) ||
      /data-italic="true"/.test(innerHTML) ||
      /<em[\s>]/i.test(innerHTML);

    expect(hasBold).toBe(true);
    expect(hasItalic).toBe(true);
  });

  test("Undo (Cmd+Z) after bold removes bold formatting", async ({ page }) => {
    const p = page
      .locator('[data-node-type="p"][contenteditable="true"]')
      .first();
    const nodeId = await p.getAttribute("data-node-id");

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hello World", { delay: 40 });
    await page.waitForTimeout(500);

    await selectTextInBlock(page, nodeId!, 0, 5);
    await page.keyboard.press("Meta+b");
    await page.waitForTimeout(600);

    // Verify bold was applied
    const innerHTMLBefore = await page.evaluate(
      (id: string) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );
    const hadBold =
      /font-bold/.test(innerHTMLBefore) ||
      /data-bold="true"/.test(innerHTMLBefore);
    expect(hadBold).toBe(true);

    // Click the block to focus, then undo
    await p.click();
    await page.keyboard.press("Meta+z");
    await page.waitForTimeout(600);

    const innerHTMLAfter = await page.evaluate(
      (id: string) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );
    console.log("After undo innerHTML:", innerHTMLAfter);

    const stillHasBold =
      /font-bold/.test(innerHTMLAfter) ||
      /data-bold="true"/.test(innerHTMLAfter);
    expect(stillHasBold).toBe(false);
  });

  test("Toggle bold off: Cmd+B on already-bold text removes bold", async ({
    page,
  }) => {
    const p = page
      .locator('[data-node-type="p"][contenteditable="true"]')
      .first();
    const nodeId = await p.getAttribute("data-node-id");

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hello World", { delay: 40 });
    await page.waitForTimeout(500);

    // Apply bold
    await selectTextInBlock(page, nodeId!, 0, 5);
    await page.keyboard.press("Meta+b");
    await page.waitForTimeout(600);

    // Verify bold applied
    const innerHTMLBold = await page.evaluate(
      (id: string) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );
    const hadBold =
      /font-bold/.test(innerHTMLBold) || /data-bold="true"/.test(innerHTMLBold);
    expect(hadBold).toBe(true);

    // Re-select same text and toggle bold off
    await selectTextInBlock(page, nodeId!, 0, 5);
    await page.keyboard.press("Meta+b");
    await page.waitForTimeout(600);

    const innerHTMLAfter = await page.evaluate(
      (id: string) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );
    console.log("After toggle-off innerHTML:", innerHTMLAfter);

    const stillHasBold =
      /font-bold/.test(innerHTMLAfter) ||
      /data-bold="true"/.test(innerHTMLAfter);
    expect(stillHasBold).toBe(false);
  });
});
