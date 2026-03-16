import { test, expect } from "@playwright/test";
import { openEditor } from "./helpers";

test.describe("Clipboard operations", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test("copy-paste within same block inserts text inline, not a new block", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("HelloWorld", { delay: 40 });
    await page.waitForTimeout(500);

    // Select "Hello" (first 5 chars)
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNode = walker.nextNode();
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 5);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, nodeId);
    await page.waitForTimeout(200);

    // Copy
    await page.keyboard.press("Meta+c");
    await page.waitForTimeout(300);

    // Move cursor to end
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }, nodeId);
    await page.waitForTimeout(200);

    // Paste
    await page.keyboard.press("Meta+v");
    await page.waitForTimeout(800);

    // Check: text should be "HelloWorldHello" in the SAME block
    const text = await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`);
      return el?.textContent || "";
    }, nodeId);
    console.log("After paste in same block:", JSON.stringify(text));

    expect(text).toContain("Hello");
    expect(text).toContain("World");
    // The pasted "Hello" should be in the same block, not a new one
    expect(text.length).toBeGreaterThan("HelloWorld".length);
  });

  test("copy-paste plain text stays in same block", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("ABCDEF", { delay: 40 });
    await page.waitForTimeout(500);

    // Select "ABC"
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNode = walker.nextNode();
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 3);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, nodeId);

    // Copy
    await page.keyboard.press("Meta+c");
    await page.waitForTimeout(300);

    // Move cursor to end via JS
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }, nodeId);
    await page.waitForTimeout(200);

    // Paste
    await page.keyboard.press("Meta+v");
    await page.waitForTimeout(800);

    const text = await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`);
      return el?.textContent || "";
    }, nodeId);
    console.log("After copy-paste plain text:", JSON.stringify(text));

    // Should be "ABCDEFABC" in the same block
    expect(text).toBe("ABCDEFABC");
  });

  test("cut-paste moves text within same block", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("XYZABC", { delay: 40 });
    await page.waitForTimeout(500);

    // Select "XYZ"
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNode = walker.nextNode();
      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 3);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, nodeId);

    // Cut
    await page.keyboard.press("Meta+x");
    await page.waitForTimeout(500);

    // Move cursor to end via JS
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null;
      if (!el) return;
      el.focus();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }, nodeId);
    await page.waitForTimeout(200);

    // Paste
    await page.keyboard.press("Meta+v");
    await page.waitForTimeout(800);

    const text = await page.evaluate((id) => {
      const el = document.querySelector(`[data-node-id="${id}"]`);
      return el?.textContent || "";
    }, nodeId);
    console.log("After cut-paste:", JSON.stringify(text));

    // Should be "ABCXYZ"
    expect(text).toBe("ABCXYZ");
  });

  test("paste multiline text creates multiple blocks", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("BEFORE", { delay: 40 });
    await page.waitForTimeout(500);

    const blockCountBefore = await page.evaluate(() => {
      return document.querySelectorAll('[contenteditable="true"]').length;
    });

    // Paste multiline text via clipboard API
    await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return;
      // Place cursor at end
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });

    // Use clipboard API to paste multiline text
    await page.evaluate(async () => {
      const text = "Line1\nLine2\nLine3";
      const clipboardData = new DataTransfer();
      clipboardData.setData("text/plain", text);
      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData: clipboardData,
        bubbles: true,
        cancelable: true,
      });
      document.activeElement?.dispatchEvent(pasteEvent);
    });
    await page.waitForTimeout(1500);

    const blockCountAfter = await page.evaluate(() => {
      return document.querySelectorAll('[contenteditable="true"]').length;
    });
    console.log("Blocks before multiline paste:", blockCountBefore, "after:", blockCountAfter);

    // Multiline paste SHOULD create new blocks
    expect(blockCountAfter).toBeGreaterThan(blockCountBefore);
  });
});
