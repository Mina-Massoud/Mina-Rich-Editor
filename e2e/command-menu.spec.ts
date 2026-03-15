import { test, expect } from "@playwright/test";

/**
 * Helper to open the editor page and wait for it to be ready.
 */
async function openEditor(page: any) {
  await page.goto("http://localhost:3099");
  await page.waitForLoadState("networkidle");
  await page.getByText("Try the Editor").click();
  await page.waitForSelector("[data-editor-content]", { timeout: 10000 });
  await page.waitForTimeout(2000);
}

/**
 * Helper to open the command menu on a paragraph block.
 * Clears the block, types "/" to trigger the menu, and waits for it to appear.
 * Returns the locator for the paragraph block used.
 */
async function openCommandMenu(page: any) {
  const p = page.locator('[data-node-type="p"][contenteditable="true"]').first();
  await p.click();
  await page.keyboard.press("Meta+a");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(300);

  // Type "/" to trigger command menu
  await page.keyboard.type("/");
  await page.waitForTimeout(500);

  // Wait for the command menu popover to appear
  const commandMenu = page
    .locator('[cmdk-root], [role="dialog"], [data-radix-popper-content-wrapper]')
    .first();
  await expect(commandMenu).toBeVisible({ timeout: 3000 });

  return p;
}

test.describe("Command Menu - Element Type Switching", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test("Opening '/' command menu shows available commands", async ({ page }) => {
    await openCommandMenu(page);

    // Verify key options are visible in the menu
    await expect(page.locator('[cmdk-item]').first()).toBeVisible();
  });

  test("Switch to Heading 1 via command menu", async ({ page }) => {
    const p = await openCommandMenu(page);
    const nodeId = await p.getAttribute("data-node-id");

    // Click "Heading 1" from the command menu
    const option = page.locator('[cmdk-item]').filter({ hasText: "Heading 1" }).first();
    await option.click();
    await page.waitForTimeout(500);

    // The block should now be an h1
    const h1 = page.locator(`[data-node-id="${nodeId}"][data-node-type="h1"]`);
    await expect(h1).toBeVisible({ timeout: 3000 });
  });

  test("Switch to Heading 2 via command menu", async ({ page }) => {
    const p = await openCommandMenu(page);
    const nodeId = await p.getAttribute("data-node-id");

    const option = page.locator('[cmdk-item]').filter({ hasText: "Heading 2" }).first();
    await option.click();
    await page.waitForTimeout(500);

    const h2 = page.locator(`[data-node-id="${nodeId}"][data-node-type="h2"]`);
    await expect(h2).toBeVisible({ timeout: 3000 });
  });

  test("Switch to Heading 3 via command menu", async ({ page }) => {
    const p = await openCommandMenu(page);
    const nodeId = await p.getAttribute("data-node-id");

    const option = page.locator('[cmdk-item]').filter({ hasText: "Heading 3" }).first();
    await option.click();
    await page.waitForTimeout(500);

    const h3 = page.locator(`[data-node-id="${nodeId}"][data-node-type="h3"]`);
    await expect(h3).toBeVisible({ timeout: 3000 });
  });

  test("Switch to Blockquote via command menu", async ({ page }) => {
    const p = await openCommandMenu(page);
    const nodeId = await p.getAttribute("data-node-id");

    const option = page.locator('[cmdk-item]').filter({ hasText: "Quote" }).first();
    await option.click();
    await page.waitForTimeout(500);

    const blockquote = page.locator(
      `[data-node-id="${nodeId}"][data-node-type="blockquote"]`
    );
    await expect(blockquote).toBeVisible({ timeout: 3000 });
  });

  test("Switch to Code Block via command menu", async ({ page }) => {
    const p = await openCommandMenu(page);
    const nodeId = await p.getAttribute("data-node-id");

    // Click "Code Block" from the command menu
    const option = page.locator('[cmdk-item]').filter({ hasText: "Code Block" }).first();
    await option.click();
    await page.waitForTimeout(500);

    // Code block should render as a <pre> element with data-node-type="code"
    const codeBlock = page.locator(
      `[data-node-id="${nodeId}"][data-node-type="code"]`
    );
    await expect(codeBlock).toBeVisible({ timeout: 3000 });

    // Verify it rendered as a <pre> element
    const tagName = await codeBlock.evaluate((el: Element) => el.tagName.toLowerCase());
    expect(tagName).toBe("pre");
  });

  test("Switch to Bulleted List via command menu", async ({ page }) => {
    const p = await openCommandMenu(page);
    const nodeId = await p.getAttribute("data-node-id");

    const option = page.locator('[cmdk-item]').filter({ hasText: "Bulleted List" }).first();
    await option.click();
    await page.waitForTimeout(500);

    const listItem = page.locator(
      `[data-node-id="${nodeId}"][data-node-type="li"]`
    );
    await expect(listItem).toBeVisible({ timeout: 3000 });
  });

  test("Switch to Numbered List via command menu", async ({ page }) => {
    const p = await openCommandMenu(page);
    const nodeId = await p.getAttribute("data-node-id");

    const option = page.locator('[cmdk-item]').filter({ hasText: "Numbered List" }).first();
    await option.click();
    await page.waitForTimeout(500);

    // Numbered list creates an "ol" type block
    const olItem = page.locator(`[data-node-type="ol"]`);
    await expect(olItem.first()).toBeVisible({ timeout: 3000 });
  });

  test("Command menu closes after selecting an option", async ({ page }) => {
    await openCommandMenu(page);

    const option = page.locator('[cmdk-item]').filter({ hasText: "Heading 2" }).first();
    await option.click();
    await page.waitForTimeout(500);

    // Command menu should no longer be visible
    const commandMenu = page
      .locator('[cmdk-root], [data-radix-popper-content-wrapper]')
      .first();
    await expect(commandMenu).not.toBeVisible({ timeout: 3000 });
  });

  test("Code block is editable after switching via command menu", async ({ page }) => {
    const p = await openCommandMenu(page);
    const nodeId = await p.getAttribute("data-node-id");

    const option = page.locator('[cmdk-item]').filter({ hasText: "Code Block" }).first();
    await option.click();
    await page.waitForTimeout(500);

    // Find the code block and type in it
    const codeBlock = page.locator(
      `[data-node-id="${nodeId}"][data-node-type="code"]`
    );
    await expect(codeBlock).toBeVisible({ timeout: 3000 });

    await codeBlock.click();
    await page.keyboard.type("const x = 42;", { delay: 30 });
    await page.waitForTimeout(500);

    // Verify the content was typed
    const content = await codeBlock.textContent();
    expect(content).toContain("const x = 42;");
  });

  test("Switching to code block applies monospace font styling", async ({ page }) => {
    const p = await openCommandMenu(page);
    const nodeId = await p.getAttribute("data-node-id");

    const option = page.locator('[cmdk-item]').filter({ hasText: "Code Block" }).first();
    await option.click();
    await page.waitForTimeout(500);

    const codeBlock = page.locator(
      `[data-node-id="${nodeId}"][data-node-type="code"]`
    );
    await expect(codeBlock).toBeVisible({ timeout: 3000 });

    // Verify the code block has monospace font class
    const hasMonoClass = await codeBlock.evaluate((el: Element) =>
      el.classList.contains("font-mono")
    );
    expect(hasMonoClass).toBe(true);
  });
});
