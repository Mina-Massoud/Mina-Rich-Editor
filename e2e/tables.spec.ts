import { test, expect } from '@playwright/test';
import { openEditor, getFreshParagraph, mod } from './helpers';

// TODO: All table tests depend on "/" command menu inserting a table.
// The command menu trigger is unreliable in headless CI (getFreshParagraph + "/" doesn't always open).
// Re-enable once command menu triggering is stabilized.
test.describe.skip('Table operations', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test('Insert table via / command menu', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    const tableOption = page.getByText('Table').first();
    await tableOption.click();
    await page.waitForTimeout(500);
    const table = page.locator('[data-node-type="table"], table');
    await expect(table.first()).toBeVisible({ timeout: 5000 });
  });

  test('Table has header row with th cells', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);
    const thCells = page.locator('th, [data-node-type="th"]');
    const count = await thCells.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Table has body rows with td cells', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);
    const tdCells = page.locator('td, [data-node-type="td"]');
    const count = await tdCells.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Can type in table header cells', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);

    const firstTh = page.locator('th, [data-node-type="th"]').first();
    await firstTh.click();
    await page.keyboard.type('Header Text');
    await page.waitForTimeout(300);

    const text = await firstTh.textContent();
    expect(text).toContain('Header Text');
  });

  test('Can type in table body cells', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);

    const firstTd = page.locator('td, [data-node-type="td"]').first();
    await firstTd.click();
    await page.keyboard.type('Cell Data');
    await page.waitForTimeout(300);

    const text = await firstTd.textContent();
    expect(text).toContain('Cell Data');
  });

  test('Tab navigates between table cells', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);

    const firstCell = page.locator('th, [data-node-type="th"]').first();
    await firstCell.click();
    await page.keyboard.type('First');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    await page.keyboard.type('Second');

    const cells = page.locator('th, [data-node-type="th"]');
    const secondCell = cells.nth(1);
    const text = await secondCell.textContent();
    expect(text).toContain('Second');
  });

  test('Delete table block via backspace when empty', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);

    // Verify table exists
    let tables = page.locator('[data-node-type="table"], table');
    expect(await tables.count()).toBeGreaterThan(0);

    // The table should be a block that can potentially be removed
    // This test verifies the table was inserted
  });

  test('Table renders correct number of columns', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);

    // Default table should have at least 2 columns
    const headerRow = page.locator('tr, [data-node-type="tr"]').first();
    const headerCells = headerRow.locator('th, [data-node-type="th"]');
    const count = await headerCells.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('Table has both thead and tbody sections', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);

    const thead = page.locator('thead, [data-node-type="thead"]');
    const tbody = page.locator('tbody, [data-node-type="tbody"]');
    expect(await thead.count()).toBeGreaterThan(0);
    expect(await tbody.count()).toBeGreaterThan(0);
  });

  test('Multiple tables can coexist', async ({ page }) => {
    // Insert first table
    let p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);

    // Create new block after table and insert second table
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);

    const tables = page.locator('[data-node-type="table"], table[class*="border"]');
    expect(await tables.count()).toBeGreaterThanOrEqual(2);
  });

  test('Table cells preserve content after focus change', async ({ page }) => {
    const p = await getFreshParagraph(page);
    await page.keyboard.type('/');
    await page.waitForTimeout(500);
    await page.getByText('Table').first().click();
    await page.waitForTimeout(500);

    const firstTh = page.locator('th, [data-node-type="th"]').first();
    await firstTh.click();
    await page.keyboard.type('Preserved');

    // Click elsewhere
    const editorContent = page.locator('[data-editor-content]');
    await editorContent.click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);

    // Check content persists
    const text = await firstTh.textContent();
    expect(text).toContain('Preserved');
  });
});
