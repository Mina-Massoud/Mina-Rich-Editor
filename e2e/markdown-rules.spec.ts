import { test, expect } from "@playwright/test";
import { openEditor, mod, waitForBlockType } from "./helpers";

/**
 * Returns the first paragraph block, clears its content, and returns the
 * block's nodeId.
 */
async function getFreshParagraph(page: any) {
  const p = page
    .locator('[data-node-type="p"][contenteditable="true"]')
    .first();
  const nodeId = await p.getAttribute("data-node-id");

  await p.click();
  await page.keyboard.press(`${mod}+a`);
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
      await waitForBlockType(page, nodeId, "h1");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ?? "",
        nodeId
      );
      expect(text).toBe("Hello");
    });

    test("Heading 2: '## World' converts paragraph to h2", async ({ page }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("## World", { delay: 40 });
      await waitForBlockType(page, nodeId, "h2");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ?? "",
        nodeId
      );
      expect(text).toBe("World");
    });

    test("Heading 3: '### Sub' converts paragraph to h3", async ({ page }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("### Sub", { delay: 40 });
      await waitForBlockType(page, nodeId, "h3");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ?? "",
        nodeId
      );
      expect(text).toBe("Sub");
    });

    test("Blockquote: '> Quote text' converts paragraph to blockquote", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("> Quote text", { delay: 40 });
      await waitForBlockType(page, nodeId, "blockquote");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ?? "",
        nodeId
      );
      expect(text).toBe("Quote text");
    });

    test("Horizontal rule: '---' converts paragraph to hr", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("---", { delay: 40 });
      await waitForBlockType(page, nodeId, "hr");
    });

    test("Code block: '```' converts paragraph to code/pre", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("```", { delay: 40 });
      await waitForBlockType(page, nodeId, "code");
    });

    test("Ordered list: '1. First item' converts paragraph to ol", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("1. First item", { delay: 40 });
      await waitForBlockType(page, nodeId, "ol");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ?? "",
        nodeId
      );
      expect(text).toBe("First item");
    });

    test("Unordered list: '- Bullet point' converts paragraph to li", async ({
      page,
    }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("- Bullet point", { delay: 40 });
      await waitForBlockType(page, nodeId, "li");

      const text = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.textContent?.trim() ?? "",
        nodeId
      );
      expect(text).toBe("Bullet point");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Inline formatting rules
  // ─────────────────────────────────────────────────────────────────────────
  test.describe("Inline formatting rules", () => {
    test("Bold: '**hello**' formats 'hello' as bold", async ({ page }) => {
      const { nodeId } = await getFreshParagraph(page);

      await page.keyboard.type("**hello**", { delay: 40 });
      await page.waitForFunction(
        (id: string) => {
          const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
          return /data-bold="true"/.test(html) || /font-bold/.test(html) || /<strong[\s>]/i.test(html) || /<b[\s>]/i.test(html);
        },
        nodeId,
        { timeout: 5000 }
      );

      const innerHTML = await page.evaluate(
        (id: string) =>
          document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
        nodeId
      );
      console.log("Bold inline innerHTML:", innerHTML);

      const hasBold =
        /data-bold="true"/.test(innerHTML) ||
        /font-bold/.test(innerHTML) ||
        /<strong[\s>]/i.test(innerHTML) ||
        /<b[\s>]/i.test(innerHTML);
      expect(hasBold).toBe(true);

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
      await page.waitForFunction(
        (id: string) => {
          const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
          return /data-italic="true"/.test(html) || /\bitalic\b/.test(html) || /<em[\s>]/i.test(html) || /<i[\s>]/i.test(html);
        },
        nodeId,
        { timeout: 5000 }
      );

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
      await page.waitForFunction(
        (id: string) => {
          const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
          return /data-code="true"/.test(html) || /font-mono/.test(html) || /<code[\s>]/i.test(html);
        },
        nodeId,
        { timeout: 5000 }
      );

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
      await page.waitForFunction(
        (id: string) => {
          const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
          return /data-strikethrough="true"/.test(html) || /line-through/.test(html) || /<del[\s>]/i.test(html) || /<s[\s>]/i.test(html);
        },
        nodeId,
        { timeout: 5000 }
      );

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
