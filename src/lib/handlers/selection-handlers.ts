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

export interface SelectionHandlerParams {
  container: ContainerNode;
  state: any;
  dispatch: React.Dispatch<any>;
  selectionManager: any;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
}

/**
 * Track text selection - updates ref immediately, state with debounce
 */
export function createHandleSelectionChange(
  params: SelectionHandlerParams,
  selectionDispatchTimerRef: React.MutableRefObject<NodeJS.Timeout | null>
) {
  return () => {
    const { container, state, dispatch, selectionManager, nodeRefs } = params;
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

            // Get the selected text
            const selectedText = selection.toString();

            // For collapsed cursor (no selection), we still want to detect formatting at cursor position
            const isCollapsed = start === end;

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

              selectionDispatchTimerRef.current = setTimeout(() => {
                dispatch(EditorActions.setCurrentSelection(selectionInfo));
              }, 150); // 150ms debounce for toolbar updates
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

      selectionDispatchTimerRef.current = setTimeout(() => {
        dispatch(EditorActions.setCurrentSelection(null));
      }, 150);
    }
  };
}

/**
 * Handle format button clicks - completely state-driven!
 */
export function createHandleFormat(params: SelectionHandlerParams) {
  return (format: "bold" | "italic" | "underline" | "strikethrough" | "code") => {
    const { container, dispatch, selectionManager, nodeRefs } = params;
    console.group("🔘 [handleFormat] Button clicked");

    // Get fresh selection from ref (more up-to-date than state)
    const refSelection = selectionManager.getSelection();
    if (!refSelection) {
      console.warn("❌ No current selection, aborting");
      console.groupEnd();
      return;
    }

    // Save selection for restoration
    const { start, end, nodeId, formats } = refSelection;

    // Dispatch toggle format action - reducer handles everything!
    dispatch(EditorActions.toggleFormat(format));

    // After state updates, check what happened
    setTimeout(() => {
      const updatedNode = container.children.find((n) => n.id === nodeId);
    }, 100);

    // Restore selection after formatting
    setTimeout(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        restoreSelection(element, start, end);
      } else {
        console.warn("❌ Element not found for selection restoration");
      }
      console.groupEnd();
    }, 0);
  };
}

/**
 * Handle color selection
 */
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

    // Restore selection with a slightly longer delay to allow state update
    setTimeout(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        restoreSelection(element, start, end);
      }
    }, 50);
  };
}

/**
 * Handle font size selection
 */
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

    // Restore selection with a slightly longer delay to allow state update
    setTimeout(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        restoreSelection(element, start, end);
      }
    }, 50);
  };
}

/**
 * Handle type change
 */
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

    // List types should change the entire block, not inline formatting
    if (type === "ol" || type === "li") {
      dispatch(EditorActions.updateNode(nodeId, { type: type }));
      
      setTimeout(() => {
        const element = nodeRefs.current.get(nodeId);
        if (element) {
          restoreSelection(element, start, end);
          handleSelectionChange();
        }
      }, 0);
      return;
    }

    // Apply as inline element type to selected text (or at cursor position)
    // Note: "code" is excluded here - use the code formatting button for inline code
    const elementType = type as
      | "p"
      | "h1"
      | "h2"
      | "h3"
      | "h4"
      | "h5"
      | "h6"
      | "blockquote";
    
    // Skip applying if trying to apply "code" - that should be a block-level change only
    if (type === "code") {
      console.warn("Code element type not supported as inline - use the code formatting button instead");
      return;
    }
    
    dispatch(EditorActions.applyInlineElementType(elementType));

    // Restore selection after state update and trigger re-detection
    setTimeout(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        restoreSelection(element, start, end);
        // Manually trigger selection change detection to update the UI
        handleSelectionChange();
      }
    }, 0);
  };
}
