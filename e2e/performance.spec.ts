import { test, expect } from "@playwright/test";
import { openEditor } from "./helpers";

test.describe("Performance benchmarks", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await page.waitForTimeout(2000); // Let initial renders settle
  });

  test("typing latency: 20 characters should complete under 2 seconds", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press("Meta+a");

    const start = Date.now();
    await page.keyboard.type("abcdefghijklmnopqrst", { delay: 30 });
    const elapsed = Date.now() - start;

    await page.waitForTimeout(300);
    const text = await p.textContent();

    console.log(`PERF: 20 chars typed in ${elapsed}ms (expected ~600ms from delays)`);
    console.log(`PERF: Overhead per char: ${((elapsed - 600) / 20).toFixed(1)}ms`);

    expect(text).toContain("abcdefghijklmnopqrst");
    // 20 chars * 30ms delay = 600ms minimum. Allow 1400ms overhead for processing.
    expect(elapsed).toBeLessThan(2000);
  });

  test("Editor re-render count during typing", async ({ page }) => {
    await page.waitForTimeout(1000);

    // Instrument Editor re-renders by watching for React fiber updates
    await page.evaluate(() => {
      // @ts-ignore
      window.__editorRenderCount = 0;
      // @ts-ignore
      window.__blockRenderCounts = {};

      // Watch for DOM mutations in the editor content area as a proxy for re-renders
      const editorContent = document.querySelector('[data-editor-content]');
      if (editorContent) {
        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.type === 'childList' && m.addedNodes.length > 0) {
              // A child was added/removed - likely a re-render
              // @ts-ignore
              window.__editorRenderCount++;
            }
          }
        });
        observer.observe(editorContent, { childList: true, subtree: false });
      }
    });

    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("test123", { delay: 50 });
    await page.waitForTimeout(500);

    const editorRenders = await page.evaluate(() => {
      // @ts-ignore
      return window.__editorRenderCount;
    });

    console.log(`PERF: Editor content DOM mutations during 7 chars: ${editorRenders}`);
    // Content-only typing should NOT cause Editor's child list to change
    expect(editorRenders).toBe(0);
  });

  test("scroll performance with 200+ blocks", async ({ page }) => {
    // Measure scroll smoothness
    const scrollResult = await page.evaluate(async () => {
      const editorContent = document.querySelector('[data-editor-content]');
      if (!editorContent) return { error: "no editor content" };

      const container = editorContent.parentElement;
      if (!container) return { error: "no container" };

      // Count total blocks
      const blockCount = document.querySelectorAll('[contenteditable="true"]').length;

      // Measure scroll performance
      const start = performance.now();
      const scrollTarget = container.scrollHeight;

      // Smooth scroll to bottom
      container.scrollTo({ top: scrollTarget, behavior: 'instant' });

      // Wait for paint
      await new Promise(r => requestAnimationFrame(r));
      const elapsed = performance.now() - start;

      return { blockCount, scrollMs: Math.round(elapsed) };
    });

    console.log(`PERF: ${scrollResult.blockCount} blocks, scroll took ${scrollResult.scrollMs}ms`);
    // Scroll should be fast even with 200+ blocks
    expect(scrollResult.scrollMs).toBeLessThan(100);
  });

  test("block count verification", async ({ page }) => {
    const blockCount = await page.evaluate(() => {
      return document.querySelectorAll('[contenteditable="true"]').length;
    });
    console.log(`PERF: Total contenteditable blocks: ${blockCount}`);
    expect(blockCount).toBeGreaterThan(100);
  });
});
