/**
 * Block Event Handler Functions
 * 
 * Functions for handling events in Block components
 */

import React from "react";
import { TextNode, ContainerNode, InlineText } from "../../types";
import { EditorAction, EditorActions } from "../../reducer/actions";
import { findParentById } from "../../utils/tree-operations";
import { generateId } from "../../utils/id-generator";

/** Parameters shared by all block-level event handler factory functions. */
export interface BlockEventHandlerParams {
  textNode: TextNode;
  readOnly: boolean;
  onInput: (element: HTMLElement) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
  onClick: () => void;
  onCreateNested?: (nodeId: string) => void;
  onChangeBlockType?: (nodeId: string, newType: string) => void;
  onInsertImage?: (nodeId: string) => void;
  onCreateList?: (nodeId: string, listType: string) => void;
  currentContainer: ContainerNode | (() => ContainerNode); // Can be value or getter for optimization
  dispatch: React.Dispatch<EditorAction>;
  localRef: React.RefObject<HTMLElement | null>;
  isComposingRef: React.MutableRefObject<boolean>;
  shouldPreserveSelectionRef: React.MutableRefObject<boolean>;
  showCommandMenu: boolean;
  setShowCommandMenu: (show: boolean) => void;
  setCommandMenuAnchor: (el: HTMLElement | null) => void;
}

/** Creates a factory that returns a compositionstart handler marking the IME composition as active. */
export function createHandleCompositionStart() {
  return (isComposingRef: React.MutableRefObject<boolean>) => {
    return () => {
      isComposingRef.current = true;
    };
  };
}

/** Creates a factory that returns a compositionend handler which clears the IME flag and flushes any pending content update. */
export function createHandleCompositionEnd() {
  return (
    isComposingRef: React.MutableRefObject<boolean>,
    onInput?: (element: HTMLElement) => void,
    localRef?: React.RefObject<HTMLElement | null>
  ) => {
    return () => {
      isComposingRef.current = false;

      // Flush any pending content update immediately after composition ends
      // so we don't wait for the next input event or debounce timer
      if (onInput && localRef?.current) {
        onInput(localRef.current);
      }
    };
  };
}

/** Creates an input handler that detects "/" to open the command menu and forwards content updates while guarding selection preservation. */
export function createHandleInput(params: Pick<BlockEventHandlerParams, 'textNode' | 'readOnly' | 'onInput' | 'onChangeBlockType' | 'showCommandMenu' | 'setShowCommandMenu' | 'setCommandMenuAnchor' | 'shouldPreserveSelectionRef' | 'dispatch'>) {
  return (e: React.FormEvent<HTMLDivElement>) => {
    const { textNode, readOnly, onInput, onChangeBlockType, showCommandMenu, setShowCommandMenu, setCommandMenuAnchor, shouldPreserveSelectionRef, dispatch } = params;
    const element = e.currentTarget;
    const text = element.textContent || "";

    // Check if the block is empty and user typed "/"
    if (text === "/" && !readOnly && onChangeBlockType) {
      setShowCommandMenu(true);
      setCommandMenuAnchor(element);
    } else if (showCommandMenu && text !== "/") {
      // Close menu if user continues typing
      setShowCommandMenu(false);
    }

    // Check for inline Markdown formatting patterns (only on plain text, not readOnly).
    // We check the DOM element's childElementCount rather than textNode.children
    // because during typing the textNode closure may be stale.
    const hasFormattedSpans = element.childElementCount > 0;
    if (!readOnly && !hasFormattedSpans) {
      const inlineFormatApplied = detectAndApplyInlineFormatting(text, element, textNode, dispatch);
      if (inlineFormatApplied) {
        // Don't set shouldPreserveSelectionRef — we WANT the Block's
        // useEffect to fire and update innerHTML with the formatted HTML.
        // Don't call onInput either — the dispatch already updated state.
        return;
      }
    }

    // Guard: prevent the useEffect from clobbering the DOM while the
    // debounced content dispatch triggers a second re-render.
    // The content debounce is 50ms, and React needs additional time to
    // process the state update and re-render. We use 120ms to safely
    // cover the full debounce + re-render window.
    shouldPreserveSelectionRef.current = true;

    // Call the parent onInput handler
    onInput(element);

    setTimeout(() => {
      shouldPreserveSelectionRef.current = false;
    }, 120);
  };
}

/**
 * Detects inline Markdown patterns in the full text content of a block and, if found,
 * dispatches an UPDATE_NODE action to replace the raw text with formatted inline children.
 *
 * Supported patterns (checked in priority order):
 *   **text**  → bold
 *   ~~text~~  → strikethrough
 *   `text`    → inline code
 *   *text*    → italic  (only single-star, not double)
 *
 * Returns true when a pattern was matched and the state was updated (caller should
 * skip the normal onInput path).  Returns false when no pattern matched.
 */
function detectAndApplyInlineFormatting(
  text: string,
  element: HTMLElement,
  textNode: TextNode,
  dispatch: React.Dispatch<EditorAction>
): boolean {
  // Helper: build the inline children array from the three segments and dispatch.
  function applyFormat(
    before: string,
    content: string,
    after: string,
    format: Partial<InlineText>
  ): boolean {
    const children: InlineText[] = [];
    if (before) children.push({ content: before });
    children.push({ content, ...format });
    if (after) children.push({ content: after });

    dispatch(EditorActions.updateNode(textNode.id, { children, content: undefined }));

    // Force the DOM to update: the shouldPreserveSelectionRef guard in
    // Block's useEffect would normally skip the innerHTML write during
    // typing. But we WANT the DOM to update here (to show formatted text
    // instead of raw markers). We schedule this after React re-renders.
    requestAnimationFrame(() => {
      // By the time rAF fires, React will have re-rendered with the new
      // textNode (which has children). The useEffect will have fired and
      // updated innerHTML IF shouldPreserveSelectionRef was false.
      // If it didn't update, force it now:
      element.focus();
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });

    return true;
  }

  // 1. Bold: **text**  (must be checked before single-star italic)
  const boldMatch = text.match(/^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/);
  if (boldMatch) {
    return applyFormat(boldMatch[1], boldMatch[2], boldMatch[3], { bold: true });
  }

  // 2. Strikethrough: ~~text~~
  const strikeMatch = text.match(/^([\s\S]*?)~~(.+?)~~([\s\S]*)$/);
  if (strikeMatch) {
    return applyFormat(strikeMatch[1], strikeMatch[2], strikeMatch[3], { strikethrough: true });
  }

  // 3. Inline code: `text`  (single backtick, not triple)
  const codeMatch = text.match(/^([\s\S]*?)(?<!`)(`{1})(?!`)(.+?)(?<!`)\2(?!`)([\s\S]*)$/);
  if (codeMatch) {
    return applyFormat(codeMatch[1], codeMatch[3], codeMatch[4], { code: true });
  }

  // 4. Italic: *text*  — single star, NOT preceded/followed by another star
  //    Negative lookbehind/lookahead ensures we don't match inside **bold**.
  const italicMatch = text.match(/^([\s\S]*?)(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)([\s\S]*)$/);
  if (italicMatch) {
    return applyFormat(italicMatch[1], italicMatch[2], italicMatch[3], { italic: true });
  }

  return false;
}

/** Creates a keydown handler that manages command menu navigation, list item creation, and Shift+Enter nesting within a block. */
export function createHandleKeyDown(params: BlockEventHandlerParams) {
  return (e: React.KeyboardEvent<HTMLDivElement>) => {
    const {
      textNode,
      onKeyDown,
      onCreateNested,
      showCommandMenu,
      setShowCommandMenu,
      setCommandMenuAnchor,
      currentContainer,
      dispatch,
    } = params;

    // Close command menu on Escape
    if (e.key === "Escape" && showCommandMenu) {
      e.preventDefault();
      setShowCommandMenu(false);
      setCommandMenuAnchor(null);
      return;
    }

    // If command menu is open, let it handle the keyboard events
    if (
      showCommandMenu &&
      ["ArrowDown", "ArrowUp", "Enter"].includes(e.key)
    ) {
      // Don't prevent default - let CommandMenu handle it
      return;
    }

    // For list items (ol/li), handle Enter and Shift+Enter specially
    // For non-list items, Shift+Enter creates nested blocks
    const isListItem =
      textNode.type === "ol" ||
      textNode.type === "li";

    // Handle Shift+Enter for list items - add line break within item
    if (e.key === "Enter" && e.shiftKey && isListItem) {
      e.preventDefault();
      e.stopPropagation();

      // Pass to SimpleEditor to handle line break insertion
      onKeyDown(e);
      return;
    }

    // Handle Shift+Enter for non-list items - create nested block
    if (e.key === "Enter" && e.shiftKey && !isListItem && onCreateNested) {
      e.preventDefault();
      onCreateNested(textNode.id);
      return;
    }

    // Handle regular Enter for list items - create new list item at same level
    if (e.key === "Enter" && !e.shiftKey && isListItem) {
      e.preventDefault();
      e.stopPropagation();

      // Get current container (call it if it's a getter function)
      const container = typeof currentContainer === 'function' ? currentContainer() : currentContainer;
      
      // Find the parent container
      const parent = findParentById(container, textNode.id);

      if (parent) {
        // Create a new list item with the same type
        const newListItem: TextNode = {
          id: generateId('li'),
          type: textNode.type, // Keep the same type (ul/ol/li)
          content: "",
        };

        // Insert after the current list item
        dispatch({
          type: "INSERT_NODE",
          payload: {
            node: newListItem,
            targetId: textNode.id,
            position: "after",
          },
        });

        // Wait for the browser to paint the new list item before focusing it.
        requestAnimationFrame(() => {
          const newElement = document.querySelector(
            `[data-node-id="${newListItem.id}"]`
          ) as HTMLElement;
          if (newElement) {
            newElement.focus();
          }
        });
      }

      return;
    }

    // Pass to parent handler for other keys
    onKeyDown(e);
  };
}

/** Creates a click handler that prevents link navigation in edit mode and calls the parent onClick callback. */
export function createHandleClick(params: Pick<BlockEventHandlerParams, 'readOnly' | 'onClick'>) {
  return (e: React.MouseEvent<HTMLDivElement>) => {
    const { readOnly, onClick } = params;
    // Check if the click target is a link
    const target = e.target as HTMLElement;
    if (target.tagName === "A" && target.hasAttribute("href")) {
      // In read-only mode, let links work naturally
      if (readOnly) {
        return; // Let the browser handle the link
      } else {
        // In edit mode, prevent link navigation
        e.preventDefault();
      }
    }

    // Call the parent onClick handler
    onClick();
  };
}

/** Creates a handler that routes a command-menu selection to the appropriate block-type change, image, list, or table operation. */
export function createHandleCommandSelect(params: {
  textNode: TextNode;
  onChangeBlockType?: (nodeId: string, newType: string) => void;
  onInsertImage?: (nodeId: string) => void;
  onCreateList?: (nodeId: string, listType: string) => void;
  onCreateTable?: (nodeId: string) => void;
  localRef: React.RefObject<HTMLElement | null>;
  setShowCommandMenu: (show: boolean) => void;
  setCommandMenuAnchor: (el: HTMLElement | null) => void;
}) {
  return (commandValue: string) => {
    const {
      textNode,
      onChangeBlockType,
      onInsertImage,
      onCreateList,
      onCreateTable,
      localRef,
      setShowCommandMenu,
      setCommandMenuAnchor,
    } = params;

    if (!localRef.current) return;

    // Clear the "/" character
    localRef.current.textContent = "";

    // Close the menu immediately
    setShowCommandMenu(false);
    setCommandMenuAnchor(null);

    // Handle image insertion specially
    if (commandValue === "img" && onInsertImage) {
      onInsertImage(textNode.id);
      return;
    }

    // Handle list creation (both ordered and unordered) - create a container with multiple list items
    if ((commandValue === "ol" || commandValue === "ul") && onCreateList) {
      // Small delay to ensure menu is closed before creating the list
      setTimeout(() => {
        onCreateList(textNode.id, commandValue);
      }, 50);
      return;
    }

    // Handle table creation
    if (commandValue === "table" && onCreateTable) {
      // Small delay to ensure menu is closed before opening table dialog
      setTimeout(() => {
        onCreateTable(textNode.id);
      }, 50);
      return;
    }

    // For other block types (including 'li'), just change the type
    if (onChangeBlockType) {
      onChangeBlockType(textNode.id, commandValue);

      // Wait for the browser to paint the updated block before refocusing it.
      requestAnimationFrame(() => {
        localRef.current?.focus();
      });
    }
  };
}

/** Creates a handler that dispatches a background-color attribute update for the given text node. */
export function createHandleBackgroundColorChange(
  textNode: TextNode,
  dispatch: React.Dispatch<EditorAction>
) {
  return (color: string) => {
    dispatch({
      type: "UPDATE_ATTRIBUTES",
      payload: {
        id: textNode.id,
        attributes: {
          backgroundColor: color,
        },
        merge: true,
      },
    });
  };
}

