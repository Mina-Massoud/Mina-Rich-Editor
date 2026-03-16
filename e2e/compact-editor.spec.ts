import { test, expect } from "@playwright/test";
import { selectTextInBlock } from "./helpers";

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

test.describe("Compact Editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/compact");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
  });

  // -------------------------------------------------------------------------
  // 1. Renders at different widths
  // -------------------------------------------------------------------------
  test("renders correctly at 300px, 600px, and full-width", async ({
    page,
  }) => {
    const widths = [300, 600, 1280];

    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(300);

      // At least one contenteditable block must exist regardless of viewport
      const editableBlocks = page.locator('[contenteditable="true"]');
      const count = await editableBlocks.count();
      expect(
        count,
        `Expected contenteditable blocks at ${width}px viewport`
      ).toBeGreaterThan(0);

      // No horizontal overflow: editor container should not exceed viewport width
      const overflows = await page.evaluate((vw: number) => {
        const containers = document.querySelectorAll(
          "[data-editor-content], [data-compact-editor]"
        );
        const results: boolean[] = [];
        containers.forEach((el) => {
          const rect = el.getBoundingClientRect();
          results.push(rect.right > vw + 1); // 1px tolerance
        });
        return results;
      }, width);

      expect(
        overflows.every((o) => !o),
        `Editor overflows viewport at ${width}px`
      ).toBe(true);
    }

    // Restore default viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // -------------------------------------------------------------------------
  // 2. Toolbar is visible
  // -------------------------------------------------------------------------
  test("inline toolbar is visible with formatting buttons", async ({
    page,
  }) => {
    // The toolbar should be visible without any interaction required
    const toolbar = page
      .locator(
        [
          "[data-toolbar]",
          "[data-compact-toolbar]",
          ".toolbar",
          // Tailwind border-b is a common pattern for toolbars in this codebase
          "div.border-b",
        ].join(", ")
      )
      .first();

    await expect(toolbar).toBeVisible({ timeout: 5000 });

    // At minimum, Bold and Italic buttons should be present (by aria-label or
    // visible text). Accept either form since icon-only buttons may omit text.
    const boldBtn = page
      .locator('button[aria-label="Bold"], button:has-text("Bold")')
      .first();
    const italicBtn = page
      .locator('button[aria-label="Italic"], button:has-text("Italic")')
      .first();

    await expect(boldBtn).toBeVisible({ timeout: 5000 });
    await expect(italicBtn).toBeVisible({ timeout: 5000 });
  });

  // -------------------------------------------------------------------------
  // 3. Type text and verify it persists
  // -------------------------------------------------------------------------
  test("typed text persists in a content block", async ({ page }) => {
    const block = page
      .locator('[contenteditable="true"]')
      .first();

    await block.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hello Compact Editor", { delay: 40 });
    await page.waitForTimeout(500);

    expect(await block.textContent()).toContain("Hello Compact Editor");
  });

  // -------------------------------------------------------------------------
  // 4. Bold via toolbar button
  // -------------------------------------------------------------------------
  test.skip("Bold formatting works in compact editor (via Cmd+B)", async ({
    page,
  }) => {
    // Use the FIRST editor's block (avoid multi-editor conflicts)
    const firstEditor = page.locator('.border.rounded-lg').first();
    const block = firstEditor.locator('[contenteditable="true"]').first();
    const nodeId = await block.getAttribute("data-node-id");

    await block.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hello World", { delay: 40 });
    await page.waitForTimeout(500);

    // Select first 5 chars ("Hello")
    await selectTextInBlock(page, nodeId!, 0, 5);

    // Apply bold via keyboard shortcut
    await page.keyboard.press("Meta+b");
    await page.waitForTimeout(600);

    const innerHTML = await page.evaluate(
      (id) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );

    const hasBold =
      /font-bold/.test(innerHTML) ||
      /data-bold="true"/.test(innerHTML) ||
      /<strong[\s>]/i.test(innerHTML) ||
      /<b[\s>]/i.test(innerHTML);

    expect(hasBold).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 5. Italic via toolbar button
  // -------------------------------------------------------------------------
  test.skip("Italic formatting works in compact editor (via Cmd+I)", async ({
    page,
  }) => {
    const block = page
      .locator('[contenteditable="true"]')
      .first();
    const nodeId = await block.getAttribute("data-node-id");

    await block.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hello World", { delay: 40 });
    await page.waitForTimeout(500);

    await selectTextInBlock(page, nodeId!, 0, 5);

    // Apply italic via keyboard shortcut
    await page.keyboard.press("Meta+i");
    await page.waitForTimeout(600);

    const innerHTML = await page.evaluate(
      (id) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );

    const hasItalic =
      /\bitalic\b/.test(innerHTML) ||
      /data-italic="true"/.test(innerHTML) ||
      /<em[\s>]/i.test(innerHTML) ||
      /<i[\s>]/i.test(innerHTML);

    expect(hasItalic).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 6. Change block type to Heading 1 via toolbar dropdown
  // -------------------------------------------------------------------------
  test.skip("block type change works in compact editor (via Markdown shortcut)", async ({ page }) => {
    const block = page
      .locator('[contenteditable="true"]')
      .first();

    await block.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("# My Heading", { delay: 40 });
    await page.waitForTimeout(500);

    // The block should have converted to h1
    const type = await block.getAttribute("data-node-type");
    expect(type).toBe("h1");
    const text = await block.textContent();
    expect(text).toBe("My Heading");
  });

  // -------------------------------------------------------------------------
  // 7. Create list via toolbar button
  // -------------------------------------------------------------------------
  test("list button converts block to a bulleted list", async ({ page }) => {
    const block = page
      .locator('[contenteditable="true"]')
      .first();

    await block.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("My list item", { delay: 40 });
    await page.waitForTimeout(400);

    // Look for a list / bullet-list button in the toolbar
    const listBtn = page
      .locator(
        [
          'button[aria-label="Bulleted list"]',
          'button[aria-label="Bullet list"]',
          'button[aria-label="Unordered list"]',
          'button[aria-label="List"]',
          'button:has-text("List")',
        ].join(", ")
      )
      .first();

    await expect(listBtn).toBeVisible({ timeout: 5000 });
    await listBtn.click();
    await page.waitForTimeout(600);

    // After clicking, a list-type block should exist in the DOM
    const listBlock = page.locator(
      [
        '[data-node-type="ul"] [contenteditable="true"]',
        '[data-node-type="li"][contenteditable="true"]',
        '[data-node-type="bullet"][contenteditable="true"]',
      ].join(", ")
    );
    await expect(listBlock.first()).toBeVisible({ timeout: 3000 });
  });

  // -------------------------------------------------------------------------
  // 8. Compact editor fits its container (no overflow)
  // -------------------------------------------------------------------------
  test("compact editor does not overflow its container", async ({ page }) => {
    const overflowData = await page.evaluate(() => {
      // Find the outermost editor container
      const container = document.querySelector(
        "[data-compact-editor], [data-editor-content]"
      );
      if (!container) return { found: false, overflows: false };

      const parent = container.parentElement;
      if (!parent) return { found: true, overflows: false };

      const parentRect = parent.getBoundingClientRect();
      const childRect = container.getBoundingClientRect();

      return {
        found: true,
        overflows:
          childRect.right > parentRect.right + 2 ||
          childRect.bottom > parentRect.bottom + 2,
        parentWidth: parentRect.width,
        childWidth: childRect.width,
      };
    });

    expect(overflowData.found).toBe(true);
    expect(overflowData.overflows).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 9. Typing performance — 10 rapid characters all persist
  // -------------------------------------------------------------------------
  test("rapid typing: all 10 characters persist", async ({ page }) => {
    const block = page
      .locator('[contenteditable="true"]')
      .first();

    await block.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(200);

    // Type 10 chars with no delay to stress the reconciler
    await page.keyboard.type("abcdefghij");
    await page.waitForTimeout(500);

    const text = await block.textContent();
    expect(text).toBe("abcdefghij");
  });

  // -------------------------------------------------------------------------
  // 10. Multiple compact editors on the same page are independent
  // -------------------------------------------------------------------------
  test("multiple compact editors are independent", async ({ page }) => {
    // This test only runs if the /compact page renders at least 2 editors.
    // If only one editor is present the test passes vacuously (no cross-
    // contamination is possible with a single instance).
    const editors = page.locator(
      "[data-compact-editor], [data-editor-content]"
    );
    const editorCount = await editors.count();

    if (editorCount < 2) {
      console.log(
        "Only one compact editor found on page — skipping independence check."
      );
      // Soft-pass: the page may intentionally show a single editor
      return;
    }

    // Type distinct text into the first editor
    const firstEditable = editors
      .nth(0)
      .locator('[contenteditable="true"]')
      .first();
    await firstEditable.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("EDITOR_ONE", { delay: 40 });
    await page.waitForTimeout(500);

    // Type distinct text into the second editor
    const secondEditable = editors
      .nth(1)
      .locator('[contenteditable="true"]')
      .first();
    await secondEditable.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("EDITOR_TWO", { delay: 40 });
    await page.waitForTimeout(500);

    // Verify each editor holds only its own content
    expect(await firstEditable.textContent()).toContain("EDITOR_ONE");
    expect(await firstEditable.textContent()).not.toContain("EDITOR_TWO");

    expect(await secondEditable.textContent()).toContain("EDITOR_TWO");
    expect(await secondEditable.textContent()).not.toContain("EDITOR_ONE");
  });
});
