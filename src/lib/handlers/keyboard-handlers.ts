/**
 * Keyboard Event Handlers
 *
 * Functions for handling keyboard events in the editor
 */

import { EditorActions } from "../reducer/actions";
import {
  ContainerNode,
  TextNode,
  getNodeTextContent,
  hasInlineChildren,
  isTextNode,
} from "../types";
import { findNodeInTree } from "../utils/editor-helpers";

export interface KeyboardHandlerParams {
  container: ContainerNode;
  dispatch: React.Dispatch<any>;
  nodeRefs: React.MutableRefObject<Map<string, HTMLElement>>;
  lastEnterTime: React.MutableRefObject<number>;
  onToggleImageSelection?: (nodeId: string) => void;
}

/**
 * Handle content change in a node
 */
export function createHandleContentChange(
  params: KeyboardHandlerParams,
  contentUpdateTimers: React.MutableRefObject<Map<string, NodeJS.Timeout>>
) {
  return (nodeId: string, element: HTMLElement) => {
    const { container, dispatch } = params;
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

      // Small debounce (50ms) for better performance while avoiding content loss
      const timer = setTimeout(() => {
        // Auto-detect ordered list pattern: "1. ", "2. ", etc. (only with space)
      const orderedListMatch = newContent.match(/^(\d+)\.\s(.+)$/);
      // Auto-detect unordered list pattern: "- " or "* "
      const unorderedListMatch = newContent.match(/^[-*]\s(.+)$/);

      if (orderedListMatch && node.type === "p") {
        // Convert to ordered list item and remove only the number prefix
        const [_, number, content] = orderedListMatch;

        dispatch(
          EditorActions.updateNode(node.id, {
            type: "ol",
            content: content,
          })
        );
      } else if (unorderedListMatch && node.type === "p") {
        // Convert to unordered list item and remove the bullet prefix
        const [_, content] = unorderedListMatch;

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
        const {
          parseDOMToInlineChildren,
        } = require("../utils/editor-helpers");
        const parsedChildren = parseDOMToInlineChildren(element);

        dispatch(
          EditorActions.updateNode(node.id, {
            children: parsedChildren,
          })
        );
      }

      // Clean up the timer reference
      contentUpdateTimers.current.delete(nodeId);
    }, 50); // Small 50ms debounce - fast enough to avoid content loss

    // Store the timer reference
    contentUpdateTimers.current.set(nodeId, timer);
    }
  };
}

/**
 * Handle click events with modifier keys (Ctrl/Cmd + Click)
 */
export function createHandleClickWithModifier(params: KeyboardHandlerParams) {
  return (e: React.MouseEvent, nodeId: string) => {
    const { container, onToggleImageSelection } = params;
    
    // Check if Ctrl (Windows/Linux) or Cmd (Mac) is pressed
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    
    if (isCtrlOrCmd && onToggleImageSelection) {
      // Find the node to check if it's an image
      const result = findNodeInTree(nodeId, container);
      if (result && isTextNode(result.node)) {
        const node = result.node as TextNode;
        
        // Only toggle selection for image nodes
        if (node.type === 'img') {
          e.preventDefault();
          e.stopPropagation();
          onToggleImageSelection(nodeId);
        }
      }
    }
  };
}

/**
 * Handle key down events
 */
export function createHandleKeyDown(params: KeyboardHandlerParams) {
  return (e: React.KeyboardEvent<HTMLElement>, nodeId: string) => {
    const { container, dispatch, nodeRefs, lastEnterTime } = params;
    // CRITICAL: Get the actual node ID from the DOM element's data attribute
    // This ensures we get the correct ID for nested list items, not the container's ID
    const actualNodeId =
      (e.currentTarget as HTMLElement).getAttribute("data-node-id") || nodeId;

    if (e.key === "Enter") {
      const result = findNodeInTree(actualNodeId, container);
      if (!result || !isTextNode(result.node)) {
        return;
      }
      const node = result.node as TextNode;

      // Shift+Enter: Add a line break within the same block
      if (e.shiftKey) {
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

      // Check if this is a list item (li or ol)
      if (node.type === "li" || node.type === "ol") {
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

        // Create new list item with same type as current one
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
          id: `${node.type}-${Date.now()}`,
          type: node.type,
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
            // For list items, place cursor after the bullet/number marker
            // For other blocks, place at the start
            if (node.type === "li" || node.type === "ol") {
              // Place cursor at the very start of the text content, which will be after the marker
              const range = document.createRange();
              const sel = window.getSelection();
              // Use setStart on the element itself to position after the list marker
              range.selectNodeContents(newElement);
              range.collapse(true);
              sel?.removeAllRanges();
              sel?.addRange(range);
            } else {
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

          // Create new node with children after cursor (always create a paragraph on Enter)
          const newNode: TextNode = {
            id: `p-` + Date.now(),
            type: "p",
            content: afterChildren.length === 0 ? afterCursor : node.content,
            children: afterChildren.length > 0 ? afterChildren : undefined,
            attributes: {},
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

          // Create new node with content after cursor (always create a paragraph on Enter)
          const newNode: TextNode = {
            id: `p-` + Date.now(),
            type: "p",
            content: afterCursor,
            attributes: {},
          };

          dispatch(EditorActions.insertNode(newNode, actualNodeId, "after"));
          dispatch(EditorActions.setActiveNode(newNode.id));
        }

        lastEnterTime.current = currentTime;

        // Focus the new node after a brief delay and place cursor at start
        setTimeout(() => {
          const newElement = nodeRefs.current.get(
            `p-` + currentTime
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
      const result = findNodeInTree(actualNodeId, container);
      if (!result || !isTextNode(result.node)) return;

      const node = result.node as TextNode;
      const { siblings } = result;

      const selection = window.getSelection();
      const cursorAtStart =
        selection && selection.anchorOffset === 0 && selection.isCollapsed;

      // Get the actual DOM element to check real text content
      const element = nodeRefs.current.get(actualNodeId);
      const domTextContent = element?.textContent || "";
      
      // Get the full text content (handles both simple content and inline children)
      const fullTextContent = getNodeTextContent(node);
      // For list items, check if the DOM content is empty (what the user actually sees)
      // For other nodes, check both state and DOM
      const isListItemType = node.type === "li" || node.type === "ol";
      const isNodeEmpty = isListItemType 
        ? (!domTextContent || domTextContent.trim() === "")
        : ((!fullTextContent || fullTextContent.trim() === "") && 
           (!domTextContent || domTextContent.trim() === ""));

      // If cursor is at the start and node is empty or BR, delete the node
      if ((cursorAtStart && isNodeEmpty) || node.type === "br") {
        e.preventDefault();

        const currentIndex = siblings.findIndex((n) => n.id === actualNodeId);

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

        // Count non-image blocks
        const nonImageBlocks = siblings.filter((n) => {
          if (!isTextNode(n)) return true; // Container nodes are not images
          return (n as TextNode).type !== "img";
        });

        // Don't delete if this is the last non-image block
        if (nonImageBlocks.length === 1 && node.type !== "img") {
          // Just clear the content instead
          if (hasInlineChildren(node)) {
            dispatch(EditorActions.updateNode(node.id, { children: [] }));
          } else if (node.content) {
            dispatch(EditorActions.updateContent(node.id, ""));
          }
          return;
        }

        // Delete the current node
        dispatch(EditorActions.deleteNode(actualNodeId));

        // Focus the previous node if it exists, otherwise the next one
        const prevNode = siblings[currentIndex - 1];
        const nextNode = siblings[currentIndex + 1];
        const nodeToFocus = prevNode || nextNode;

        if (nodeToFocus) {
          dispatch(EditorActions.setActiveNode(nodeToFocus.id));
          
          // Place cursor at the end of the focused node
          setTimeout(() => {
            const elementToFocus = nodeRefs.current.get(nodeToFocus.id);
            if (elementToFocus) {
              elementToFocus.focus();
              const range = document.createRange();
              const sel = window.getSelection();
              
              // Find the last text node to place cursor at the end
              const lastChild = elementToFocus.childNodes[elementToFocus.childNodes.length - 1];
              if (lastChild) {
                if (lastChild.nodeType === Node.TEXT_NODE) {
                  // Place at end of text node
                  range.setStart(lastChild, lastChild.textContent?.length || 0);
                } else {
                  // Place after the last child element
                  range.setStartAfter(lastChild);
                }
                range.collapse(true);
                sel?.removeAllRanges();
                sel?.addRange(range);
              } else if (elementToFocus.childNodes.length === 0) {
                // Empty element, place cursor inside it
                range.selectNodeContents(elementToFocus);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
              }
            }
          }, 10);
        }
      }
    }
  };
}
