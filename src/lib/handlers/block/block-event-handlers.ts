/**
 * Block Event Handler Functions
 * 
 * Functions for handling events in Block components
 */

import React from "react";
import { TextNode, ContainerNode } from "../../types";
import { EditorAction } from "../../reducer/actions";
import { findParentById } from "../../utils/tree-operations";

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
  currentContainer: ContainerNode;
  dispatch: React.Dispatch<EditorAction>;
  localRef: React.RefObject<HTMLElement | null>;
  isComposingRef: React.MutableRefObject<boolean>;
  shouldPreserveSelectionRef: React.MutableRefObject<boolean>;
  showCommandMenu: boolean;
  setShowCommandMenu: (show: boolean) => void;
  setCommandMenuAnchor: (el: HTMLElement | null) => void;
}

/**
 * Create handle composition start
 */
export function createHandleCompositionStart() {
  return (isComposingRef: React.MutableRefObject<boolean>) => {
    return () => {
      isComposingRef.current = true;
    };
  };
}

/**
 * Create handle composition end
 */
export function createHandleCompositionEnd() {
  return (isComposingRef: React.MutableRefObject<boolean>) => {
    return () => {
      isComposingRef.current = false;
    };
  };
}

/**
 * Create handle input
 */
export function createHandleInput(params: Pick<BlockEventHandlerParams, 'textNode' | 'readOnly' | 'onInput' | 'onChangeBlockType' | 'showCommandMenu' | 'setShowCommandMenu' | 'setCommandMenuAnchor' | 'shouldPreserveSelectionRef'>) {
  return (e: React.FormEvent<HTMLDivElement>) => {
    const { textNode, readOnly, onInput, onChangeBlockType, showCommandMenu, setShowCommandMenu, setCommandMenuAnchor, shouldPreserveSelectionRef } = params;
    const element = e.currentTarget;
    const text = element.textContent || "";

    // Check if this is a header block (h1) - headers don't show command menu
    const isHeaderBlock = textNode.type === 'h1';

    // Check if the block is empty and user typed "/" (but not for header blocks)
    if (text === "/" && !readOnly && onChangeBlockType && !isHeaderBlock) {
      setShowCommandMenu(true);
      setCommandMenuAnchor(element);
    } else if (showCommandMenu && text !== "/") {
      // Close menu if user continues typing
      setShowCommandMenu(false);
    }

    // Set flag to prevent content updates until next render
    shouldPreserveSelectionRef.current = true;

    // Call the parent onInput handler
    onInput(element);

    // Reset the flag quickly to allow Block component to sync with state
    // Reduced from 200ms since we're no longer debouncing state updates
    setTimeout(() => {
      shouldPreserveSelectionRef.current = false;
    }, 50);
  };
}

/**
 * Create handle key down
 */
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

    // For list items (ul/ol/li), handle Enter and Shift+Enter specially
    // For non-list items, Shift+Enter creates nested blocks
    const isListItem =
      textNode.type === "ul" ||
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

      // Find the parent container
      const parent = findParentById(currentContainer, textNode.id);

      if (parent) {
        // Create a new list item with the same type
        const newListItem: TextNode = {
          id: `li-${Date.now()}`,
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

        // Focus the new list item after a short delay
        setTimeout(() => {
          const newElement = document.querySelector(
            `[data-node-id="${newListItem.id}"]`
          ) as HTMLElement;
          if (newElement) {
            newElement.focus();
          }
        }, 0);
      } else {
        console.warn(
          "🔷 [Block.tsx] Could not find parent container for list item"
        );
      }

      return;
    }

    // Pass to parent handler for other keys
    onKeyDown(e);
  };
}

/**
 * Create handle click
 */
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

/**
 * Create handle command select
 */
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

    // For other block types, just change the type
    if (onChangeBlockType) {
      onChangeBlockType(textNode.id, commandValue);

      // Focus back on the block
      setTimeout(() => {
        localRef.current?.focus();
      }, 0);
    }
  };
}

/**
 * Create handle background color change
 */
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

