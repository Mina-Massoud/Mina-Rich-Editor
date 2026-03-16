import { test, expect } from "@playwright/test";
import { openEditor, selectTextInBlock } from "./helpers";

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

    // Wait for bold to appear in DOM
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
        return /font-bold/.test(html) || /data-bold="true"/.test(html) || /<strong[\s>]/i.test(html) || /<b[\s>]/i.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    const innerHTML = await page.evaluate(
      (id) =>
        document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "",
      nodeId
    );
    console.log("Bold innerHTML:", innerHTML);

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

    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
        return /\bitalic\b/.test(html) || /data-italic="true"/.test(html) || /<em[\s>]/i.test(html) || /<i[\s>]/i.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    const innerHTML = await page.evaluate(
      (id) =>
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
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
        return /font-bold/.test(html) || /data-bold="true"/.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    // Re-select and apply italic (multi-node walker handles bold spans)
    await selectTextInBlock(page, nodeId!, 0, 5);
    await page.keyboard.press("Meta+i");
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
        return (/font-bold/.test(html) || /data-bold="true"/.test(html)) &&
               (/\bitalic\b/.test(html) || /data-italic="true"/.test(html));
      },
      nodeId,
      { timeout: 5000 }
    );

    const innerHTML = await page.evaluate(
      (id) =>
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

    // Wait for bold to apply
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
        return /font-bold/.test(html) || /data-bold="true"/.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    // Click the block to focus, then undo
    await p.click();
    await page.keyboard.press("Meta+z");
    await page.waitForTimeout(800);

    const innerHTMLAfter = await page.evaluate(
      (id) =>
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

    // Wait for bold to apply
    await page.waitForFunction(
      (id) => {
        const html = document.querySelector(`[data-node-id="${id}"]`)?.innerHTML ?? "";
        return /font-bold/.test(html) || /data-bold="true"/.test(html);
      },
      nodeId,
      { timeout: 5000 }
    );

    // Re-select same text and toggle bold off (multi-node walker handles bold spans)
    await selectTextInBlock(page, nodeId!, 0, 5);
    await page.keyboard.press("Meta+b");
    await page.waitForTimeout(800);

    const innerHTMLAfter = await page.evaluate(
      (id) =>
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
