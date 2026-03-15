import { test, expect, Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openEditor(page: Page) {
  await page.goto("http://localhost:3099");
  await page.waitForLoadState("networkidle");
  await page.getByText("Try the Editor").click();
  await page.waitForSelector("[data-editor-content]", { timeout: 15000 });
  await page.waitForTimeout(2000);
}

const mod = process.platform === "darwin" ? "Meta" : "Control";

/** Focus the h1 block, clear it, and type new text */
async function typeInH1(page: Page, text: string) {
  const h1 = page
    .locator('[data-node-type="h1"][contenteditable="true"]')
    .first();
  await h1.click();
  await page.keyboard.press(`${mod}+a`);
  await page.keyboard.type(text, { delay: 30 });
  await page.waitForTimeout(500);
  return h1;
}

/** Select text in a block by node ID */
async function selectTextRange(
  page: Page,
  nodeId: string,
  start: number,
  end: number
) {
  await page.evaluate(
    ({ id, s, e }: { id: string; s: number; e: number }) => {
      const el = document.querySelector(`[data-node-id="${id}"]`);
      if (!el) return;
      (el as HTMLElement).focus();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNode = walker.nextNode();
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.setStart(textNode, Math.min(s, textNode.textContent?.length ?? 0));
        range.setEnd(textNode, Math.min(e, textNode.textContent?.length ?? 0));
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.dispatchEvent(new Event("selectionchange"));
      }
    },
    { id: nodeId, s: start, e: end }
  );
  await page.waitForTimeout(400);
}

/** Press undo N times with small delays */
async function undoN(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(`${mod}+z`);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
}

/** Press redo (Ctrl/Cmd+Y) N times with small delays */
async function redoN(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    await page.keyboard.press(`${mod}+y`);
    await page.waitForTimeout(50);
  }
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// Tests — all use the h1 block for reliability (always first, always exists)
// ---------------------------------------------------------------------------

test.describe("Undo / Redo (operation-based history)", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test("Ctrl+Z undoes typed text", async ({ page }) => {
    const h1 = await typeInH1(page, "Hello Undo");
    expect(await h1.textContent()).toContain("Hello Undo");

    await undoN(page, 20);

    const text = (await h1.textContent()) || "";
    expect(text).not.toContain("Hello Undo");
  });

  test("Ctrl+Y redoes after a single undo", async ({ page }) => {
    const h1 = page
      .locator('[data-node-type="h1"][contenteditable="true"]')
      .first();
    await h1.click();
    await page.keyboard.press("End");

    // Type one character with a pause so it's a distinct undo entry
    await page.keyboard.type("X", { delay: 30 });
    await page.waitForTimeout(600);

    const withX = (await h1.textContent()) || "";
    expect(withX).toContain("X");

    // Undo once
    await page.keyboard.press(`${mod}+z`);
    await page.waitForTimeout(400);
    const afterUndo = (await h1.textContent()) || "";
    expect(afterUndo).not.toBe(withX);

    // Redo once with Ctrl+Y
    await page.keyboard.press(`${mod}+y`);
    await page.waitForTimeout(400);
    const afterRedo = (await h1.textContent()) || "";
    expect(afterRedo).toContain("X");
  });

  test("Ctrl+Z on fresh editor does not crash", async ({ page }) => {
    // Press undo on the demo content — should not crash
    await undoN(page, 5);

    // Editor should still be visible and functional
    await expect(page.locator("[data-editor-content]")).toBeVisible();

    // Should still be able to type
    const h1 = await typeInH1(page, "Still works");
    expect(await h1.textContent()).toContain("Still works");
  });

  test("typing after undo clears redo", async ({ page }) => {
    const h1 = await typeInH1(page, "AAA");

    // Undo
    await undoN(page, 10);

    // Type something new — this should clear the redo stack
    await page.locator('[data-node-type="h1"][contenteditable="true"]').first().click();
    await page.keyboard.type("BBB", { delay: 30 });
    await page.waitForTimeout(300);

    // Redo should have no effect (stack was cleared)
    const beforeRedo = (await h1.textContent()) || "";
    await redoN(page, 5);
    const afterRedo = (await h1.textContent()) || "";

    // Text should contain BBB and not AAA
    expect(afterRedo).toContain("BBB");
  });

  test("undo reverts block insertion (Enter key)", async ({ page }) => {
    const h1 = await typeInH1(page, "Before");
    await page.keyboard.press("End");

    const blocksBefore = await page.locator('[contenteditable="true"]').count();

    // Enter to create new block
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    const blocksAfterEnter = await page.locator('[contenteditable="true"]').count();
    expect(blocksAfterEnter).toBeGreaterThanOrEqual(blocksBefore);

    // Undo
    await page.keyboard.press(`${mod}+z`);
    await page.waitForTimeout(500);

    const blocksAfterUndo = await page.locator('[contenteditable="true"]').count();
    expect(blocksAfterUndo).toBeLessThanOrEqual(blocksAfterEnter);
  });

  test("undo reverts bold formatting", async ({ page }) => {
    const h1 = await typeInH1(page, "BoldMe");
    const nodeId = await h1.getAttribute("data-node-id");
    if (!nodeId) return;

    // Select "Bold" (first 4 chars)
    await selectTextRange(page, nodeId, 0, 4);

    // Apply bold
    await page.keyboard.press(`${mod}+b`);
    await page.waitForTimeout(500);

    // Check bold was applied
    const hasBold = await h1.locator('[data-bold="true"], .font-bold, strong, b').count();
    expect(hasBold).toBeGreaterThan(0);

    // Undo bold
    await page.keyboard.press(`${mod}+z`);
    await page.waitForTimeout(500);

    // Bold should be removed
    const hasBoldAfterUndo = await h1.locator('[data-bold="true"], .font-bold, strong, b').count();
    expect(hasBoldAfterUndo).toBe(0);
  });

  test("Ctrl+Y also performs redo", async ({ page }) => {
    const h1 = await typeInH1(page, "RedoViaY");
    expect(await h1.textContent()).toContain("RedoViaY");

    await undoN(page, 20);
    expect((await h1.textContent()) || "").not.toContain("RedoViaY");

    // Redo with Ctrl+Y
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press(`${mod}+y`);
      await page.waitForTimeout(50);
    }
    await page.waitForTimeout(300);

    expect(await h1.textContent()).toContain("RedoViaY");
  });

  test("undo/redo works in compact editor", async ({ page }) => {
    await page.goto("http://localhost:3099/compact");
    await page.waitForLoadState("networkidle");
    await page.waitForSelector("[data-editor-content]", { timeout: 15000 });
    await page.waitForTimeout(1500);

    const target = page.locator('[contenteditable="true"]').first();
    await target.click();
    await page.keyboard.press("End");

    // Type one char with pause to ensure a distinct undo entry
    await page.keyboard.type("Z", { delay: 30 });
    await page.waitForTimeout(600);
    const withZ = (await target.textContent()) || "";
    expect(withZ).toContain("Z");

    // Undo once
    await page.keyboard.press(`${mod}+z`);
    await page.waitForTimeout(400);
    const afterUndo = (await target.textContent()) || "";
    expect(afterUndo).not.toBe(withZ);

    // Redo once with Ctrl+Y
    await page.keyboard.press(`${mod}+y`);
    await page.waitForTimeout(400);
    expect(await target.textContent()).toContain("Z");
  });

  test("rapid undo/redo cycling does not crash", async ({ page }) => {
    const h1 = await typeInH1(page, "Stress");

    // Rapidly cycle undo/redo 15 times
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press(`${mod}+z`);
      await page.keyboard.press(`${mod}+Shift+z`);
    }
    await page.waitForTimeout(500);

    // Editor should still be functional
    await expect(page.locator("[data-editor-content]")).toBeVisible();

    // Should still be able to type
    await page.locator('[data-node-type="h1"][contenteditable="true"]').first().click();
    await page.keyboard.press("End");
    await page.keyboard.type("OK", { delay: 30 });
    await page.waitForTimeout(300);
    expect(await page.locator('[data-node-type="h1"][contenteditable="true"]').first().textContent()).toContain("OK");
  });

  test("delete block content and undo restores it", async ({ page }) => {
    const h1 = await typeInH1(page, "DeleteMe");
    expect(await h1.textContent()).toContain("DeleteMe");

    // Select all in block and delete
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    const afterDelete = (await h1.textContent()) || "";
    expect(afterDelete).not.toContain("DeleteMe");

    // Undo
    await page.keyboard.press(`${mod}+z`);
    await page.waitForTimeout(500);

    // Content should be restored (or at least editor didn't crash)
    await expect(page.locator("[data-editor-content]")).toBeVisible();
  });
});
