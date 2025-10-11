/**
 * Mina Rich Editor - Simple Single Block Editor
 *
 * A minimal editor demonstrating text formatting with our CRUD system.
 * Focus on: Select text → Click format button → Update via reducer
 *
 * REFACTORED VERSION - Now uses shadcn/ui components for beautiful design
 */

"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  useEditor,
  EditorActions,
  type TextNode,
  type EditorNode,
  type EditorState,
  type SelectionInfo,
  hasInlineChildren,
  getNodeTextContent,
  serializeToHtml,
  isTextNode,
  isContainerNode,
  ContainerNode,
  useSelectionManager,
  useSelection,
  findNodeById,
} from "../lib";
import { Block } from "./Block";
import { AddBlockButton } from "./AddBlockButton";
import { CustomClassPopover } from "./CustomClassPopover";
import { LinkPopover } from "./LinkPopover";
import { EditorToolbar } from "./EditorToolbar";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { uploadImage } from "../lib/utils/image-upload";
import { useToast } from "@/hooks/use-toast";
import { Toolbar } from "./Toolbar";

/**
 * Parse DOM element back into inline children structure
 * This preserves formatting when user types in a formatted block
 */
function parseDOMToInlineChildren(element: HTMLElement): TextNode["children"] {
  const children: TextNode["children"] = [];

  const walkNode = (
    node: Node,
    inheritedFormats: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      className?: string;
      elementType?:
        | "p"
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "code"
        | "blockquote";
    } = {}
  ) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Direct text node - use inherited formatting
      const content = node.textContent || "";
      if (content) {
        const hasAnyFormatting =
          inheritedFormats.bold ||
          inheritedFormats.italic ||
          inheritedFormats.underline ||
          inheritedFormats.className ||
          inheritedFormats.elementType;
        if (hasAnyFormatting) {
          children.push({
            content,
            bold: inheritedFormats.bold || undefined,
            italic: inheritedFormats.italic || undefined,
            underline: inheritedFormats.underline || undefined,
            className: inheritedFormats.className || undefined,
            elementType: inheritedFormats.elementType,
          });
        } else {
          children.push({ content });
        }
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const classList = Array.from(el.classList);

      // Detect formatting from classes
      const bold = classList.includes("font-bold");
      const italic = classList.includes("italic");
      const underline = classList.includes("underline");

      // Detect element type from classes
      let elementType:
        | "p"
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "code"
        | "blockquote"
        | undefined = undefined;
      if (classList.some((c) => c.includes("text-4xl"))) {
        elementType = "h1";
      } else if (classList.some((c) => c.includes("text-3xl"))) {
        elementType = "h2";
      } else if (classList.some((c) => c.includes("text-2xl"))) {
        elementType = "h3";
      } else if (classList.some((c) => c.includes("text-xl"))) {
        elementType = "h4";
      } else if (
        classList.some((c) => c.includes("text-lg")) &&
        classList.includes("font-semibold")
      ) {
        elementType = "h5";
      } else if (
        classList.some((c) => c.includes("text-base")) &&
        classList.includes("font-semibold")
      ) {
        elementType = "h6";
      } else if (classList.includes("font-mono")) {
        elementType = "code";
      } else if (classList.includes("border-l-4")) {
        elementType = "blockquote";
      } else if (
        classList.some((c) => c.includes("text-base")) &&
        classList.some((c) => c.includes("leading-relaxed"))
      ) {
        elementType = "p";
      }

      // Extract custom classes (filter out known formatting classes and extra spacing classes)
      const knownClasses = [
        "font-bold",
        "italic",
        "underline",
        "text-5xl",
        "text-4xl",
        "text-3xl",
        "text-2xl",
        "text-xl",
        "text-lg",
        "font-semibold",
        "font-mono",
        "border-l-4",
        "pl-4",
        "text-primary",
        "hover:underline",
        "cursor-pointer",
        "inline-block",
        "pr-1", // italic spacing classes
      ];
      const customClasses = classList.filter((c) => !knownClasses.includes(c));
      const customClassName =
        customClasses.length > 0 ? customClasses.join(" ") : undefined;

      // Merge with inherited formatting
      const currentFormats = {
        bold: bold || inheritedFormats.bold,
        italic: italic || inheritedFormats.italic,
        underline: underline || inheritedFormats.underline,
        className: customClassName || inheritedFormats.className,
        elementType: elementType || inheritedFormats.elementType,
      };

      // If it's a span with formatting, walk its children with inherited formats
      if (el.tagName === "SPAN") {
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNode(node.childNodes[i], currentFormats);
        }
      } else {
        // For other elements (like the main div), just walk children
        for (let i = 0; i < node.childNodes.length; i++) {
          walkNode(node.childNodes[i], inheritedFormats);
        }
      }
    }
  };

  for (let i = 0; i < element.childNodes.length; i++) {
    walkNode(element.childNodes[i]);
  }

  // Filter out empty content
  return children.filter((child) => child.content && child.content.length > 0);
}

/**
 * Detect which formats are active in a given range of a node
 */
function detectFormatsInRange(
  node: TextNode,
  start: number,
  end: number
): {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  elementType?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "code"
    | "blockquote"
    | null;
  href?: string | null;
  className?: string | null;
  styles?: Record<string, string> | null;
} {
  const formats = {
    bold: false,
    italic: false,
    underline: false,
    elementType: null as any,
    href: null as string | null,
    className: null as string | null,
    styles: null as Record<string, string> | null,
  };

  // If node has no children, check node-level attributes
  if (!node.children || node.children.length === 0) {
    return {
      bold: node.attributes?.bold === true,
      italic: node.attributes?.italic === true,
      underline: node.attributes?.underline === true,
      elementType: null,
      href: null,
      className: null,
      styles: null,
    };
  }

  // Node has children array - analyze the range
  let currentPos = 0;
  let hasAnyBold = false;
  let hasAnyItalic = false;
  let hasAnyUnderline = false;
  let allBold = true;
  let allItalic = true;
  let allUnderline = true;
  let charsInRange = 0;
  let firstElementType: typeof formats.elementType = undefined;
  let allSameElementType = true;
  let firstHref: string | undefined = undefined;
  let allSameHref = true;
  let firstClassName: string | undefined = undefined;
  let allSameClassName = true;
  let firstStyles: Record<string, string> | undefined = undefined;
  let allSameStyles = true;

  for (const child of node.children) {
    const childLength = (child.content || "").length;
    const childStart = currentPos;
    const childEnd = currentPos + childLength;

    // Check if this child overlaps with the selection
    const overlaps = childStart < end && childEnd > start;

    if (overlaps) {
      charsInRange += Math.min(childEnd, end) - Math.max(childStart, start);

      if (child.bold) {
        hasAnyBold = true;
      } else {
        allBold = false;
      }

      if (child.italic) {
        hasAnyItalic = true;
      } else {
        allItalic = false;
      }

      if (child.underline) {
        hasAnyUnderline = true;
      } else {
        allUnderline = false;
      }

      // Check element type
      const childElementType = child.elementType || null;
      if (firstElementType === undefined) {
        firstElementType = childElementType;
      } else if (firstElementType !== childElementType) {
        allSameElementType = false;
      }

      // Check href
      const childHref = child.href || null;
      if (firstHref === undefined) {
        firstHref = childHref || undefined;
      } else if (firstHref !== childHref) {
        allSameHref = false;
      }

      // Check className
      const childClassName = child.className || null;
      if (firstClassName === undefined) {
        firstClassName = childClassName || undefined;
      } else if (firstClassName !== childClassName) {
        allSameClassName = false;
      }

      // Check styles
      const childStyles = child.styles || null;
      if (firstStyles === undefined) {
        firstStyles = childStyles || undefined;
      } else if (JSON.stringify(firstStyles) !== JSON.stringify(childStyles)) {
        allSameStyles = false;
      }
    }

    currentPos = childEnd;
  }

  // A format is "active" if ALL selected text has that format
  return {
    bold: charsInRange > 0 && allBold,
    italic: charsInRange > 0 && allItalic,
    underline: charsInRange > 0 && allUnderline,
    elementType: allSameElementType ? firstElementType : null,
    href: allSameHref ? firstHref || null : null,
    className: allSameClassName ? firstClassName || null : null,
    styles: allSameStyles ? firstStyles || null : null,
  };
}

/**
 * Simple Editor Component - Single editable block
 */
interface SimpleEditorProps {
  readOnly?: boolean; // View-only mode - renders content without editing capabilities
  onUploadImage?: (file: File) => Promise<string>; // Custom image upload handler - should return the uploaded image URL
}

export function SimpleEditor({
  readOnly: initialReadOnly = false,
  onUploadImage,
}: SimpleEditorProps = {}) {
  const [state, dispatch] = useEditor();
  const selectionManager = useSelectionManager();
  const { toast } = useToast();
  const lastEnterTime = useRef<number>(0);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const contentUpdateTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);
  const [readOnly, setReadOnly] = useState(initialReadOnly);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [enhanceSpaces, setEnhanceSpaces] = useState(true);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<
    "before" | "after" | "left" | "right" | null
  >(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Get the current container from history
  const container = state.history[state.historyIndex];

  const currentNode = state.activeNodeId
    ? (container.children.find((n) => n.id === state.activeNodeId) as
        | TextNode
        | undefined)
    : (container.children[0] as TextNode | undefined);

  // Debounced dispatch for selection state updates
  const selectionDispatchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track text selection - updates ref immediately, state with debounce
  const handleSelectionChange = React.useCallback(() => {
    const selection = window.getSelection();
    const hasText =
      selection !== null &&
      !selection.isCollapsed &&
      selection.toString().length > 0;

    if (hasText && selection) {
      // NEW APPROACH: Find the actual node by traversing the DOM upwards from the selection
      const range = selection.getRangeAt(0);
      let currentElement: HTMLElement | null = null;
      
      // Start from the selection's common ancestor
      let node: Node | null = range.commonAncestorContainer;
      
      // Walk up the DOM to find the closest element with data-node-id
      while (node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const nodeId = element.getAttribute('data-node-id');
          const nodeType = element.getAttribute('data-node-type');
          
          // We found a text node (not a container)
          if (nodeId && nodeType && nodeType !== 'container') {
            currentElement = element;
            break;
          }
        }
        node = node.parentNode;
      }

      if (!currentElement) {
        // Fallback to old behavior if we can't find via DOM
        const freshCurrentNode = state.activeNodeId
          ? (findNodeById(container, state.activeNodeId) as TextNode | undefined)
          : (container.children[0] as TextNode | undefined);

        if (freshCurrentNode) {
          currentElement = nodeRefs.current.get(freshCurrentNode.id) || null;
        }
      }

      if (currentElement) {
        const actualNodeId = currentElement.getAttribute('data-node-id');
        
        if (actualNodeId) {
          // Find the actual node in the tree (including nested nodes)
          const actualNode = findNodeById(container, actualNodeId) as TextNode | undefined;
          
          console.log('🎯 [handleSelectionChange] Found node:', {
            nodeId: actualNodeId,
            nodeType: actualNode?.type,
            isTextNode: actualNode ? isTextNode(actualNode) : false,
            hasChildren: actualNode && 'children' in actualNode ? actualNode.children?.length : 0,
          });
          
          if (actualNode && isTextNode(actualNode)) {
            const preSelectionRange = range.cloneRange();
            preSelectionRange.selectNodeContents(currentElement);
            preSelectionRange.setEnd(range.startContainer, range.startOffset);
            const start = preSelectionRange.toString().length;
            const end = start + range.toString().length;

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
  }, [
    state.activeNodeId,
    container,
    selectionManager,
    nodeRefs,
    dispatch,
  ]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Helper function to find a node in the tree (including nested containers)
  const findNodeInTree = (
    searchId: string,
    container: ContainerNode
  ): {
    node: EditorNode;
    parentId: string | null;
    siblings: EditorNode[];
  } | null => {
    // Check direct children
    for (let i = 0; i < container.children.length; i++) {
      const child = container.children[i];
      if (child.id === searchId) {
        return {
          node: child,
          parentId: container.id,
          siblings: container.children,
        };
      }
      // If child is a container, search recursively
      if (isContainerNode(child)) {
        const found = findNodeInTree(searchId, child as ContainerNode);
        if (found) return found;
      }
    }
    return null;
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLElement>,
    nodeId: string
  ) => {
    // CRITICAL: Get the actual node ID from the DOM element's data attribute
    // This ensures we get the correct ID for nested list items, not the container's ID
    const actualNodeId =
      (e.currentTarget as HTMLElement).getAttribute("data-node-id") || nodeId;

    console.log("🔵 [SimpleEditor.handleKeyDown] Called", {
      key: e.key,
      shiftKey: e.shiftKey,
      passedNodeId: nodeId,
      actualNodeId,
    });

    if (e.key === "Enter") {
      console.log("🔵 [SimpleEditor] Enter key detected");
      const result = findNodeInTree(actualNodeId, container);
      if (!result || !isTextNode(result.node)) {
        console.log("❌ [SimpleEditor] Node not found or not a text node", {
          searchedId: actualNodeId,
        });
        return;
      }
      const node = result.node as TextNode;
      console.log("🔵 [SimpleEditor] Node found:", {
        id: node.id,
        type: node.type,
      });

      // Shift+Enter: For list items, add a line break within the same item
      // For other blocks, insert a line break within the block
      if (e.shiftKey) {
        console.log("🔍 [Shift+Enter] Detected in SimpleEditor", {
          nodeId: actualNodeId,
          nodeType: node.type,
        });

        // For list items (ul, ol, or li), just insert a line break within the same item
        if (node.type === "ul" || node.type === "ol" || node.type === "li") {
          // preventDefault is already called in Block.tsx
          console.log("🔍 [Shift+Enter] Inserting line break in list item");

          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const br = document.createElement("br");
            range.insertNode(br);
            range.setStartAfter(br);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);

            const element = nodeRefs.current.get(actualNodeId);
            if (element) {
              handleContentChange(actualNodeId, element);
            }
          }
        } else {
          // For non-list items, just insert a line break within the block
          e.preventDefault();
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const br = document.createElement("br");
            range.insertNode(br);
            range.setStartAfter(br);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);

            const element = nodeRefs.current.get(actualNodeId);
            if (element) {
              handleContentChange(actualNodeId, element);
            }
          }
        }

        return;
      }

      e.preventDefault();

      const currentTime = Date.now();
      const timeSinceLastEnter = currentTime - lastEnterTime.current;

      // Get cursor position
      const selection = window.getSelection();
      const element = nodeRefs.current.get(actualNodeId);

      if (!element || !selection) return;

      // Calculate cursor position in text
      let cursorPosition = 0;
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(element);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        cursorPosition = preSelectionRange.toString().length;
      }

      // Get the full text content
      const fullText = getNodeTextContent(node);

      // Check if this is a list item (ul or ol)
      if (node.type === "ul" || node.type === "ol" || node.type === "li") {
        const listType = "li"; // Always create li elements when pressing Enter in a list

        // Split content at cursor position
        const beforeCursor = fullText.substring(0, cursorPosition);
        const afterCursor = fullText.substring(cursorPosition);

        // If the current item is empty (no text before or after cursor), exit the list
        if (!beforeCursor.trim() && !afterCursor.trim()) {
          // Convert to paragraph and exit list
          const newNode: TextNode = {
            id: "p-" + Date.now(),
            type: "p",
            content: "",
            attributes: {},
          };

          dispatch(EditorActions.deleteNode(actualNodeId));
          dispatch(EditorActions.insertNode(newNode, actualNodeId, "after"));
          dispatch(EditorActions.setActiveNode(newNode.id));

          setTimeout(() => {
            const newElement = nodeRefs.current.get(newNode.id);
            if (newElement) {
              newElement.focus();
            }
          }, 10);

          return;
        }

        // Create new list item after current one at the SAME LEVEL

        // Update current node with content before cursor
        dispatch(
          EditorActions.updateNode(actualNodeId, {
            content: beforeCursor,
            children: undefined, // Clear inline formatting when splitting
            lines: undefined, // Clear multiline structure
          })
        );

        // Create new list item with content after cursor, same type as current
        const newNode: TextNode = {
          id: `${listType}-${Date.now()}`,
          type: listType,
          content: afterCursor,
          attributes: {},
        };

        dispatch(EditorActions.insertNode(newNode, actualNodeId, "after"));
        dispatch(EditorActions.setActiveNode(newNode.id));

        lastEnterTime.current = currentTime;

        setTimeout(() => {
          const newElement = nodeRefs.current.get(newNode.id);
          if (newElement) {
            newElement.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            if (newElement.childNodes.length > 0) {
              const firstNode = newElement.childNodes[0];
              range.setStart(firstNode, 0);
              range.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        }, 10);

        return;
      }

      // Regular paragraph/heading - create normal block
      {
        // Split content at cursor position
        const beforeCursor = fullText.substring(0, cursorPosition);
        const afterCursor = fullText.substring(cursorPosition);

        // Check if node has inline children (formatted content)
        const nodeHasInlineChildren = hasInlineChildren(node);

        if (nodeHasInlineChildren && node.children) {
          // Split inline children at cursor position
          let currentPos = 0;
          const beforeChildren: typeof node.children = [];
          const afterChildren: typeof node.children = [];
          let splitDone = false;

          for (const child of node.children) {
            const childLength = (child.content || "").length;
            const childStart = currentPos;
            const childEnd = currentPos + childLength;

            if (splitDone) {
              // Everything after the split goes to the new node
              afterChildren.push({ ...child });
            } else if (cursorPosition <= childStart) {
              // Cursor is before this child - entire child goes to new node
              afterChildren.push({ ...child });
              splitDone = true;
            } else if (cursorPosition >= childEnd) {
              // Cursor is after this child - entire child stays in current node
              beforeChildren.push({ ...child });
            } else {
              // Cursor is in the middle of this child - need to split it
              const offsetInChild = cursorPosition - childStart;

              // Part before cursor stays in current node
              if (offsetInChild > 0) {
                beforeChildren.push({
                  ...child,
                  content: child.content!.substring(0, offsetInChild),
                });
              }

              // Part after cursor goes to new node
              if (offsetInChild < childLength) {
                afterChildren.push({
                  ...child,
                  content: child.content!.substring(offsetInChild),
                });
              }

              splitDone = true;
            }

            currentPos = childEnd;
          }

          // Update current node with children before cursor
          dispatch(
            EditorActions.updateNode(actualNodeId, {
              children: beforeChildren.length > 0 ? beforeChildren : undefined,
              content:
                beforeChildren.length === 0 ? beforeCursor : node.content,
            })
          );

          // Create new node with children after cursor (deep copy with all properties)
          const newNode: TextNode = {
            id: `${node.type}-` + Date.now(),
            type: node.type,
            content: afterChildren.length === 0 ? afterCursor : node.content,
            children: afterChildren.length > 0 ? afterChildren : undefined,
            attributes: { ...node.attributes },
          };

          dispatch(EditorActions.insertNode(newNode, actualNodeId, "after"));
          dispatch(EditorActions.setActiveNode(newNode.id));
        } else {
          // Simple case: no inline children, just plain text
          // Update current node with content before cursor
          dispatch(
            EditorActions.updateNode(actualNodeId, {
              content: beforeCursor,
            })
          );

          // Create new node with content after cursor (deep copy all properties)
          const newNode: TextNode = {
            id: `${node.type}-` + Date.now(),
            type: node.type,
            content: afterCursor,
            attributes: { ...node.attributes },
          };

          dispatch(EditorActions.insertNode(newNode, actualNodeId, "after"));
          dispatch(EditorActions.setActiveNode(newNode.id));
        }

        lastEnterTime.current = currentTime;

        // Focus the new node after a brief delay and place cursor at start
        setTimeout(() => {
          const newElement = nodeRefs.current.get(
            `${node.type}-` + currentTime
          );
          if (newElement) {
            newElement.focus();
            // Place cursor at the start of the new node
            const range = document.createRange();
            const sel = window.getSelection();
            if (newElement.childNodes.length > 0) {
              const firstNode = newElement.childNodes[0];
              range.setStart(firstNode, 0);
              range.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        }, 10);
      }
    } else if (e.key === "Backspace" || e.key === "Delete") {
      const result = findNodeInTree(nodeId, container);
      if (!result || !isTextNode(result.node)) return;

      const node = result.node as TextNode;
      const { siblings } = result;

      const selection = window.getSelection();
      const cursorAtStart =
        selection && selection.anchorOffset === 0 && selection.isCollapsed;

      // Get the full text content (handles both simple content and inline children)
      const fullTextContent = getNodeTextContent(node);
      const isNodeEmpty = !fullTextContent || fullTextContent.trim() === "";

      // If cursor is at the start and node is empty or BR, delete the node
      if ((cursorAtStart && isNodeEmpty) || node.type === "br") {
        e.preventDefault();

        const currentIndex = siblings.findIndex((n) => n.id === nodeId);

        // Don't delete if it's the only node in the container
        if (siblings.length === 1) {
          // Just clear the content instead
          if (hasInlineChildren(node)) {
            dispatch(EditorActions.updateNode(node.id, { children: [] }));
          } else if (node.content) {
            dispatch(EditorActions.updateContent(node.id, ""));
          }
          return;
        }

        // Delete the current node
        dispatch(EditorActions.deleteNode(nodeId));

        // Focus the previous node if it exists, otherwise the next one
        const prevNode = siblings[currentIndex - 1];
        const nextNode = siblings[currentIndex + 1];
        const nodeToFocus = prevNode || nextNode;

        if (nodeToFocus) {
          dispatch(EditorActions.setActiveNode(nodeToFocus.id));
        }
      }
    }
  };

  const handleContentChange = (nodeId: string, element: HTMLElement) => {
    const result = findNodeInTree(nodeId, container);
    if (!result || !isTextNode(result.node)) return;
    const node = result.node as TextNode;

    const newContent = element.textContent || "";

    // Get the current text content (from plain content or inline children)
    const currentContent = getNodeTextContent(node);

    // Only update if content actually changed
    if (newContent !== currentContent) {
      // Clear any existing timer for this node
      const existingTimer = contentUpdateTimers.current.get(nodeId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Debounce the state update - only update after user stops typing for 150ms
      const timer = setTimeout(() => {
        // Auto-detect ordered list pattern: "1. ", "2. ", etc. (only with space)
        const orderedListMatch = newContent.match(/^(\d+)\.\s(.+)$/);

        if (orderedListMatch && node.type === "p") {
          // Convert to list item and remove only the number prefix
          const [_, number, content] = orderedListMatch;

          dispatch(
            EditorActions.updateNode(node.id, {
              type: "li",
              content: content,
            })
          );
        } else if (
          node.type === "li" &&
          (node.lines || newContent.includes("\n"))
        ) {
          // List items with line breaks should always use lines structure
          const textLines = newContent
            .split("\n")
            .filter((line) => line.trim() !== "");

          if (textLines.length > 1) {
            // Multiple lines - use lines structure
            const updatedLines = textLines.map((lineText) => {
              // Remove number prefix if present (e.g., "1. text" -> "text")
              const cleanedText = lineText.replace(/^\d+\.\s*/, "");
              return { content: cleanedText };
            });

            dispatch(
              EditorActions.updateNode(node.id, {
                lines: updatedLines,
                content: undefined, // Clear simple content
                children: undefined, // Clear children
              })
            );
          } else {
            // Single line - use simple content
            dispatch(EditorActions.updateContent(node.id, newContent));
          }
        } else if (!hasInlineChildren(node)) {
          // Simple content node - just update the text
          dispatch(EditorActions.updateContent(node.id, newContent));
        } else {
          // Node has inline children with formatting - parse DOM to preserve formatting
          const parsedChildren = parseDOMToInlineChildren(element);

          dispatch(
            EditorActions.updateNode(node.id, {
              children: parsedChildren,
            })
          );
        }

        // Clean up the timer reference
        contentUpdateTimers.current.delete(nodeId);
      }, 150);

      // Store the timer reference
      contentUpdateTimers.current.set(nodeId, timer);
    }
  };

  // Focus on current node when it changes
  useEffect(() => {
    if (!state.activeNodeId) return;

    const activeId = state.activeNodeId; // Capture in a const to satisfy TypeScript

    // Retry logic to handle async rendering of nested blocks
    const attemptFocus = (retries = 0) => {
      const element = nodeRefs.current.get(activeId);

      if (element && document.activeElement !== element) {
        element.focus();
        // Place cursor at the end of the element
        const range = document.createRange();
        const sel = window.getSelection();
        // if (element.childNodes.length > 0) {
        //   const lastNode = element.childNodes[element.childNodes.length - 1];
        //   const offset = lastNode.textContent?.length || 0;
        //   range.setStart(lastNode, offset);
        // } else {
        //   range.setStart(element, 0);
        // }
        // range.collapse(true);
        // sel?.removeAllRanges();
        // sel?.addRange(range);
      } else if (!element && retries < 10) {
        // Element not ready yet, retry
        setTimeout(() => attemptFocus(retries + 1), 50);
      } else if (!element) {
        console.error(
          "❌ [Focus Failed] Element not found after 10 retries:",
          activeId
        );
      }
    };

    attemptFocus();
  }, [state.activeNodeId]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      // Clear all pending content update timers
      contentUpdateTimers.current.forEach((timer) => clearTimeout(timer));
      contentUpdateTimers.current.clear();
    };
  }, []);

  // Helper to restore selection after formatting
  const restoreSelection = useCallback((
    element: HTMLElement,
    start: number,
    end: number
  ) => {
    const range = document.createRange();
    const sel = window.getSelection();

    let currentPos = 0;
    let startNode: Node | null = null;
    let startOffset = 0;
    let endNode: Node | null = null;
    let endOffset = 0;
    let found = false;

    const walk = (node: Node) => {
      if (found) return;

      if (node.nodeType === Node.TEXT_NODE) {
        const textLength = node.textContent?.length || 0;

        if (!startNode && currentPos + textLength >= start) {
          startNode = node;
          startOffset = start - currentPos;
        }

        if (!endNode && currentPos + textLength >= end) {
          endNode = node;
          endOffset = end - currentPos;
          found = true;
        }

        currentPos += textLength;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let i = 0; i < node.childNodes.length; i++) {
          walk(node.childNodes[i]);
          if (found) break;
        }
      }
    };

    walk(element);

    if (startNode && endNode && sel) {
      try {
        const startLength = (startNode as Text).textContent?.length || 0;
        const endLength = (endNode as Text).textContent?.length || 0;
        range.setStart(startNode, Math.min(startOffset, startLength));
        range.setEnd(endNode, Math.min(endOffset, endLength));
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (e) {
        console.warn("Failed to restore selection:", e);
      }
    }
  }, []);

  // Handle format button clicks - completely state-driven!
  const handleFormat = useCallback((format: "bold" | "italic" | "underline") => {
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
  }, [selectionManager, dispatch, container.children, restoreSelection]);

  // Handle global keyboard shortcuts (Ctrl+A, Ctrl+Z, Ctrl+Y, Ctrl+B, Ctrl+I, Ctrl+U)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Check if we're focused inside the editor
      const activeElement = document.activeElement;
      const isInEditor = Array.from(nodeRefs.current.values()).some(
        (el) => el === activeElement || el.contains(activeElement)
      );

      // Ctrl+A / Cmd+A - Select all content in current block only (requires focus)
      if (isCtrlOrCmd && e.key === "a" && isInEditor) {
        e.preventDefault();

        // Select all content in the current block only
        const selection = window.getSelection();
        if (!selection) return;

        // Find the current block element (the contentEditable element)
        const currentBlock = activeElement as HTMLElement;
        if (currentBlock && currentBlock.isContentEditable) {
          const range = document.createRange();
          range.selectNodeContents(currentBlock);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }

      // Ctrl+B / Cmd+B - Toggle Bold (requires focus and selection)
      if (isCtrlOrCmd && e.key === "b" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("bold");
        }
      }

      // Ctrl+I / Cmd+I - Toggle Italic (requires focus and selection)
      if (isCtrlOrCmd && e.key === "i" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("italic");
        }
      }

      // Ctrl+U / Cmd+U - Toggle Underline (requires focus and selection)
      if (isCtrlOrCmd && e.key === "u" && isInEditor) {
        e.preventDefault();
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          handleFormat("underline");
        }
      }

      // Ctrl+Z / Cmd+Z - Undo (works globally, no focus required)
      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        // Don't interfere with native undo in input fields outside the editor
        if (
          !isInEditor &&
          (activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA")
        ) {
          return;
        }
        e.preventDefault();
        if (state.historyIndex > 0) {
          dispatch(EditorActions.undo());
        }
      }

      // Ctrl+Y / Cmd+Y or Ctrl+Shift+Z - Redo (works globally, no focus required)
      if (
        (isCtrlOrCmd && e.key === "y") ||
        (isCtrlOrCmd && e.shiftKey && e.key === "z")
      ) {
        // Don't interfere with native redo in input fields outside the editor
        if (
          !isInEditor &&
          (activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA")
        ) {
          return;
        }
        e.preventDefault();
        if (state.historyIndex < state.history.length - 1) {
          dispatch(EditorActions.redo());
        }
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [state.historyIndex, state.history.length, dispatch, toast, handleFormat]);


  // Handle color selection
  const handleApplyColor = (color: string) => {
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

  const handleApplyFontSize = (fontSize: string) => {
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

  const handleTypeChange = (type: TextNode["type"]) => {
    if (!currentNode) return;

    // Check if there's a selection (use ref for freshest data)
    const refSelection = selectionManager.getSelection();
    if (refSelection) {
      // Save selection info before dispatch
      const { start, end, nodeId } = refSelection;

      // Apply as inline element type to selected text only
      const elementType = type as
        | "p"
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "code"
        | "blockquote";
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
    } else {
      // No selection - change entire block type (old behavior)
      dispatch(
        EditorActions.updateNode(currentNode.id, {
          type,
        })
      );
    }
  };

  const handleNodeClick = (nodeId: string) => {
    // Don't set container nodes as active - they're not focusable
    // Only text nodes and image nodes can be focused
    const result = findNodeInTree(nodeId, container);
    if (result && isContainerNode(result.node)) {
      // For container nodes, don't set as active
      // The child blocks will handle their own clicks
      return;
    }
    dispatch(EditorActions.setActiveNode(nodeId));
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleMultipleImagesUploadClick = () => {
    multipleFileInputRef.current?.click();
  };

  // Handle creating a list block with header and 1 nested item
  const handleCreateList = (listType: "ul" | "ol") => {
    const timestamp = Date.now();

    // Create a container with a header and 1 nested text block
    const listContainer: ContainerNode = {
      id: `container-${timestamp}`,
      type: "container",
      children: [
        {
          id: `h3-${timestamp}`,
          type: "h3",
          content: "List Title",
          attributes: {},
        } as TextNode,
        {
          id: `li-${timestamp}-1`,
          type: "li",
          content: "First item",
          attributes: {},
        } as TextNode,
      ],
      attributes: {
        listType: listType,
      },
    };

    // Insert the list container at the end
    const lastNode = container.children[container.children.length - 1];
    if (lastNode) {
      dispatch(EditorActions.insertNode(listContainer, lastNode.id, "after"));
    } else {
      // If no nodes exist, replace the container
      dispatch(
        EditorActions.replaceContainer({
          ...container,
          children: [listContainer],
        })
      );
    }

    const listTypeLabel = listType === "ol" ? "ordered" : "unordered";
    toast({
      title: "List Created",
      description: `Added a new ${listTypeLabel} list with header and 3 items`,
    });

    // Smooth scroll to the newly created list
    setTimeout(() => {
      // Find the last element in the editor (the newly created list container)
      const editorContent = editorContentRef.current;
      if (editorContent) {
        const lastChild = editorContent.querySelector(
          "[data-editor-content]"
        )?.lastElementChild;
        if (lastChild) {
          lastChild.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      }
    }, 150);
  };

  const handleCreateLink = () => {
    const timestamp = Date.now();

    // Create a paragraph with a link
    const linkNode: TextNode = {
      id: `p-${timestamp}`,
      type: "p",
      children: [
        {
          content: "www.text.com",
          href: "https://www.text.com",
        },
      ],
      attributes: {},
    };

    // Insert the link node at the end
    const lastNode = container.children[container.children.length - 1];
    if (lastNode) {
      dispatch(EditorActions.insertNode(linkNode, lastNode.id, "after"));
    } else {
      // If no nodes exist, replace the container
      dispatch(
        EditorActions.replaceContainer({
          ...container,
          children: [linkNode],
        })
      );
    }

    toast({
      title: "Link Created",
      description: "Added a new link element",
    });

    // Smooth scroll to the newly created link
    setTimeout(() => {
      const editorContent = editorContentRef.current;
      if (editorContent) {
        const lastChild = editorContent.querySelector(
          "[data-editor-content]"
        )?.lastElementChild;
        if (lastChild) {
          lastChild.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }
      }
    }, 150);
  };

  const handleImageDragStart = (nodeId: string) => {
    setDraggingNodeId(nodeId);
  };

  const handleBlockDragStart = (nodeId: string) => {
    setDraggingNodeId(nodeId);
  };

  const handleDragEnter = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we're dragging an existing block (image) or files from outside
    const draggedNodeId = e.dataTransfer.getData("text/plain");

    // Don't show drop indicator if we're hovering over the dragged element itself
    if (draggingNodeId === nodeId) {
      e.dataTransfer.dropEffect = "none";
      setDragOverNodeId(null);
      setDropPosition(null);
      return;
    }

    // Helper to find a node (could be at root or inside a container)
    const findNodeAnywhere = (
      id: string
    ): { node: EditorNode; parentId?: string } | null => {
      // Check root level
      const rootNode = container.children.find((n) => n.id === id);
      if (rootNode) return { node: rootNode };

      // Check inside containers
      for (const child of container.children) {
        if (isContainerNode(child)) {
          const containerNode = child as ContainerNode;
          const foundInContainer = containerNode.children.find(
            (c) => c.id === id
          );
          if (foundInContainer)
            return { node: foundInContainer, parentId: child.id };
        }
      }
      return null;
    };

    const targetResult = findNodeAnywhere(nodeId);
    const draggingResult = draggingNodeId
      ? findNodeAnywhere(draggingNodeId)
      : null;

    if (!targetResult) return;

    const targetNode = targetResult.node;
    const draggingNode = draggingResult?.node;
    const isTargetImage =
      isTextNode(targetNode) && (targetNode as TextNode).type === "img";
    const isDraggingImage =
      draggingNode &&
      isTextNode(draggingNode) &&
      (draggingNode as TextNode).type === "img";

    // Check if target and dragging nodes are in the same flex container
    const inSameFlexContainer =
      targetResult.parentId &&
      draggingResult?.parentId &&
      targetResult.parentId === draggingResult.parentId;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // If both are images, check for horizontal (left/right) drop zones
    if (isTargetImage && isDraggingImage) {
      const edgeThreshold = rect.width * 0.3; // 30% from each edge

      // If in same flex container, allow reordering via horizontal drop
      if (inSameFlexContainer) {
        // Get the parent container to check positions
        const parent = draggingResult?.parentId
          ? (container.children.find(
              (c) => c.id === draggingResult.parentId
            ) as ContainerNode)
          : null;

        if (parent) {
          const dragIndex = parent.children.findIndex(
            (c) => c.id === draggingNodeId
          );
          const targetIndex = parent.children.findIndex((c) => c.id === nodeId);

          // Check if we're on the left edge
          if (e.clientX < rect.left + edgeThreshold) {
            // Prevent dropping to the left of the item immediately to our right
            if (targetIndex === dragIndex + 1) {
              e.dataTransfer.dropEffect = "none";
              setDragOverNodeId(null);
              setDropPosition(null);
              return;
            }
            setDragOverNodeId(nodeId);
            setDropPosition("left");
            e.dataTransfer.dropEffect = "move";
            return;
          }
          // Check if we're on the right edge
          else if (e.clientX > rect.right - edgeThreshold) {
            // Prevent dropping to the right of the item immediately to our left
            if (targetIndex === dragIndex - 1) {
              e.dataTransfer.dropEffect = "none";
              setDragOverNodeId(null);
              setDropPosition(null);
              return;
            }
            setDragOverNodeId(nodeId);
            setDropPosition("right");
            e.dataTransfer.dropEffect = "move";
            return;
          }
        }
        // If we're in the middle of an item in the same flex container, no drop
        e.dataTransfer.dropEffect = "none";
        setDragOverNodeId(null);
        setDropPosition(null);
        return;
      } else {
        // Not in same container - allow horizontal merge
        if (e.clientX < rect.left + edgeThreshold) {
          setDragOverNodeId(nodeId);
          setDropPosition("left");
          e.dataTransfer.dropEffect = "move";
          return;
        } else if (e.clientX > rect.right - edgeThreshold) {
          setDragOverNodeId(nodeId);
          setDropPosition("right");
          e.dataTransfer.dropEffect = "move";
          return;
        }
      }
    }

    // Default vertical drop logic
    const midPoint = rect.top + rect.height / 2;
    const position = e.clientY < midPoint ? "before" : "after";

    // If dragging an existing block, check if this would result in no movement
    if (draggingNodeId) {
      // Find the indices of the dragged node and target node
      const draggedIndex = container.children.findIndex(
        (n) => n.id === draggingNodeId
      );
      const targetIndex = container.children.findIndex((n) => n.id === nodeId);

      // Don't allow drops that would result in no movement:
      // - Dropping "after" on the previous block (would stay in same position)
      // - Dropping "before" on the next block (would stay in same position)
      if (
        (position === "after" && targetIndex === draggedIndex - 1) ||
        (position === "before" && targetIndex === draggedIndex + 1)
      ) {
        e.dataTransfer.dropEffect = "none";
        setDragOverNodeId(null);
        setDropPosition(null);
        return;
      }
    }

    // Allow drop - this is required for drop to work
    // Use "move" for existing blocks, "copy" for external files
    e.dataTransfer.dropEffect =
      draggedNodeId || draggingNodeId ? "move" : "copy";

    setDragOverNodeId(nodeId);
    setDropPosition(position);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only clear if we're actually leaving the element (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    if (!currentTarget.contains(relatedTarget)) {
      setDragOverNodeId(null);
      setDropPosition(null);
    } else {
    }
  };

  const handleDrop = async (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if we're moving an existing image block
    const draggedNodeId = e.dataTransfer.getData("text/plain");

    if (draggedNodeId && draggingNodeId) {
      // Moving an existing image

      // Don't drop on itself
      if (draggingNodeId === nodeId) {
        setDragOverNodeId(null);
        setDropPosition(null);
        setDraggingNodeId(null);
        return;
      }

      // Helper to find a node anywhere (root or in container)
      const findNodeAnywhere = (
        id: string
      ): {
        node: EditorNode;
        parentId?: string;
        parent?: ContainerNode;
      } | null => {
        const rootNode = container.children.find((n) => n.id === id);
        if (rootNode) return { node: rootNode };

        for (const child of container.children) {
          if (isContainerNode(child)) {
            const containerNode = child as ContainerNode;
            const foundInContainer = containerNode.children.find(
              (c) => c.id === id
            );
            if (foundInContainer)
              return {
                node: foundInContainer,
                parentId: child.id,
                parent: containerNode,
              };
          }
        }
        return null;
      };

      const draggingResult = findNodeAnywhere(draggingNodeId);
      const targetResult = findNodeAnywhere(nodeId);

      if (!draggingResult || !targetResult) {
        setDragOverNodeId(null);
        setDropPosition(null);
        setDraggingNodeId(null);
        return;
      }

      const draggingNode = draggingResult.node;
      const targetNode = targetResult.node;
      const inSameFlexContainer =
        draggingResult.parentId &&
        targetResult.parentId &&
        draggingResult.parentId === targetResult.parentId;

      // Check if this is a horizontal drop (left/right)
      if (dropPosition === "left" || dropPosition === "right") {
        // Case 1: Reordering images within the same flex container
        if (
          inSameFlexContainer &&
          draggingResult.parent &&
          targetResult.parent
        ) {
          console.log("🔄 Reordering images within flex container");
          const parent = draggingResult.parent;
          const newChildren = [...parent.children];

          const dragIndex = newChildren.findIndex(
            (c) => c.id === draggingNodeId
          );
          const targetIndex = newChildren.findIndex((c) => c.id === nodeId);

          // Remove the dragged item from its current position
          const [draggedItem] = newChildren.splice(dragIndex, 1);

          // Calculate the new target index after removal
          const adjustedTargetIndex =
            dragIndex < targetIndex ? targetIndex - 1 : targetIndex;

          // Insert at the correct position based on drop side
          if (dropPosition === "left") {
            newChildren.splice(adjustedTargetIndex, 0, draggedItem);
          } else {
            // "right"
            newChildren.splice(adjustedTargetIndex + 1, 0, draggedItem);
          }

          // Update the container with new order (single action for history)
          dispatch(
            EditorActions.updateNode(parent.id, {
              children: newChildren as any,
            })
          );

          toast({
            title: "Image repositioned!",
            description: "Image order updated in flex layout",
          });

          setDragOverNodeId(null);
          setDropPosition(null);
          setDraggingNodeId(null);
          return;
        }

        // Case 2: Merging two separate images into a flex container (or adding to existing one)
        if (isTextNode(draggingNode) && isTextNode(targetNode)) {
          console.log("🔗 Merging images into flex container");

          // If one of them is already in a flex container, add the dragged one to it
          if (
            draggingResult.parentId &&
            draggingResult.parent?.attributes?.layoutType === "flex"
          ) {
            // Dragging node is in a flex container, extract it and merge with target
            console.log("📤 Extracting from flex container to merge");
          } else if (
            targetResult.parentId &&
            targetResult.parent?.attributes?.layoutType === "flex"
          ) {
            // Target is in flex container, add dragged node to it
            console.log("📥 Adding to existing flex container");
            const parent = targetResult.parent;
            const targetIndex = parent.children.findIndex(
              (c) => c.id === nodeId
            );
            const newChildren = [...parent.children];

            // Insert dragged node at the appropriate position
            if (dropPosition === "left") {
              newChildren.splice(targetIndex, 0, draggingNode as TextNode);
            } else {
              newChildren.splice(targetIndex + 1, 0, draggingNode as TextNode);
            }

            // Batch: delete from old location and update container (single history entry)
            dispatch(
              EditorActions.batch([
                EditorActions.deleteNode(draggingNodeId),
                EditorActions.updateNode(parent.id, {
                  children: newChildren as any,
                }),
              ])
            );

            toast({
              title: "Image added!",
              description: "Image added to the flex layout",
            });

            setDragOverNodeId(null);
            setDropPosition(null);
            setDraggingNodeId(null);
            return;
          }

          // Neither is in a flex container - create a new one
          console.log("🆕 Creating new flex container");

          // Find reference nodes at root level
          const targetRootIndex = container.children.findIndex(
            (n) =>
              n.id === nodeId ||
              (isContainerNode(n) &&
                (n as ContainerNode).children.some((c) => c.id === nodeId))
          );
          const draggingRootIndex = container.children.findIndex(
            (n) =>
              n.id === draggingNodeId ||
              (isContainerNode(n) &&
                (n as ContainerNode).children.some(
                  (c) => c.id === draggingNodeId
                ))
          );

          // Find a stable reference node for insertion
          let referenceNodeId: string | null = null;
          let insertPosition: "before" | "after" = "after";

          const firstIndex = Math.min(targetRootIndex, draggingRootIndex);
          if (firstIndex > 0) {
            referenceNodeId = container.children[firstIndex - 1].id;
            insertPosition = "after";
          } else if (container.children.length > 2) {
            for (let i = 0; i < container.children.length; i++) {
              if (i !== targetRootIndex && i !== draggingRootIndex) {
                referenceNodeId = container.children[i].id;
                insertPosition = i < firstIndex ? "after" : "before";
                break;
              }
            }
          }

          // Create a flex container with both images
          const timestamp = Date.now();
          const flexContainer: ContainerNode = {
            id: `flex-container-${timestamp}`,
            type: "container",
            children:
              dropPosition === "left"
                ? [draggingNode as TextNode, targetNode as TextNode]
                : [targetNode as TextNode, draggingNode as TextNode],
            attributes: {
              layoutType: "flex",
              gap: "4",
            },
          };

          // Batch: delete both images and insert flex container (single history entry)
          const actions: any[] = [
            EditorActions.deleteNode(draggingNodeId),
            EditorActions.deleteNode(nodeId),
          ];

          if (referenceNodeId) {
            actions.push(
              EditorActions.insertNode(
                flexContainer,
                referenceNodeId,
                insertPosition
              )
            );
          } else {
            actions.push(
              EditorActions.replaceContainer({
                ...container,
                children: [flexContainer],
              })
            );
          }

          dispatch(EditorActions.batch(actions));

          toast({
            title: "Images merged!",
            description: "Images placed side by side in a flex layout",
          });

          setDragOverNodeId(null);
          setDropPosition(null);
          setDraggingNodeId(null);
          return;
        }
      }

      // Vertical drop - extract from container or move at root level
      console.log("⬇️ Vertical drop");

      // If the dragging node is in a flex container, we need to extract it
      if (draggingResult.parentId && draggingResult.parent) {
        console.log("📤 Extracting from flex container");
        const parent = draggingResult.parent;
        const remainingChildren = parent.children.filter(
          (c) => c.id !== draggingNodeId
        );
        const insertPos =
          dropPosition === "before" || dropPosition === "after"
            ? dropPosition
            : "after";

        // Batch all actions for single history entry
        const actions: any[] = [EditorActions.deleteNode(draggingNodeId)];

        // If only one child remains, unwrap the container
        if (remainingChildren.length === 1) {
          console.log("🎁 Unwrapping single remaining child");
          actions.push(EditorActions.deleteNode(parent.id));

          // Find where to insert the remaining child
          const parentIndex = container.children.findIndex(
            (c) => c.id === parent.id
          );
          if (parentIndex > 0) {
            const prevNode = container.children[parentIndex - 1];
            actions.push(
              EditorActions.insertNode(
                remainingChildren[0],
                prevNode.id,
                "after"
              )
            );
          } else if (parentIndex === 0 && container.children.length > 1) {
            const nextNode = container.children[1];
            actions.push(
              EditorActions.insertNode(
                remainingChildren[0],
                nextNode.id,
                "before"
              )
            );
          }
        }

        // Insert dragged node at new position
        actions.push(EditorActions.insertNode(draggingNode, nodeId, insertPos));
        actions.push(EditorActions.setActiveNode(draggingNodeId));

        dispatch(EditorActions.batch(actions));

        toast({
          title: "Image moved!",
          description: "Image extracted and repositioned",
        });

        setDragOverNodeId(null);
        setDropPosition(null);
        setDraggingNodeId(null);
        return;
      }

      // Standard move at root level
      const draggingNodeAtRoot = container.children.find(
        (n) => n.id === draggingNodeId
      );
      if (draggingNodeAtRoot) {
        const targetNodeAtRoot = container.children.find((n) => n.id === nodeId);
        
        // Check if both are at root level and not images - use swap for blocks
        const isDraggingImage = isTextNode(draggingNode) && (draggingNode as TextNode).type === 'img';
        const isTargetImage = targetNodeAtRoot && isTextNode(targetNodeAtRoot) && (targetNodeAtRoot as TextNode).type === 'img';
        
        // Use swap for non-image blocks, use move for images
        if (!isDraggingImage && !isTargetImage && targetNodeAtRoot) {
          dispatch(EditorActions.swapNodes(draggingNodeId, nodeId));
          dispatch(EditorActions.setActiveNode(draggingNodeId));

          toast({
            title: "Blocks swapped!",
            description: "Block positions exchanged",
          });
        } else {
          // Convert dropPosition to valid InsertPosition
          const insertPos =
            dropPosition === "before" || dropPosition === "after"
              ? dropPosition
              : "after";

          dispatch(EditorActions.moveNode(draggingNodeId, nodeId, insertPos));
          dispatch(EditorActions.setActiveNode(draggingNodeId));

          toast({
            title: isDraggingImage ? "Image moved!" : "Block moved!",
            description: `${isDraggingImage ? 'Image' : 'Block'} repositioned ${dropPosition} the block`,
          });
        }
      }

      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
      return;
    }

    // Otherwise, handle file upload

    // Try to get files from dataTransfer
    let files: File[] = [];

    if (e.dataTransfer.items) {
      // Use DataTransferItemList interface
      const items = Array.from(e.dataTransfer.items);
      files = items
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null);
    } else {
      // Use DataTransferList interface
      files = Array.from(e.dataTransfer.files);
    }

    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (!imageFile) {
      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
      return;
    }

    setIsUploading(true);

    try {
      // Use custom upload handler if provided, otherwise use default
      let imageUrl: string;

      if (onUploadImage) {
        imageUrl = await onUploadImage(imageFile);
      } else {
        const result = await uploadImage(imageFile);
        if (!result.success || !result.url) {
          throw new Error(result.error || "Upload failed");
        }
        imageUrl = result.url;
      }

      const imageNode: TextNode = {
        id: "img-" + Date.now(),
        type: "img",
        content: "", // Optional caption
        attributes: {
          src: imageUrl,
          alt: imageFile.name,
        },
      };

      // Insert at the determined position
      // Convert dropPosition to valid InsertPosition
      const insertPos =
        dropPosition === "before" || dropPosition === "after"
          ? dropPosition
          : "after";

      dispatch(EditorActions.insertNode(imageNode, nodeId, insertPos));
      dispatch(EditorActions.setActiveNode(imageNode.id));

      toast({
        title: "Image uploaded!",
        description: `Image placed ${dropPosition} the block`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload image. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setDragOverNodeId(null);
      setDropPosition(null);
      setDraggingNodeId(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Use custom upload handler if provided, otherwise use default
      let imageUrl: string;

      if (onUploadImage) {
        imageUrl = await onUploadImage(file);
      } else {
        const result = await uploadImage(file);
        if (!result.success || !result.url) {
          throw new Error(result.error || "Upload failed");
        }
        imageUrl = result.url;
      }

      // Create new image node
      const imageNode: TextNode = {
        id: "img-" + Date.now(),
        type: "img",
        content: "", // Optional caption
        attributes: {
          src: imageUrl,
          alt: file.name,
        },
      };

      // Insert image after current node or at end
      const targetId =
        state.activeNodeId ||
        container.children[container.children.length - 1]?.id;
      if (targetId) {
        dispatch(EditorActions.insertNode(imageNode, targetId, "after"));
      } else {
        dispatch(EditorActions.insertNode(imageNode, container.id, "append"));
      }

      toast({
        title: "Image uploaded",
        description: "Your image has been added to the editor.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleMultipleFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // Upload all images
      const uploadPromises = files.map(async (file) => {
        if (onUploadImage) {
          return await onUploadImage(file);
        } else {
          const result = await uploadImage(file);
          if (!result.success || !result.url) {
            throw new Error(result.error || "Upload failed");
          }
          return result.url;
        }
      });

      const imageUrls = await Promise.all(uploadPromises);

      // Create image nodes
      const timestamp = Date.now();
      const imageNodes: TextNode[] = imageUrls.map((url, index) => ({
        id: `img-${timestamp}-${index}`,
        type: "img",
        content: "",
        attributes: {
          src: url,
          alt: files[index].name,
        },
      }));

      // Create flex container with images
      const flexContainer: ContainerNode = {
        id: `flex-container-${timestamp}`,
        type: "container",
        children: imageNodes,
        attributes: {
          layoutType: "flex",
          gap: "4",
          flexWrap: "wrap", // Enable wrapping
        },
      };

      // Insert the flex container after current node or at end
      const targetId =
        state.activeNodeId ||
        container.children[container.children.length - 1]?.id;
      if (targetId) {
        dispatch(EditorActions.insertNode(flexContainer, targetId, "after"));
      } else {
        dispatch(
          EditorActions.insertNode(flexContainer, container.id, "append")
        );
      }

      toast({
        title: "Images uploaded",
        description: `${imageUrls.length} images added in a flex layout.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    console.log("🗑️ Attempting to delete node:", nodeId);
    console.log(
      "📦 Current container children:",
      container.children.map((c) => ({ id: c.id, type: c.type }))
    );

    // Check if the node is inside a flex container
    const parentContainer = container.children.find(
      (child) =>
        isContainerNode(child) &&
        (child as ContainerNode).children.some((c) => c.id === nodeId)
    );

    if (parentContainer) {
      console.log("📦 Node is inside container:", parentContainer.id);
      const containerNode = parentContainer as ContainerNode;
      const remainingChildren = containerNode.children.filter(
        (c) => c.id !== nodeId
      );

      console.log("👶 Remaining children:", remainingChildren.length);

      // If only one child left, unwrap it from the container
      if (remainingChildren.length === 1) {
        console.log("🎁 Unwrapping single child from container");

        // Batch: delete container and insert remaining child (single history entry)
        const containerIndex = container.children.findIndex(
          (c) => c.id === parentContainer.id
        );
        const actions: any[] = [EditorActions.deleteNode(parentContainer.id)];

        if (containerIndex > 0) {
          const prevNode = container.children[containerIndex - 1];
          actions.push(
            EditorActions.insertNode(remainingChildren[0], prevNode.id, "after")
          );
        } else if (containerIndex === 0 && container.children.length > 1) {
          const nextNode = container.children[1];
          actions.push(
            EditorActions.insertNode(
              remainingChildren[0],
              nextNode.id,
              "before"
            )
          );
        }

        dispatch(EditorActions.batch(actions));
      } else if (remainingChildren.length === 0) {
        console.log("🧹 No children left, deleting container");
        // No children left, delete the container
        dispatch(EditorActions.deleteNode(parentContainer.id));
      } else {
        console.log("✂️ Removing child from container");
        // Multiple children remain, just remove this one
        dispatch(EditorActions.deleteNode(nodeId));
      }
    } else {
      console.log("📄 Node is at root level, deleting directly");
      dispatch(EditorActions.deleteNode(nodeId));
    }

    toast({
      title: "Image removed",
      description: "The image has been deleted.",
    });
  };

  const handleChangeBlockType = (nodeId: string, newType: string) => {
    // Special handling for list items - initialize with empty content
    if (newType === "li") {
      dispatch(
        EditorActions.updateNode(nodeId, {
          type: newType as any,
          content: "",
        })
      );
    } else {
      dispatch(EditorActions.updateNode(nodeId, { type: newType as any }));
    }

    // Focus the updated node after a brief delay
    setTimeout(() => {
      const element = nodeRefs.current.get(nodeId);
      if (element) {
        element.focus();
      }
    }, 50);
  };

  const handleInsertImageFromCommand = (nodeId: string) => {
    // Delete the current empty block
    dispatch(EditorActions.deleteNode(nodeId));

    // Trigger the file input
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  // Handle creating a list from command menu (ol or ul)
  const handleCreateListFromCommand = (nodeId: string, listType: string) => {
    const timestamp = Date.now();
    const firstItemId = `li-${timestamp}-1`;

    // Create a container with 1 list item (always "li", regardless of ul/ol)
    // The container's attributes will store whether it's ul or ol
    const listContainer: ContainerNode = {
      id: `container-${timestamp}`,
      type: "container",
      attributes: {
        listType: listType, // Store 'ul' or 'ol' in the container attributes
      },
      children: [
        {
          id: firstItemId,
          type: "li",
          content: "",
          attributes: {},
        } as TextNode,
      ],
    };

    // Insert the list container after the current node, then delete the current node
    dispatch(EditorActions.insertNode(listContainer, nodeId, "after"));
    dispatch(EditorActions.deleteNode(nodeId));

    const listTypeLabel = listType === "ol" ? "numbered" : "bulleted";
    toast({
      title: "List Created",
      description: `Created a ${listTypeLabel} list with 3 items`,
    });

    // Focus the first item after a longer delay to ensure nested elements are registered
    // Nested elements take longer to mount and register their refs
    setTimeout(() => {
      const element = nodeRefs.current.get(firstItemId);
      if (element) {
        element.focus();
        // Also set it as active node
        dispatch(EditorActions.setActiveNode(firstItemId));
      } else {
        console.warn(
          "⚠️ [Focus Warning] First list item not found yet, retrying..."
        );
        // Retry after another delay
        setTimeout(() => {
          const retryElement = nodeRefs.current.get(firstItemId);
          if (retryElement) {
            retryElement.focus();
            dispatch(EditorActions.setActiveNode(firstItemId));
          }
        }, 100);
      }
    }, 150);
  };

  const handleAddBlock = (
    targetId: string,
    position: "before" | "after" = "after"
  ) => {
    // Create new paragraph node
    const newNode: TextNode = {
      id: "p-" + Date.now(),
      type: "p",
      content: "",
      attributes: {},
    };

    console.log("newNode", newNode);
    dispatch(EditorActions.insertNode(newNode, targetId, position));
    dispatch(EditorActions.setActiveNode(newNode.id));

    // Focus the new node after a brief delay
    setTimeout(() => {
      const newElement = nodeRefs.current.get(newNode.id);
      if (newElement) {
        newElement.focus();
      }
    }, 50);
  };

  // Initialize with an empty paragraph block if needed
  useEffect(() => {
    // Only run once on mount, check if we need to add an initial block
    if (container.children.length === 0) {
      const newNode: TextNode = {
        id: "p-" + Date.now(),
        type: "p",
        content: "",
        attributes: {},
      };

      console.log("Creating initial empty paragraph", newNode);
      // Use 'append' position to add to the root container directly
      dispatch(EditorActions.insertNode(newNode, container.id, "append"));
      dispatch(EditorActions.setActiveNode(newNode.id));
    }
  }, []); // Empty dependency array - only run once on mount

  const handleCreateNested = (nodeId: string) => {
    const result = findNodeInTree(nodeId, container);
    if (!result) return;

    const { node, parentId } = result;

    // If the node is inside a nested container (not root), we need to handle it differently
    // We only allow 1 level of nesting, so if we're already nested, add to the parent container
    const isAlreadyNested = parentId !== container.id;

    if (isAlreadyNested) {
      // We're inside a nested container, so just add a new paragraph to the parent container
      const newParagraph: TextNode = {
        id: "p-" + Date.now(),
        type: "p",
        content: "",
        attributes: {},
      };

      // Insert after the current node within the parent container
      dispatch(EditorActions.insertNode(newParagraph, nodeId, "after"));
      dispatch(EditorActions.setActiveNode(newParagraph.id));

      // Focus is handled by the useEffect watching state.activeNodeId
      return;
    }

    // Node is at root level, create a nested container
    if (!isTextNode(node)) return;
    const textNode = node as TextNode;

    // Create the new paragraph that will be focused
    const newParagraphId = "p-" + Date.now();
    const newParagraph: TextNode = {
      id: newParagraphId,
      type: "p",
      content: "",
      attributes: {},
    };

    // Create a nested container with the current node inside it
    const nestedContainer: ContainerNode = {
      id: "container-" + Date.now(),
      type: "container",
      children: [
        // Copy the current node
        { ...textNode },
        // Add a new empty paragraph inside the nested container
        newParagraph,
      ],
      attributes: {},
    };

    // Delete the original node
    dispatch(EditorActions.deleteNode(nodeId));

    // Insert the nested container in its place
    // Since we deleted the node, we insert after the previous node or prepend to container
    const nodeIndex = container.children.findIndex((n) => n.id === nodeId);
    if (nodeIndex > 0) {
      const previousNode = container.children[nodeIndex - 1];
      dispatch(
        EditorActions.insertNode(nestedContainer, previousNode.id, "after")
      );
    } else {
      dispatch(
        EditorActions.insertNode(nestedContainer, container.id, "prepend")
      );
    }

    // Set the new paragraph as active
    dispatch(EditorActions.setActiveNode(newParagraphId));

    toast({
      title: "Nested block created",
      description:
        "Press Shift+Enter again to add more blocks in this container",
    });

    // Focus is handled by the useEffect watching state.activeNodeId
  };

  const handleCopyHtml = async () => {
    let html = serializeToHtml(container);

    // Wrap with spacing classes if enhance spaces is enabled
    if (enhanceSpaces) {
      html = `<div class="[&>*]:my-3 [&_*]:my-5">\n${html}\n</div>`;
    }

    try {
      await navigator.clipboard.writeText(html);
      setCopiedHtml(true);
      toast({
        title: "HTML copied!",
        description: "HTML code has been copied to clipboard.",
      });
      setTimeout(() => setCopiedHtml(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy HTML to clipboard.",
      });
    }
  };

  const handleCopyJson = async () => {
    const json = JSON.stringify(container.children, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopiedJson(true);
      toast({
        title: "JSON copied!",
        description: "JSON data has been copied to clipboard.",
      });
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Failed to copy JSON to clipboard.",
      });
    }
  };

  return (
    <div className="bg-background transition-colors flex flex-col flex-1 duration-300">
      {/* Editor with integrated toolbar */}
      <div className="mx-auto flex flex-col flex-1 w-full">
        <Toolbar readOnly={readOnly} onReadOnlyChange={setReadOnly} />
        <Card className="shadow-2xl flex flex-col flex-1 pt-0 rounded-none border-2 gap-3 transition-all duration-300">
          {/* Toolbar - hidden in readOnly mode */}
          {!readOnly && (
            <EditorToolbar
              currentNode={currentNode}
              currentSelection={state.currentSelection}
              selectedColor={selectedColor}
              isUploading={isUploading}
              enhanceSpaces={enhanceSpaces}
              copiedHtml={copiedHtml}
              copiedJson={copiedJson}
              container={container}
              onTypeChange={handleTypeChange}
              onFormat={handleFormat}
              onColorSelect={handleApplyColor}
              onFontSizeSelect={handleApplyFontSize}
              onImageUploadClick={handleImageUploadClick}
              onMultipleImagesUploadClick={handleMultipleImagesUploadClick}
              onCreateList={handleCreateList}
              onCreateLink={handleCreateLink}
              onCopyHtml={handleCopyHtml}
              onCopyJson={handleCopyJson}
              onEnhanceSpacesChange={setEnhanceSpaces}
            />
          )}

          {/* Hidden file inputs for image uploads */}
          {!readOnly && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={multipleFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleFilesChange}
                className="hidden"
              />
            </>
          )}

          {/* Editor Content */}
          <CardContent
            className={`p-3 md:p-6 flex flex-col w-full flex-1 transition-all duration-300 max-w-4xl mx-auto ${
              readOnly ? "py-10 md:py-14 lg:py-20" : ""
            }`}
          >
            <div ref={editorContentRef}>
              <div data-editor-content>
                {container.children.map((node, index) => {
                  // Support both TextNode and ContainerNode
                  const isText = isTextNode(node);
                  const textNode = isText ? (node as TextNode) : null;

                  const hasChildren =
                    textNode &&
                    Array.isArray(textNode.children) &&
                    textNode.children.length > 0;
                  // Use a composite key that changes when structure changes
                  const nodeKey = hasChildren
                    ? `${node.id}-children-${textNode?.children?.length}`
                    : `${node.id}-content`;

                  const isFirstBlock = index === 0;

                  return (
                    <React.Fragment key={nodeKey}>
                      {/* Add block button before first block */}
                      {!readOnly && isFirstBlock && (
                        <AddBlockButton
                          onAdd={() => handleAddBlock(node.id, "before")}
                          position="before"
                        />
                      )}

                      <div
                        onDragEnter={(e) => handleDragEnter(e, node.id)}
                        onDragOver={(e) => handleDragOver(e, node.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, node.id)}
                        className={`
                        relative transition-all
                        ${
                          dragOverNodeId === node.id &&
                          dropPosition === "before" &&
                          draggingNodeId !== node.id
                            ? "before:absolute before:inset-x-0 before:-top-1 before:h-1 before:bg-primary/30 before:z-10 before:rounded-full"
                            : ""
                        }
                        ${
                          dragOverNodeId === node.id &&
                          dropPosition === "after" &&
                          draggingNodeId !== node.id
                            ? "after:absolute after:inset-x-0 after:-bottom-1 after:h-1 after:bg-primary/30 after:z-10 after:rounded-full"
                            : ""
                        }
                        ${
                          dragOverNodeId === node.id &&
                          dropPosition === "left" &&
                          draggingNodeId !== node.id
                            ? "before:absolute before:inset-y-0 before:-left-1 before:w-1 before:bg-blue-500/50 before:z-10 before:rounded-full"
                            : ""
                        }
                        ${
                          dragOverNodeId === node.id &&
                          dropPosition === "right" &&
                          draggingNodeId !== node.id
                            ? "after:absolute after:inset-y-0 after:-right-1 after:w-1 after:bg-blue-500/50 after:z-10 after:rounded-full"
                            : ""
                        }
                    `}
                      >
                        <Block
                          key={`${node.id}-${node.type}`}
                          node={node}
                          isActive={state.activeNodeId === node.id}
                          nodeRef={(el) => {
                            if (el) {
                              // Get the actual node ID from the element's data attribute
                              // This ensures nested blocks register with their own IDs
                              const elementNodeId =
                                el.getAttribute("data-node-id");
                              if (elementNodeId) {
                                nodeRefs.current.set(elementNodeId, el);
                              }

                              // CRITICAL: Only update DOM if element is NOT focused AND there's no active text selection
                              // This prevents cursor jumping during typing and selection
                              // Only do this for TextNodes, not ContainerNodes
                              if (textNode && elementNodeId === node.id) {
                                const isCurrentlyFocused =
                                  document.activeElement === el;
                                const selection = window.getSelection();

                                // Check if there's ANY selection anywhere, not just non-collapsed
                                const hasActiveSelection =
                                  selection &&
                                  selection.rangeCount > 0 &&
                                  !selection.isCollapsed;

                                // Also check if this specific element contains the selection
                                let selectionInThisElement = false;
                                if (
                                  hasActiveSelection &&
                                  selection.rangeCount > 0
                                ) {
                                  const range = selection.getRangeAt(0);
                                  selectionInThisElement = el.contains(
                                    range.commonAncestorContainer
                                  );
                                }

                                // NEVER update DOM if:
                                // - Element is focused
                                // - Element has inline children (formatted content)
                                // - There's an active selection anywhere
                                // - This element contains the selection
                                if (
                                  !isCurrentlyFocused &&
                                  !hasChildren &&
                                  !hasActiveSelection &&
                                  !selectionInThisElement
                                ) {
                                  const displayContent = textNode.content || "";
                                  const currentContent = el.textContent || "";

                                  // Only update if content actually differs
                                  if (currentContent !== displayContent) {
                                    el.textContent = displayContent;
                                  }
                                }
                              }
                            } else {
                              // When element is removed, delete its ref
                              nodeRefs.current.delete(node.id);
                            }
                          }}
                          onInput={(element) =>
                            handleContentChange(node.id, element)
                          }
                          onKeyDown={(e) => handleKeyDown(e, node.id)}
                          onClick={() => handleNodeClick(node.id)}
                          onDelete={
                            // Pass delete handler for all blocks - Block component will decide if it's needed
                            (nodeId?: string) =>
                              handleDeleteNode(nodeId || node.id)
                          }
                          onCreateNested={handleCreateNested}
                          readOnly={readOnly}
                          onImageDragStart={handleImageDragStart}
                          onBlockDragStart={handleBlockDragStart}
                          onChangeBlockType={handleChangeBlockType}
                          onInsertImage={handleInsertImageFromCommand}
                          onCreateList={handleCreateListFromCommand}
                          onUploadImage={onUploadImage}
                        />
                      </div>

                      {/* Add block button after each block */}
                      {!readOnly && (
                        <AddBlockButton
                          onAdd={() => handleAddBlock(node.id, "after")}
                          position="after"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Class Popover - Floats on text selection */}
      {!readOnly && <CustomClassPopover />}

      {/* Link Popover - Floats on text selection */}
      {!readOnly && <LinkPopover />}
    </div>
  );
}
