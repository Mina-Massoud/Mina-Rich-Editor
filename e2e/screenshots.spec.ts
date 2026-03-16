import { test, Page } from "@playwright/test";
import { openEditor } from "./helpers";
import path from "path";

// ---------------------------------------------------------------------------
// All tests are skipped by default — run manually for documentation shots:
//   npx playwright test e2e/screenshots.spec.ts --headed
//
// To run without modifying this file, use:
//   npx playwright test e2e/screenshots.spec.ts --grep "screenshot" --retries=0
// ---------------------------------------------------------------------------

const SCREENSHOTS_DIR = path.resolve("public/screenshots");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Type text character-by-character into the focused element. */
async function typeSlowly(page: Page, text: string, delay = 40) {
  await page.keyboard.type(text, { delay });
}

/**
 * Select text inside a contenteditable element via DOM range manipulation.
 * `start` / `end` are character offsets within the element's full text content.
 */
async function selectTextRange(
  page: Page,
  selector: string,
  start: number,
  end: number
) {
  await page.evaluate(
    ({ sel, s, e }: { sel: string; s: number; e: number }) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return;
      el.focus();

      // Collect all text nodes
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) textNodes.push(node as Text);

      const findPos = (offset: number): { node: Text; off: number } => {
        let remaining = offset;
        for (const tn of textNodes) {
          const len = tn.textContent?.length ?? 0;
          if (remaining <= len) return { node: tn, off: remaining };
          remaining -= len;
        }
        const last = textNodes[textNodes.length - 1];
        return { node: last, off: last?.textContent?.length ?? 0 };
      };

      const range = document.createRange();
      const startPos = findPos(s);
      const endPos = findPos(e);
      range.setStart(startPos.node, startPos.off);
      range.setEnd(endPos.node, endPos.off);

      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    },
    { sel: selector, s: start, e: end }
  );
  await page.waitForTimeout(400);
}

/** Wait until at least one `[data-node-id]` block is visible. */
async function waitForEditor(page: Page) {
  await page.waitForSelector("[data-node-id]", { timeout: 15_000 });
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// 1. CompactEditor — clean view (300 px editor)
// ---------------------------------------------------------------------------
test.skip("screenshot: compact-editor clean view", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto("/compact");
  await waitForEditor(page);

  // The CompactEditor root has the class "mina-editor"
  const firstEditor = page.locator(".mina-editor").first();
  const box = await firstEditor.boundingBox();

  if (box) {
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/compact-editor.png`,
      clip: {
        x: Math.max(0, box.x - 16),
        y: Math.max(0, box.y - 16),
        width: box.width + 32,
        height: box.height + 32,
      },
    });
  } else {
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/compact-editor.png` });
  }
});

// ---------------------------------------------------------------------------
// 2. CompactEditor — toolbar active after text selection
// ---------------------------------------------------------------------------
test.skip("screenshot: compact-toolbar-active", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto("/compact");
  await waitForEditor(page);

  // Click the first contenteditable block in the first editor
  const firstBlock = page
    .locator("[data-node-id][contenteditable='true']")
    .first();
  await firstBlock.click();
  await typeSlowly(page, "Hello World, this is Mina Editor");

  // Select "Mina Editor" (last 11 chars: offset 21–32)
  const nodeId = await firstBlock.getAttribute("data-node-id");
  if (nodeId) {
    await selectTextRange(
      page,
      `[data-node-id="${nodeId}"]`,
      21, // "Hello World, this is " = 21 chars
      32  // + "Mina Editor" = 11 chars
    );
  }

  // Wait for the floating / inline toolbar to appear
  await page
    .waitForSelector(
      "[data-toolbar], .toolbar, [role='toolbar'], .formatting-toolbar, .inline-toolbar",
      { timeout: 5_000 }
    )
    .catch(() => page.waitForTimeout(600));

  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/compact-toolbar-active.png`,
  });
});

// ---------------------------------------------------------------------------
// 3. Full Editor — Notion-style top portion
// ---------------------------------------------------------------------------
test.skip("screenshot: full-editor notion style", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openEditor(page);
  // Extra settle time so motion animations finish and content is painted
  await page.waitForTimeout(500);

  // Screenshot the top 700 px of the visible editor area
  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/full-editor.png`,
    clip: { x: 0, y: 0, width: 1280, height: 700 },
  });
});

// ---------------------------------------------------------------------------
// 4. Markdown shortcuts in action
// ---------------------------------------------------------------------------
test.skip("screenshot: markdown-shortcuts", async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.goto("/compact");
  await waitForEditor(page);

  // Target the first block of the SECOND .mina-editor (the 500 px medium editor).
  // The page renders three .mina-editor instances:  0=small(300px), 1=medium(500px), 2=read-only.
  const mediumEditor = page.locator(".mina-editor").nth(1);
  const targetBlock = mediumEditor
    .locator("[data-node-id][contenteditable='true']")
    .first();
  await targetBlock.click();

  // --- Line 1: heading shortcut ---
  await typeSlowly(page, "# My Heading", 50);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);

  // --- Line 2: bold shortcut ---
  // Type the full **pattern** — the onInput handler fires on each keystroke.
  // The closing "** " triggers the bold conversion.
  await typeSlowly(page, "**bold text**", 50);
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);

  // --- Line 3: italic shortcut (new block so no existing spans) ---
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  await typeSlowly(page, "*italic text*", 50);
  await page.keyboard.press("Space");
  await page.waitForTimeout(500);

  // --- Line 4: inline code shortcut ---
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  await typeSlowly(page, "`inline code`", 50);
  await page.keyboard.press("Space");
  await page.waitForTimeout(600);

  // Hide the Next.js dev overlay ("N 1 Issue") before screenshotting
  await page.addStyleTag({ content: "nextjs-portal, #__next_error__, [data-nextjs-dialog-overlay] { display: none !important; }" });
  await page.waitForTimeout(200);

  // Scroll the medium editor's content pane to top so the h1 is visible
  await mediumEditor.evaluate((el) => {
    const scroller = el.querySelector('[class*="overflow-auto"], [class*="overflow-y"]') as HTMLElement | null;
    if (scroller) scroller.scrollTop = 0;
  });
  await page.waitForTimeout(200);

  // Clip to the medium editor bounding box with a small margin
  const editorBox = await mediumEditor.boundingBox();
  if (editorBox) {
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/markdown-shortcuts.png`,
      clip: {
        x: Math.max(0, editorBox.x - 16),
        y: Math.max(0, editorBox.y - 16),
        width: editorBox.width + 32,
        height: Math.min(editorBox.height + 32, 600),
      },
    });
  } else {
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/markdown-shortcuts.png` });
  }
});

// ---------------------------------------------------------------------------
// 5. Multiple editors at different widths — full page
// ---------------------------------------------------------------------------
test.skip("screenshot: multiple-editors", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/compact");
  await waitForEditor(page);

  await page.screenshot({
    path: `${SCREENSHOTS_DIR}/multiple-editors.png`,
    fullPage: true,
  });
});
