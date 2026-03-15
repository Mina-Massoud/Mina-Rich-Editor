/**
 * Selection Handler Functions
 *
 * Functions for handling text selection and formatting in the editor
 */

import { EditorActions } from "../reducer/actions";
import { ContainerNode, SelectionInfo, TextNode, isTextNode } from "../types";
import {
  detectFormatsInRange,
  restoreSelection,
} from "../utils/editor-helpers";
import { findNodeById } from "../utils/tree-operations";

/** Parameters shared by all selection handler factory functions. */
export interface SelectionHandlerParams {
  container: ContainerNode | (() => ContainerNode);
  state: any;
  dispatch: React.Dispatch<any>;
  selectionManager: any;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}

/** Creates a selection-change handler that detects the active node, measures the selection range, and dispatches format state updates with a debounce. */
export function createHandleSelectionChange(
  params: SelectionHandlerParams,
  selectionDispatchTimerRef: React.MutableRefObject<NodeJS.Timeout | null>
) {
  return () => {
    const { container: containerOrGetter, state, dispatch, selectionManager, nodeRefs } = params;
    const container = typeof containerOrGetter === 'function' ? containerOrGetter() : containerOrGetter;
    const selection = window.getSelection();
    const hasText =
      selection !== null &&
      !selection.isCollapsed &&
      selection.toString().length > 0;
    
    // Also track collapsed cursor (even when no text selected)
    const hasCursor = selection !== null && selection.isCollapsed;

    if ((hasText || hasCursor) && selection) {
      // NEW APPROACH: Find the actual node by traversing the DOM upwards from the selection
      const range = selection.getRangeAt(0);
      let currentElement: HTMLElement | null = null;

      // Start from the selection's common ancestor
      let node: Node | null = range.commonAncestorContainer;

      // Walk up the DOM to find the closest element with data-node-id
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const nodeId = element.getAttribute("data-node-id");
          const nodeType = element.getAttribute("data-node-type");

          // We found a text node (not a container)
          if (nodeId && nodeType && nodeType !== "container") {
            currentElement = element;
            break;
          }
        }
        node = node.parentNode;
      }

      if (!currentElement) {
        // Fallback to old behavior if we can't find via DOM
        const freshCurrentNode = state.activeNodeId
          ? (findNodeById(container, state.activeNodeId) as
              | TextNode
              | undefined)
          : (container.children[0] as TextNode | undefined);

        if (freshCurrentNode) {
          currentElement = nodeRefs.current.get(freshCurrentNode.id) || null;
        }
      }

      if (currentElement) {
        const actualNodeId = currentElement.getAttribute("data-node-id");

        if (actualNodeId) {
          // Find the actual node in the tree (including nested nodes)
          const actualNode = findNodeById(container, actualNodeId) as
            | TextNode
            | undefined;

          if (actualNode && isTextNode(actualNode)) {
            const preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(currentElement);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            let start = preSelectionRange.toString().length;
            let end = start + range.toString().length;

            // Detect active formats in the selected range
            const detected = detectFormatsInRange(actualNode, start, end);

            const selectionInfo: SelectionInfo = {
              text: selection.toString(),
              start,
              end,
              nodeId: actualNode.id,
              formats: {
                bold: detected.bold,
                italic: detected.italic,
                underline: detected.underline,
                strikethrough: detected.strikethrough,
                code: detected.code,
              },
              elementType: detected.elementType,
              href: detected.href,
              className: detected.className,
              styles: detected.styles,
            };

            // Check if selection actually changed
            const currentSel = selectionManager.getSelection();
            const changed =
              !currentSel ||
              currentSel.start !== start ||
              currentSel.end !== end ||
              currentSel.nodeId !== actualNode.id ||
              currentSel.formats.bold !== detected.bold ||
              currentSel.formats.italic !== detected.italic ||
              currentSel.formats.underline !== detected.underline ||
              currentSel.elementType !== detected.elementType;

            if (changed) {
              // Update ref immediately (fast, no re-renders)
              selectionManager.setSelection(selectionInfo);

              // Debounce state dispatch to avoid excessive re-renders
              if (selectionDispatchTimerRef.current) {
                clearTimeout(selectionDispatchTimerRef.current);
              }

              // Debounce: batch rapid selection-change events into one toolbar re-render.
              selectionDispatchTimerRef.current = setTimeout(() => {
                dispatch(EditorActions.setCurrentSelection(selectionInfo));
              }, 150);
            }
            return; // Exit early on success
          }
        }
      }
    }

    // Clear selection if no valid selection found
    const currentSel = selectionManager.getSelection();
    if (currentSel !== null) {
      // Clear ref immediately
      selectionManager.setSelection(null);

      // Clear state with debounce
      if (selectionDispatchTimerRef.current) {
        clearTimeout(selectionDispatchTimerRef.current);
      }

      // Debounce: avoid clearing the toolbar selection on every transient pointer event.
      selectionDispatchTimerRef.current = setTimeout(() => {
        dispatch(EditorActions.setCurrentSelection(null));
      }, 150);
    }
  };
}

/** Creates a format-toggle handler that dispatches the given format to the reducer and restores the selection afterwards. */
export function createHandleFormat(params: SelectionHandlerParams) {
  return (format: "bold" | "italic" | "underline" | "strikethrough" | "code") => {
    const { dispatch, selectionManager, nodeRefs } = params;

    // Get fresh selection from ref (more up-to-date than state)
    const refSelection = selectionManager.getSelection();
    if (!refSelection) {
      return;
    }

    // Save selection for restoration
    const { start, end, nodeId } = refSelection;

    // Dispatch toggle format action - reducer handles everything!
    dispatch(EditorActions.toggleFormat(format));

    // Restore selection after the browser has painted the formatted DOM.
    requestAnimationFrame(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        restoreSelection(element, start, end);
      }
    });
  };
}

/** Creates a handler that applies a CSS color value as an inline style to the current selection. */
export function createHandleApplyColor(
  params: SelectionHandlerParams,
  toast: any,
  setSelectedColor: (color: string) => void
) {
  return (color: string) => {
    const { dispatch, selectionManager, nodeRefs } = params;
    // Get fresh selection from ref
    const refSelection = selectionManager.getSelection();
    if (!refSelection) return;

    const { nodeId, start, end } = refSelection;

    // Apply color as inline style
    dispatch(EditorActions.applyInlineStyle("color", color));

    setSelectedColor(color);

    toast({
      title: "Color Applied",
      description: `Applied color: ${color}`,
    });

    // Restore selection after the browser has painted the color-styled DOM.
    requestAnimationFrame(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        restoreSelection(element, start, end);
      }
    });
  };
}

/** Creates a handler that applies a font-size inline style value to the current text selection. */
export function createHandleApplyFontSize(
  params: SelectionHandlerParams,
  toast: any
) {
  return (fontSize: string) => {
    const { dispatch, selectionManager, nodeRefs } = params;
    // Get fresh selection from ref
    const refSelection = selectionManager.getSelection();
    if (!refSelection) return;

    const { nodeId, start, end } = refSelection;

    // Apply font size as inline style
    dispatch(EditorActions.applyInlineStyle("fontSize", fontSize));

    toast({
      title: "Font Size Applied",
      description: `Applied font size: ${fontSize}`,
    });

    // Restore selection after the browser has painted the font-size-styled DOM.
    requestAnimationFrame(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        restoreSelection(element, start, end);
      }
    });
  };
}

/** Creates a handler that changes the block or inline element type of the currently selected text. */
export function createHandleTypeChange(
  params: SelectionHandlerParams,
  handleSelectionChange: () => void
) {
  return (type: TextNode["type"]) => {
    const { dispatch, selectionManager, nodeRefs } = params;

    // Check if there's a selection (use ref for freshest data)
    const refSelection = selectionManager.getSelection();
    if (!refSelection) return;

    // Save selection info before dispatch
    const { start, end, nodeId } = refSelection;

    // Block-level types should change the entire block, not inline formatting
    if (type === "ol" || type === "li" || type === "code") {
      dispatch(EditorActions.updateNode(nodeId, { type: type }));

      // Restore selection after the browser has painted the converted list node.
      requestAnimationFrame(() => {
        const element = nodeRefs.current.get(nodeId);
        if (element) {
          restoreSelection(element, start, end);
          handleSelectionChange();
        }
      });
      return;
    }

    // Apply as inline element type to selected text (or at cursor position)
    const elementType = type as
      | "p"
      | "h1"
      | "h2"
      | "h3"
      | "h4"
      | "h5"
      | "h6"
      | "blockquote";

    dispatch(EditorActions.applyInlineElementType(elementType));

    // Restore selection after the browser has painted the type-changed inline node.
    requestAnimationFrame(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        restoreSelection(element, start, end);
        // Manually trigger selection change detection to update the UI
        handleSelectionChange();
      }
    });
  };
}
