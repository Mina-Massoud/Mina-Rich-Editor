import { test, expect } from "@playwright/test";

async function openEditor(page: any) {
  await page.goto("http://localhost:3099");
  await page.waitForLoadState("networkidle");
  await page.getByText("Try the Editor").click();
  await page.waitForSelector("[data-editor-content]", { timeout: 10000 });
  await page.waitForTimeout(2000);
}

test.describe("Block operations", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test("Typing '/' in empty paragraph opens command menu", async ({ page }) => {
    // Find an empty paragraph or clear an existing one
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    // Type "/" to trigger command menu
    await page.keyboard.type("/");
    await page.waitForTimeout(500);

    // Command menu should be visible — it renders in a Popover/Portal
    const commandMenu = page.locator('[cmdk-root], [role="dialog"], [data-radix-popper-content-wrapper]').first();
    await expect(commandMenu).toBeVisible({ timeout: 3000 });
  });

  test("Select 'Heading 1' from command menu changes block type to h1", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    await page.keyboard.type("/");
    await page.waitForTimeout(500);

    // Click "Heading 1" from the command menu
    const heading1Option = page.getByText("Heading 1").first();
    await heading1Option.click();
    await page.waitForTimeout(500);

    // The block should now be an h1
    const h1 = page.locator('[data-node-type="h1"][contenteditable="true"]');
    await expect(h1.first()).toBeVisible();
  });

  test("Select 'Heading 2' from command menu changes block type to h2", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    await page.keyboard.type("/");
    await page.waitForTimeout(500);

    const heading2Option = page.getByText("Heading 2").first();
    await heading2Option.click();
    await page.waitForTimeout(500);

    const h2 = page.locator('[data-node-type="h2"][contenteditable="true"]');
    await expect(h2.first()).toBeVisible();
  });

  test("Select 'Quote' from command menu changes block type to blockquote", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    await page.keyboard.type("/");
    await page.waitForTimeout(500);

    const quoteOption = page.getByText("Quote").first();
    await quoteOption.click();
    await page.waitForTimeout(500);

    const blockquote = page.locator('[data-node-type="blockquote"][contenteditable="true"]');
    await expect(blockquote.first()).toBeVisible();
  });

  test("Select 'Code' from command menu changes block type to code/pre", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(300);

    await page.keyboard.type("/");
    await page.waitForTimeout(500);

    const codeOption = page.getByText("Code").first();
    await codeOption.click();
    await page.waitForTimeout(500);

    // Code block renders as <pre> element
    const codeBlock = page.locator('[data-node-type="code"][contenteditable="true"]');
    await expect(codeBlock.first()).toBeVisible();
  });

  test("Backspace on empty block deletes block and moves focus to previous", async ({ page }) => {
    // Type content in first paragraph to preserve it, then create a new empty block via Enter
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("First block content", { delay: 30 });
    await page.waitForTimeout(400);

    // Press Enter to create a new block
    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);

    const blockCountBefore = await page.evaluate(() =>
      document.querySelectorAll('[contenteditable="true"]').length
    );

    // The new block is empty — press Backspace to delete it
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(500);

    const blockCountAfter = await page.evaluate(() =>
      document.querySelectorAll('[contenteditable="true"]').length
    );

    expect(blockCountAfter).toBeLessThan(blockCountBefore);

    // First block should still have its content
    const firstBlockText = await page.evaluate(
      (id: string) => document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? "",
      nodeId
    );
    expect(firstBlockText).toContain("First block content");
  });

  test("Backspace on the only remaining block clears content but keeps the block", async ({ page }) => {
    // Navigate to a fresh editor state with a single editable block
    const blocks = page.locator('[contenteditable="true"]');
    const initialCount = await blocks.count();

    // Clear first paragraph
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    const nodeId = await p.getAttribute("data-node-id");

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("X", { delay: 30 });
    await page.waitForTimeout(300);
    await page.keyboard.press("Backspace");
    await page.waitForTimeout(500);

    // Block should still exist (not be removed)
    const blockStillExists = await page.evaluate(
      (id: string) => !!document.querySelector(`[data-node-id="${id}"]`),
      nodeId
    );
    expect(blockStillExists).toBe(true);

    // Content should be empty
    const text = await page.evaluate(
      (id: string) => document.querySelector(`[data-node-id="${id}"]`)?.textContent ?? "",
      nodeId
    );
    expect(text.trim()).toBe("");
  });

  test("Multiple blocks created with Enter preserve correct order", async ({ page }) => {
    const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    await p.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type("Alpha", { delay: 30 });
    await page.waitForTimeout(400);

    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await page.keyboard.type("Beta", { delay: 30 });
    await page.waitForTimeout(400);

    await page.keyboard.press("Enter");
    await page.waitForTimeout(300);
    await page.keyboard.type("Gamma", { delay: 30 });
    await page.waitForTimeout(500);

    // Collect all contenteditable text content in DOM order
    const allTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[contenteditable="true"]')).map(
        (el) => el.textContent?.trim() ?? ""
      )
    );

    const alphaIdx = allTexts.indexOf("Alpha");
    const betaIdx = allTexts.indexOf("Beta");
    const gammaIdx = allTexts.indexOf("Gamma");

    expect(alphaIdx).toBeGreaterThanOrEqual(0);
    expect(betaIdx).toBeGreaterThan(alphaIdx);
    expect(gammaIdx).toBeGreaterThan(betaIdx);
  });
});
