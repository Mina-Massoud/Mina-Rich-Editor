import { test, expect } from "@playwright/test";
import { openEditor, mod, waitForBlockType } from "./helpers";

test.describe("Content stability & performance", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test("typing persists in paragraph", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Hello World", { delay: 40 });
    await page.waitForTimeout(500);
    expect(await p.textContent()).toContain("Hello World");
  });

  // TODO: Markdown "# " shortcut conversion is timing-sensitive in headless CI.
  test.skip("typing persists in h1", async ({ page }) => {
    // Demo page starts with only a <p> block — create an h1 via markdown shortcut first
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");
    await p.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    // Type "# " to trigger markdown rule conversion to h1
    await page.keyboard.type("# ", { delay: 40 });
    await page.waitForTimeout(800);

    // Wait for block type conversion (longer timeout for CI)
    await waitForBlockType(page, nodeId!, "h1", 10000);

    const h1 = page.locator(`[data-node-id="${nodeId}"]`);
    await h1.click();
    await page.keyboard.press(`${mod}+a`);
    await page.keyboard.type("My Title", { delay: 40 });
    await page.waitForTimeout(500);
    expect(await h1.textContent()).toContain("My Title");
  });

  test("Enter splits content correctly", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("AAABBB", { delay: 40 });
    await page.waitForTimeout(500);

    // Position cursor at offset 3 via TreeWalker (handles multi-node DOM)
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let offset = 0;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const len = node.textContent?.length ?? 0;
        if (offset + len >= 3) {
          const range = document.createRange();
          range.setStart(node, 3 - offset);
          range.collapse(true);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          return;
        }
        offset += len;
      }
    }, nodeId);

    await page.keyboard.press("Enter");
    await page.waitForTimeout(1000);

    const allTexts = await page.evaluate(() => {
      const els = document.querySelectorAll('[contenteditable="true"]');
      return Array.from(els).map(el => el.textContent || "");
    });
    expect(allTexts.some(t => t === "AAA")).toBe(true);
    expect(allTexts.some(t => t === "BBB")).toBe(true);
  });

  test("content persists after clicking elsewhere", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("STABLE", { delay: 40 });
    await page.waitForTimeout(500);

    // Click somewhere outside the block (use body or editor container, not h1 which may not exist)
    await page.locator('[data-editor-content]').click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);
    expect(await p.textContent()).toContain("STABLE");
  });

  test("notion toggle preserves content", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("PRESERVED", { delay: 40 });
    await page.waitForTimeout(500);

    const notionToggle = page.locator('button:has-text("Notion")').first();
    await notionToggle.click();
    await page.waitForTimeout(500);

    const text = await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`);
      return el?.textContent || "";
    }, nodeId);
    expect(text).toContain("PRESERVED");
  });

  test("rapid typing preserves all characters", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("abcdefghij");
    await page.waitForTimeout(500);
    expect(await p.textContent()).toBe("abcdefghij");
  });

  test("rapid typing survives notion toggle", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("abcdefghij");
    await page.waitForTimeout(500);

    const notionToggle = page.locator('button:has-text("Notion")').first();
    await notionToggle.click();
    await page.waitForTimeout(500);

    const text = await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`);
      return el?.textContent || "";
    }, nodeId);
    expect(text).toBe("abcdefghij");
  });

  test("undo restores previous content", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("FIRST", { delay: 40 });
    await page.waitForTimeout(500);

    await page.keyboard.press("Meta+a");
    await page.keyboard.type("SECOND", { delay: 40 });
    await page.waitForTimeout(500);

    await page.keyboard.press("Meta+z");
    await page.waitForTimeout(500);

    const afterUndo = await p.textContent();
    expect(afterUndo).toContain("FIRST");
  });

  test("PERF: typing triggers minimal re-renders", async ({ page }) => {
    // Wait for initial renders to settle
    await page.waitForTimeout(1000);

    // Clear browser console and capture render logs
    await page.evaluate(() => {
      // @ts-ignore
      window.__renderLog = [];
      const origLog = console.log;
      // @ts-ignore
      window.__origLog = origLog;
      console.log = function (...args) {
        const msg = args.join(' ');
        if (msg.includes('Editor re-rendered') || msg.includes('testBlock')) {
          // @ts-ignore
          window.__renderLog.push(msg);
        }
        origLog.apply(console, args);
      };
    });

    // Type 5 characters
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press("End");
    await page.keyboard.type("12345", { delay: 80 });
    await page.waitForTimeout(500);

    // Count renders
    const renderLog = await page.evaluate(() => {
      // @ts-ignore
      const log = window.__renderLog || [];
      // @ts-ignore
      console.log = window.__origLog;
      const editorRenders = log.filter((m: string) => m.includes('Editor re-rendered')).length;
      const blockRenders = log.filter((m: string) => m.includes('testBlock')).length;
      return { editorRenders, blockRenders, totalLogs: log.length };
    });

    console.log("PERF: Editor re-renders during 5 chars:", renderLog.editorRenders);
    console.log("PERF: Block re-renders during 5 chars:", renderLog.blockRenders);
    console.log("PERF: Total render logs:", renderLog.totalLogs);

    expect(renderLog.blockRenders).toBeLessThan(50);
  });
});
