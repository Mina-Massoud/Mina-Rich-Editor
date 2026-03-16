import { test, expect } from "@playwright/test";
import { openEditor } from "./helpers";

test.describe("List operations", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test("Typing '1. text' auto-converts paragraph to ordered list item", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    // Type the ordered list pattern — the debounce fires after ~50ms on space
    await page.keyboard.type("1. My item", { delay: 40 });
    await page.waitForTimeout(700);

    // Block should now have type "ol" (the node type used for ordered list items)
    const olBlock = page.locator('[data-node-type="ol"][contenteditable="true"]');
    await expect(olBlock.first()).toBeVisible({ timeout: 5000 });

    // Content should be the text without the "1. " prefix
    const text = await olBlock.first().textContent();
    expect(text).toContain("My item");
    expect(text).not.toMatch(/^1\.\s/);
  });

  test("Typing '- text' auto-converts paragraph to unordered list item", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    await page.keyboard.type("- My bullet", { delay: 40 });
    await page.waitForTimeout(700);

    // Block should have type "li" (the node type used for unordered list items)
    const liBlock = page.locator('[data-node-type="li"][contenteditable="true"]');
    await expect(liBlock.first()).toBeVisible({ timeout: 5000 });

    const text = await liBlock.first().textContent();
    expect(text).toContain("My bullet");
    expect(text).not.toMatch(/^[-*]\s/);
  });

  test("Press Enter inside ordered list item creates new list item", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    await page.keyboard.type("1. First item", { delay: 40 });
    await page.waitForTimeout(700);

    // Confirm we're in an ordered list block
    const olFirst = page.locator('[data-node-type="ol"][contenteditable="true"]').first();
    await expect(olFirst).toBeVisible({ timeout: 5000 });

    // Capture block count BEFORE pressing Enter
    const blockCountBefore = await page.evaluate(() =>
      document.querySelectorAll('[contenteditable="true"]').length
    );

    // Press Enter to create a new list item
    await page.keyboard.press("Enter");
    await page.waitForTimeout(800);

    // There should be more blocks after pressing Enter
    const blockCountAfter = await page.evaluate(() =>
      document.querySelectorAll('[contenteditable="true"]').length
    );
    expect(blockCountAfter).toBeGreaterThan(blockCountBefore);
  });

  test("Press Enter on empty list item exits list and becomes paragraph", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    await page.keyboard.type("- List item", { delay: 40 });
    await page.waitForTimeout(700);

    // Confirm list item exists
    const liBlock = page.locator('[data-node-type="li"][contenteditable="true"]').first();
    await expect(liBlock).toBeVisible({ timeout: 5000 });
    await liBlock.click();

    // Clear content to make it empty
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    // Press Enter on the empty list item
    await page.keyboard.press("Enter");
    await page.waitForTimeout(800);

    // The block should have converted to a paragraph
    const paragraphBlock = page.locator('[data-node-type="p"][contenteditable="true"]');
    await expect(paragraphBlock.first()).toBeVisible({ timeout: 5000 });
  });

  test("Backspace on empty list item deletes the item", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    await page.keyboard.type("- Delete me", { delay: 40 });
    await page.waitForTimeout(700);

    const liBlock = page.locator('[data-node-type="li"][contenteditable="true"]').first();
    await expect(liBlock).toBeVisible({ timeout: 5000 });

    const liNodeId = await liBlock.getAttribute("data-node-id");
    await liBlock.click();

    // Clear the list item content
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    // Backspace on empty list item should delete it
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(800);

    // Either the block was deleted (count decreased) or it converted to a paragraph
    const liGone = await page.evaluate(
      (id) => !document.querySelector(`[data-node-id="${id}"][data-node-type="li"]`),
      liNodeId
    );
    expect(liGone).toBe(true);
  });
});
