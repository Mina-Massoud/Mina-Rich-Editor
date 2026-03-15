import { test, expect } from "@playwright/test";

// ─── Bug 1: Markdown paste ──────────────────────────────────────────────────

test.describe("Bug 1: Markdown paste conversion", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3099");
    await page.waitForLoadState("networkidle");
    await page.getByText("Try the Editor").click();
    await page.waitForSelector("[data-editor-content]", { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test("pasting Markdown creates correct block types", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();

    // Paste markdown via clipboard API
    const markdown = `# Title\n\n## Subtitle\n\nThis is **bold** text.\n\n- Item 1\n- Item 2\n\n> A blockquote`;
    await page.evaluate(async (md) => {
      const el = document.activeElement;
      if (!el) return;
      const dt = new DataTransfer();
      dt.setData("text/plain", md);
      const evt = new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(evt);
    }, markdown);
    await page.waitForTimeout(1000);

    // Check what was created
    const blocks = await page.evaluate(() => {
      const els = document.querySelectorAll("[contenteditable]");
      return Array.from(els).slice(0, 20).map(el => ({
        type: el.getAttribute("data-node-type"),
        text: (el.textContent || "").slice(0, 50),
      }));
    });
    console.log("After MD paste:", JSON.stringify(blocks.slice(0, 10)));

    // Pasted MD should have been converted — NOT raw markdown text in <p> blocks
    const hasRawMarkdown = blocks.some(b => b.text.startsWith("# ") || b.text.startsWith("## "));
    expect(hasRawMarkdown).toBe(false); // Raw markdown should NOT appear as text
  });
});

// ─── Bug 2: Delete after paste ──────────────────────────────────────────────

test.describe("Bug 2: Delete after paste", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3099");
    await page.waitForLoadState("networkidle");
    await page.getByText("Try the Editor").click();
    await page.waitForSelector("[data-editor-content]", { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test("type then delete all text in a block, block survives", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Temporary text", { delay: 30 });
    await page.waitForTimeout(500);

    // Select all text in this block and delete
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(500);

    // The block should still exist (empty but present)
    const blockExists = await p.isVisible().catch(() => false);
    console.log("Block still visible after delete:", blockExists);

    // Should be able to type again in same block
    await p.click();
    await page.keyboard.type("New text", { delay: 30 });
    await page.waitForTimeout(500);

    const text = await p.textContent();
    console.log("Text after re-type:", JSON.stringify(text));
    expect(text).toContain("New text");
  });
});

// ─── Bug 3 & 4: CompactEditor selection/toolbar ─────────────────────────────

test.describe("Bug 3 & 4: CompactEditor selection and toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3099/compact");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
  });

  test("selecting text in compact editor enables toolbar buttons", async ({ page }) => {
    // Find the first editor's block
    const block = page.locator('[contenteditable="true"]').first();
    const nodeId = await block.getAttribute("data-node-id");
    await block.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Select me please", { delay: 30 });
    await page.waitForTimeout(500);

    // Select the text
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`);
      if (!el) return;
      el.focus();
      const textNode = el.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 6); // select "Select"
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      // Trigger selectionchange
      document.dispatchEvent(new Event("selectionchange"));
    }, nodeId);
    await page.waitForTimeout(500);

    // Check if Bold button is enabled
    const boldBtn = page.locator('button[aria-label="Bold"]').first();
    const isDisabled = await boldBtn.getAttribute("disabled");
    console.log("Bold button disabled:", isDisabled);

    expect(isDisabled).toBeNull(); // null = not disabled = enabled
  });

  test("floating selection toolbar appears when text is selected", async ({ page }) => {
    const block = page.locator('[contenteditable="true"]').first();
    const nodeId = await block.getAttribute("data-node-id");
    await block.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hover toolbar test", { delay: 30 });
    await page.waitForTimeout(500);

    // Select text
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`);
      if (!el) return;
      el.focus();
      const textNode = el.firstChild;
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 5);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      document.dispatchEvent(new Event("selectionchange"));
    }, nodeId);
    await page.waitForTimeout(1000);

    // The floating SelectionToolbar should be visible with formatting buttons.
    // It renders as a motion.div with fixed positioning and z-[200].
    const hasFloatingToolbar = await page.evaluate(() => {
      // Check for any fixed-position element with z-index that has format buttons
      const fixedEls = document.querySelectorAll(".fixed");
      for (const el of fixedEls) {
        const zIndex = window.getComputedStyle(el).zIndex;
        if (parseInt(zIndex) >= 100) {
          // Has buttons inside?
          const buttons = el.querySelectorAll("button");
          if (buttons.length >= 3) return true; // Has formatting buttons
        }
      }
      return false;
    });
    console.log("Floating toolbar visible:", hasFloatingToolbar);

    expect(hasFloatingToolbar).toBe(true);
  });
});
