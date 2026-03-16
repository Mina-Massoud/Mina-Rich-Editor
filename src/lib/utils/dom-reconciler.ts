/**
 * DOM Reconciler Utility
 *
 * Patches only changed DOM nodes instead of replacing innerHTML entirely,
 * preserving cursor position during content edits.
 *
 * Key principle: When the contentEditable element is focused and the user is
 * actively typing, the DOM is the source of truth and we should NOT overwrite
 * it from state. We only sync from state when:
 * - The element is not focused (user is not actively editing it)
 * - An external action occurred (undo/redo, formatting, etc.) — signaled by
 *   the caller passing `forceUpdate = true`
 */

/**
 * Reconcile the innerHTML of a contentEditable element with a desired HTML string.
 *
 * @param element       The contentEditable HTMLElement to update.
 * @param getNewHTML    A function that returns the desired HTML string (called lazily).
 * @param forceUpdate   When true, always update even if the element is focused.
 *                      Use this for undo/redo, formatting changes, etc.
 * @returns `true` if the DOM was actually updated, `false` if skipped or identical.
 */
export function reconcileContent(
  element: HTMLElement,
  getNewHTML: () => string,
  forceUpdate: boolean = false
): boolean {
  const isFocused = document.activeElement === element;

  // When the element is focused and we are not forcing an update, the user is
  // actively editing — the DOM is the source of truth, so skip the sync.
  if (isFocused && !forceUpdate) {
    return false;
  }

  const newHTML = getNewHTML();
  const currentHTML = element.innerHTML;

  // Skip update if content already matches
  if (currentHTML === newHTML) {
    return false;
  }

  // If the element is focused (forced update path), save and restore cursor position
  if (isFocused) {
    const charOffset = getCharacterOffset(element);

    element.innerHTML = newHTML;

    if (charOffset >= 0) {
      try {
        restoreCursorByOffset(element, charOffset);
      } catch {
        // Silently fail — cursor position is nice-to-have, not critical
      }
    }
  } else {
    // Element is not focused — safe to set innerHTML directly
    element.innerHTML = newHTML;
  }

  return true;
}

/**
 * Get the character offset of the current cursor (anchor) within `container`.
 * Returns -1 if there is no relevant selection.
 */
export function getCharacterOffset(container: Node): number {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return -1;

  const anchor = selection.anchorNode;
  if (!anchor || !container.contains(anchor)) return -1;

  return countCharacters(container, anchor, selection.anchorOffset);
}

/**
 * Walk text nodes under `container` counting characters until `targetNode` is
 * reached. Returns the total character offset at `targetNode[targetOffset]`.
 */
function countCharacters(
  container: Node,
  targetNode: Node,
  targetOffset: number
): number {
  let charCount = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node === targetNode) {
      return charCount + targetOffset;
    }
    charCount += node.textContent?.length ?? 0;
  }
  // targetNode was not found as a text node — return the accumulated count
  return charCount + targetOffset;
}

/**
 * Restore the cursor to the given character offset within `container`.
 */
export function restoreCursorByOffset(container: Node, targetOffset: number): void {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const nodeLength = node.textContent?.length ?? 0;
    if (charCount + nodeLength >= targetOffset) {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        range.setStart(node, targetOffset - charCount);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      return;
    }
    charCount += nodeLength;
  }

  // If offset is past end of content, place cursor at end
  const selection = window.getSelection();
  if (selection) {
    const range = document.createRange();
    range.selectNodeContents(container);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
