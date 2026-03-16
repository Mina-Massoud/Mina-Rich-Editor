import { test, expect } from "@playwright/test";
import { openEditor } from "./helpers";

test.describe("Drag and drop", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test("Drag handle appears when hovering over a block", async ({ page }) => {
    // The drag handle container has class group — on hover the handle becomes opacity-100
    // We look for the GripVertical icon wrapper inside the block
    const block = page.locator('[data-node-type="p"][contenteditable="true"]').first();

    // Hover over the block to trigger group-hover visibility
    await block.hover();
    await page.waitForTimeout(300);

    // The drag handle container is the sibling div rendered by BlockDragHandle.
    // It lives inside the relative group div. We look for the [draggable="true"] element.
    const dragHandle = page
      .locator('[draggable="true"]')
      .first();

    await expect(dragHandle).toBeAttached({ timeout: 3000 });
  });

  test("Drag handle element has draggable attribute set to true", async ({ page }) => {
    const block = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await block.hover();
    await page.waitForTimeout(300);

    const draggableAttr = await page.evaluate(() => {
      const el = document.querySelector('[draggable="true"]');
      return el?.getAttribute("draggable");
    });

    expect(draggableAttr).toBe("true");
  });

  test("Each block has a data-node-id attribute for drag targeting", async ({ page }) => {
    const blocks = page.locator('[contenteditable="true"]');
    const count = await blocks.count();
    expect(count).toBeGreaterThan(0);

    // Every editable block must have a data-node-id
    const allHaveNodeId = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[contenteditable="true"]'));
      return els.every((el) => !!el.getAttribute("data-node-id"));
    });
    expect(allHaveNodeId).toBe(true);
  });

  test("Drag handle is inside the block's group container", async ({ page }) => {
    const block = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await block.hover();
    await page.waitForTimeout(300);

    // The draggable element should be a descendant of the editor container
    const dragHandleInsideEditor = await page.evaluate(() => {
      const editor = document.querySelector("[data-editor-content]");
      const dragHandle = document.querySelector('[draggable="true"]');
      return editor && dragHandle ? editor.contains(dragHandle) : false;
    });

    expect(dragHandleInsideEditor).toBe(true);
  });

  test("Drag handle has a cursor-grab style class", async ({ page }) => {
    const block = page.locator('[data-node-type="p"][contenteditable="true"]').first();
    await block.hover();
    await page.waitForTimeout(300);

    const hasCursorGrab = await page.evaluate(() => {
      const dragHandle = document.querySelector('[draggable="true"]');
      if (!dragHandle) return false;
      const className = dragHandle.className || "";
      return className.includes("cursor-grab") || className.includes("grab");
    });

    expect(hasCursorGrab).toBe(true);
  });
});
