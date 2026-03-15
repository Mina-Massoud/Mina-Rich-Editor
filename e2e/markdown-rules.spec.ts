import { test, expect } from "@playwright/test";

async function openEditor(page: any) {
  await page.goto("http://localhost:3099");
  await page.waitForLoadState("networkidle");
  await page.getByText("Try the Editor").click();
  await page.waitForSelector("[data-editor-content]", { timeout: 10000 });
  await page.waitForTimeout(2000);
}

/**
 * Returns the first paragraph block, clears its content, and returns the
 * block's Playwright locator. The locator is re-queried after clearing so
 * it still points to the same DOM node (identified by data-node-id).
 */
async function getFreshParagraph(page: any) {
  const p = page
    .locator('[data-node-type="p"][contenteditable="true"]')
    .first();
  const nodeId = await p.getAttribute("data-node-id");

  // Click and clear existing content
  await p.click();
  await page.keyboard.press("Meta+a");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);

  return { nodeId: nodeId as string };
}

test.describe("Markdown input rules", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Block-level rules
  // ─────────────────────────────────────────────────────────────────────────
  test.describe("Block-level rules", () => {
    test("Heading 1: '# Hello' converts paragraph to h1", async ({ page }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("# Hello", { delay: 40 });
      await page.waitForTimeout(500);

      // The node should now carry data-node-type="h1"
      const type = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.getAttribute(
            "data-node-type"
          ) ?? null,
        nodeId
      );
      console.log("H1 node type:", type);
      expect(type).toBe("h1");

      // Content should be "Hello" (prefix stripped)
      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ??
          "",
        nodeId
      );
      expect(text).toBe("Hello");
    });

    test("Heading 2: '## World' converts paragraph to h2", async ({ page }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("## World", { delay: 40 });
      await page.waitForTimeout(500);

      const type = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.getAttribute(
            "data-node-type"
          ) ?? null,
        nodeId
      );
      console.log("H2 node type:", type);
      expect(type).toBe("h2");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ??
          "",
        nodeId
      );
      expect(text).toBe("World");
    });

    test("Heading 3: '### Sub' converts paragraph to h3", async ({ page }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("### Sub", { delay: 40 });
      await page.waitForTimeout(500);

      const type = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.getAttribute(
            "data-node-type"
          ) ?? null,
        nodeId
      );
      console.log("H3 node type:", type);
      expect(type).toBe("h3");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ??
          "",
        nodeId
      );
      expect(text).toBe("Sub");
    });

    test("Blockquote: '> Quote text' converts paragraph to blockquote", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("> Quote text", { delay: 40 });
      await page.waitForTimeout(500);

      const type = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.getAttribute(
            "data-node-type"
          ) ?? null,
        nodeId
      );
      console.log("Blockquote node type:", type);
      expect(type).toBe("blockquote");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ??
          "",
        nodeId
      );
      expect(text).toBe("Quote text");
    });

    test("Horizontal rule: '---' converts paragraph to hr", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      // "---" must be the entire content — no trailing text
      await page.keyboard.type("---", { delay: 40 });
      await page.waitForTimeout(500);

      // hr blocks are not contenteditable; query by data-node-id regardless
      const type = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.getAttribute(
            "data-node-type"
          ) ?? null,
        nodeId
      );
      console.log("HR node type:", type);
      expect(type).toBe("hr");
    });

    test("Code block: '```' converts paragraph to code/pre", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      // Backtick characters — type them individually to avoid clipboard paste
      await page.keyboard.type("```", { delay: 40 });
      await page.waitForTimeout(500);

      const type = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.getAttribute(
            "data-node-type"
          ) ?? null,
        nodeId
      );
      console.log("Code block node type:", type);
      expect(type).toBe("code");
    });

    test("Ordered list: '1. First item' converts paragraph to ol", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("1. First item", { delay: 40 });
      await page.waitForTimeout(500);

      const type = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.getAttribute(
            "data-node-type"
          ) ?? null,
        nodeId
      );
      console.log("OL node type:", type);
      expect(type).toBe("ol");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ??
          "",
        nodeId
      );
      expect(text).toBe("First item");
    });

    test("Unordered list: '- Bullet point' converts paragraph to li", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("- Bullet point", { delay: 40 });
      await page.waitForTimeout(500);

      const type = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.getAttribute(
            "data-node-type"
          ) ?? null,
        nodeId
      );
      console.log("LI node type:", type);
      expect(type).toBe("li");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ??
          "",
        nodeId
      );
      expect(text).toBe("Bullet point");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Inline formatting rules
  // These tests assert EXPECTED behavior. They may fail if the inline
  // Markdown auto-formatting feature is not yet implemented.
  // ─────────────────────────────────────────────────────────────────────────
  test.describe("Inline formatting rules", () => {
    test("Bold: '**hello**' formats 'hello' as bold", async ({ page }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("**hello**", { delay: 40 });
      await page.waitForTimeout(500);

      const innerHTML = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
        nodeId
      );
      console.log("Bold inline innerHTML:", innerHTML);

      // Accept any of the known bold representations the editor may use
      const hasBold =
        /data-bold="true"/.test(innerHTML) ||
        /font-bold/.test(innerHTML) ||
        /<strong[\s>]/i.test(innerHTML) ||
        /<b[\s>]/i.test(innerHTML);

      expect(hasBold).toBe(true);

      // The visible text should contain "hello" without the asterisks
      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? "",
        nodeId
      );
      expect(text).toContain("hello");
      expect(text).not.toContain("**");
    });

    test("Italic: '*world*' formats 'world' as italic", async ({ page }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("*world*", { delay: 40 });
      await page.waitForTimeout(500);

      const innerHTML = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
        nodeId
      );
      console.log("Italic inline innerHTML:", innerHTML);

      const hasItalic =
        /data-italic="true"/.test(innerHTML) ||
        /\bitalic\b/.test(innerHTML) ||
        /<em[\s>]/i.test(innerHTML) ||
        /<i[\s>]/i.test(innerHTML);

      expect(hasItalic).toBe(true);

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? "",
        nodeId
      );
      expect(text).toContain("world");
      expect(text).not.toContain("*");
    });

    test("Inline code: '`code`' formats 'code' as inline code", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("`code`", { delay: 40 });
      await page.waitForTimeout(500);

      const innerHTML = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
        nodeId
      );
      console.log("Inline code innerHTML:", innerHTML);

      const hasCode =
        /data-code="true"/.test(innerHTML) ||
        /font-mono/.test(innerHTML) ||
        /<code[\s>]/i.test(innerHTML);

      expect(hasCode).toBe(true);

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? "",
        nodeId
      );
      expect(text).toContain("code");
      expect(text).not.toContain("`");
    });

    test("Strikethrough: '~~deleted~~' formats 'deleted' as strikethrough", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("~~deleted~~", { delay: 40 });
      await page.waitForTimeout(500);

      const innerHTML = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
        nodeId
      );
      console.log("Strikethrough innerHTML:", innerHTML);

      const hasStrikethrough =
        /data-strikethrough="true"/.test(innerHTML) ||
        /line-through/.test(innerHTML) ||
        /<del[\s>]/i.test(innerHTML) ||
        /<s[\s>]/i.test(innerHTML);

      expect(hasStrikethrough).toBe(true);

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? "",
        nodeId
      );
      expect(text).toContain("deleted");
      expect(text).not.toContain("~~");
    });
  });
});
