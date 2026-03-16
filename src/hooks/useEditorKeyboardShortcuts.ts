/**
 * useEditorKeyboardShortcuts
 *
 * Registers global keyboard shortcuts for the editor:
 *   - Ctrl/Cmd+A  : Select all content in current block
 *   - Ctrl/Cmd+B/I/U/Shift+S/E : Inline formatting
 *   - Ctrl/Cmd+Z  : Undo
 *   - Ctrl/Cmd+Y / Ctrl/Cmd+Shift+Z : Redo
 *   - ArrowUp/Down : Navigate between blocks
 */

import { useEffect } from "react";
import { EditorActions, ContainerNode } from "../lib";
import { findNodeInTree } from "../lib/utils/editor-helpers";

interface UseEditorKeyboardShortcutsParams {
  readOnly: boolean;
  dispatch: (action: any) => void;
  getContainer: () => ContainerNode;
  getActiveNodeId: () => string | null;
  getCanUndo: () => boolean;
  getCanRedo: () => boolean;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  handleFormat: (format: "bold" | "italic" | "underline" | "strikethrough" | "code") => void;
}

export function useEditorKeyboardShortcuts({
  dispatch,
  getContainer,
  getActiveNodeId,
  getCanUndo,
  getCanRedo,
  nodeRefs,
  handleFormat,
}: UseEditorKeyboardShortcutsParams) {
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      const activeElement = document.activeElement;
      const isInEditor = Array.from(nodeRefs.current.values()).some(
        (el) => el === activeElement || el.contains(activeElement)
      );

      // Ctrl+A / Cmd+A - Select all content in current block only
      if (isCtrlOrCmd && e.key === "a" && isInEditor) {
        e.preventDefault();

        const selection = window.getSelection();
        if (!selection) return;

        const currentBlock = activeElement as HTMLElement;
        if (currentBlock && currentBlock.isContentEditable) {
          const range = document.createRange();
          range.selectNodeContents(currentBlock);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      // Ctrl+B / Cmd+B - Toggle Bold
      if (isCtrlOrCmd && e.key === "b" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("bold");
        }
      }

      // Ctrl+I / Cmd+I - Toggle Italic
      if (isCtrlOrCmd && e.key === "i" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("italic");
        }
      }

      // Ctrl+U / Cmd+U - Toggle Underline
      if (isCtrlOrCmd && e.key === "u" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("underline");
        }
      }

      // Ctrl+Shift+S / Cmd+Shift+S - Toggle Strikethrough
      if (isCtrlOrCmd && e.shiftKey && e.key === "S" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("strikethrough");
        }
      }

      // Ctrl+E / Cmd+E - Toggle Code
      if (isCtrlOrCmd && e.key === "e" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("code");
        }
      }

      // Ctrl+Z / Cmd+Z - Undo
      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        if (
          !isInEditor &&
          (activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA")
        ) {
          return;
        }
        e.preventDefault();
        if (getCanUndo()) {
          dispatch(EditorActions.undo());
        }
      }

      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z - Redo
      if (
        (isCtrlOrCmd && e.key === "y") ||
        (isCtrlOrCmd && e.shiftKey && e.key === "Z")
      ) {
        if (
          !isInEditor &&
          (activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA")
        ) {
          return;
        }
        e.preventDefault();
        if (getCanRedo()) {
          dispatch(EditorActions.redo());
        }
      }

      // Arrow Up/Down - Navigate between blocks
      const activeNodeId = getActiveNodeId();
      if (
        (e.key === "ArrowUp" || e.key === "ArrowDown") &&
        isInEditor &&
        activeNodeId
      ) {
        const currentElement = activeElement as HTMLElement;
        const currentNodeId =
          currentElement?.getAttribute("data-node-id") || activeNodeId;

        // Find the current node and its siblings
        const result = findNodeInTree(currentNodeId, getContainer());
        if (!result) return;

        const { siblings } = result;
        const currentIndex = siblings.findIndex((n) => n.id === currentNodeId);
        if (currentIndex === -1) return;

        // ArrowUp: Navigate to previous block
        if (e.key === "ArrowUp" && currentIndex > 0) {
          e.preventDefault();
          const prevNode = siblings[currentIndex - 1];
          dispatch(EditorActions.setActiveNode(prevNode.id));

          // Focus and place cursor at the end of the previous node
          requestAnimationFrame(() => {
            const prevElement = nodeRefs.current.get(prevNode.id);
            if (prevElement) {
              prevElement.focus();
              const range = document.createRange();
              const sel = window.getSelection();

              // Place cursor at the end
              const lastChild =
                prevElement.childNodes[prevElement.childNodes.length - 1];
              if (lastChild?.nodeType === Node.TEXT_NODE) {
                range.setStart(lastChild, lastChild.textContent?.length || 0);
              } else if (lastChild) {
                range.setStartAfter(lastChild);
              } else {
                range.selectNodeContents(prevElement);
              }
              range.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          });
        }

        // ArrowDown: Navigate to next block
        if (e.key === "ArrowDown" && currentIndex < siblings.length - 1) {
          e.preventDefault();
          const nextNode = siblings[currentIndex + 1];
          dispatch(EditorActions.setActiveNode(nextNode.id));

          // Focus and place cursor at the end of the next node
          requestAnimationFrame(() => {
            const nextElement = nodeRefs.current.get(nextNode.id);
            if (nextElement) {
              nextElement.focus();
              const range = document.createRange();
              const sel = window.getSelection();

              // Place cursor at the end
              const lastChild =
                nextElement.childNodes[nextElement.childNodes.length - 1];
              if (lastChild?.nodeType === Node.TEXT_NODE) {
                range.setStart(lastChild, lastChild.textContent?.length || 0);
              } else if (lastChild) {
                range.setStartAfter(lastChild);
              } else {
                range.selectNodeContents(nextElement);
              }
              range.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          });
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
    // Use stable getter functions so the effect captures the latest values
    // without needing to re-register on every render
  }, [
    dispatch,
    getContainer,
    getActiveNodeId,
    getCanUndo,
    getCanRedo,
    nodeRefs,
    handleFormat,
  ]);
}
