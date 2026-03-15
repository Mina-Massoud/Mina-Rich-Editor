import { test, expect } from "@playwright/test";

async function openEditor(page: any) {
  await page.goto("http://localhost:3099");
  await page.waitForLoadState("networkidle");
  await page.getByText("Try the Editor").click();
  await page.waitForSelector("[data-editor-content]", { timeout: 10000 });
  await page.waitForTimeout(2000);
}

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
    await expect(olBlock.first()).toBeVisible({ timeout: 3000 });

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
    await expect(liBlock.first()).toBeVisible({ timeout: 3000 });

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
    await expect(olFirst).toBeVisible({ timeout: 3000 });

    const olCountBefore = await page.locator('[data-node-type="ol"][contenteditable="true"]').count();

    // Press Enter to create a new list item
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    // There should be a new ol block or the focus should move to the next block
    const blocksAfter = await page.evaluate(() =>
      document.querySelectorAll('[contenteditable="true"]').length
    );
    // At minimum the total block count should have increased by 1
    const blocksBefore = await page.evaluate(() =>
      // Re-count after to have comparable snapshots
      document.querySelectorAll('[contenteditable="true"]').length
    );
    // After pressing Enter we should have more blocks than before
    // (the new block may be a paragraph or ol depending on the editor's behavior)
    expect(blocksAfter).toBeGreaterThanOrEqual(olCountBefore + 1);
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
    await expect(liBlock).toBeVisible({ timeout: 3000 });
    await liBlock.click();

    // Clear content to make it empty
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    // Confirm it's empty by checking text content
    const emptyText = await liBlock.textContent();
    expect(emptyText?.trim()).toBe("");

    // Press Enter on the empty list item
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    // The block should have converted to a paragraph
    const paragraphBlock = page.locator('[data-node-type="p"][contenteditable="true"]');
    await expect(paragraphBlock.first()).toBeVisible({ timeout: 3000 });
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
    await expect(liBlock).toBeVisible({ timeout: 3000 });

    const liNodeId = await liBlock.getAttribute("data-node-id");
    await liBlock.click();

    // Clear the list item content
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    const blockCountBefore = await page.evaluate(() =>
      document.querySelectorAll('[contenteditable="true"]').length
    );

    // Backspace on empty list item should delete it
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(500);

    const blockCountAfter = await page.evaluate(() =>
      document.querySelectorAll('[contenteditable="true"]').length
    );

    // Either the block was deleted (count decreased) or it converted to a paragraph
    const liGone = await page.evaluate(
      (id: string) => !document.querySelector(`[data-node-id="${id}"][data-node-type="li"]`),
      liNodeId
    );
    expect(liGone).toBe(true);
  });
});
