/**
 * Editor Helper Functions
 * 
 * Utility functions used by the SimpleEditor component
 */

import { TextNode, EditorNode, ContainerNode, isContainerNode, SelectionInfo, InlineText } from '../types';

/**
 * Parse DOM element back into inline children structure
 * This preserves formatting when user types in a formatted block
 */
export function parseDOMToInlineChildren(element: HTMLElement): TextNode["children"] {
  const children: TextNode["children"] = [];

  const walkNode = (
    node: Node,
    inheritedFormats: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
      code?: boolean;
      className?: string;
      elementType?:
        | "p"
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "li"
        | "blockquote";
    } = {}
  ) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // Direct text node - use inherited formatting
      const content = node.textContent || "";
      
      const hasAnyFormatting =
        inheritedFormats.bold ||
        inheritedFormats.italic ||
        inheritedFormats.underline ||
        inheritedFormats.strikethrough ||
        inheritedFormats.code ||
        inheritedFormats.className ||
        inheritedFormats.elementType;
      
      // Always add content if it exists OR if it's empty but has formatting
      // This prevents structure changes when user deletes the last character
      if (content || hasAnyFormatting) {
        if (hasAnyFormatting) {
          children.push({
            content,
            bold: inheritedFormats.bold || undefined,
            italic: inheritedFormats.italic || undefined,
            underline: inheritedFormats.underline || undefined,
            strikethrough: inheritedFormats.strikethrough || undefined,
            code: inheritedFormats.code || undefined,
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
      const strikethrough = classList.includes("line-through");
      const code = classList.includes("font-mono");

      // Detect element type from classes
      let elementType:
        | "p"
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
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
        "line-through",
        "font-mono",
        "bg-gray-100",
        "dark:bg-gray-800",
        "px-1",
        "py-0.5",
        "rounded",
        "text-sm",
        "text-5xl",
        "text-4xl",
        "text-3xl",
        "text-2xl",
        "text-xl",
        "text-lg",
        "font-semibold",
        "border-l-4",
        "pl-4",
        "text-primary",
        "hover:underline",
        "cursor-pointer",
        "inline-block",
        "inline",
      ];
      const customClasses = classList.filter((c) => !knownClasses.includes(c));
      const customClassName =
        customClasses.length > 0 ? customClasses.join(" ") : undefined;

      // Merge with inherited formatting
      const currentFormats = {
        bold: bold || inheritedFormats.bold,
        italic: italic || inheritedFormats.italic,
        underline: underline || inheritedFormats.underline,
        strikethrough: strikethrough || inheritedFormats.strikethrough,
        code: code || inheritedFormats.code,
        className: customClassName || inheritedFormats.className,
        elementType: elementType || inheritedFormats.elementType,
      };

      // If it's a span with formatting, walk its children with inherited formats
      if (el.tagName === "SPAN") {
        // Check if the span is empty (no child nodes)
        if (node.childNodes.length === 0) {
          // Empty span with formatting - preserve it
          const hasAnyFormatting =
            currentFormats.bold ||
            currentFormats.italic ||
            currentFormats.underline ||
            currentFormats.strikethrough ||
            currentFormats.code ||
            currentFormats.className ||
            currentFormats.elementType;
          
          if (hasAnyFormatting) {
            children.push({
              content: "",
              bold: currentFormats.bold || undefined,
              italic: currentFormats.italic || undefined,
              underline: currentFormats.underline || undefined,
              strikethrough: currentFormats.strikethrough || undefined,
              code: currentFormats.code || undefined,
              className: currentFormats.className || undefined,
              elementType: currentFormats.elementType,
            });
          }
        } else {
          // Span has children, walk them with inherited formats
          for (let i = 0; i < node.childNodes.length; i++) {
            walkNode(node.childNodes[i], currentFormats);
          }
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

  // Filter out empty content ONLY if it has no formatting
  // Keep empty spans with formatting so user can continue typing in them
  return children.filter((child) => {
    // If content exists and is not empty, always keep it
    if (child.content && child.content.length > 0) {
      return true;
    }
    
    // If content is empty, only keep it if it has any formatting attributes
    // This prevents the structure from changing when user deletes the last character
    const hasFormatting = 
      child.bold ||
      child.italic ||
      child.underline ||
      child.strikethrough ||
      child.code ||
      child.className ||
      child.elementType ||
      child.href ||
      child.styles;
    
    return hasFormatting;
  });
}

/**
 * Detect which formats are active in a given range of a node
 */
export function detectFormatsInRange(
  node: TextNode,
  start: number,
  end: number
): {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  elementType?:
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6"
    | "li"
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
    strikethrough: false,
    code: false,
    elementType: null as any,
    href: null as string | null,
    className: null as string | null,
    styles: null as Record<string, string> | null,
  };

  // If node has no children, check node-level attributes
  if (!node.children || node.children.length === 0) {
    // For nodes without inline children, use the node's type as elementType if it's a heading
    // Note: 'code' is excluded from element types - it's only a block-level type, not inline
    const nodeElementType = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'li'].includes(node.type)
      ? (node.type as "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "li" | "blockquote")
      : null;
    
    return {
      bold: node.attributes?.bold === true,
      italic: node.attributes?.italic === true,
      underline: node.attributes?.underline === true,
      strikethrough: node.attributes?.strikethrough === true,
      code: node.attributes?.code === true,
      elementType: nodeElementType,
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
  let hasAnyStrikethrough = false;
  let hasAnyCode = false;
  let allBold = true;
  let allItalic = true;
  let allUnderline = true;
  let allStrikethrough = true;
  let allCode = true;
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

      if (child.strikethrough) {
        hasAnyStrikethrough = true;
      } else {
        allStrikethrough = false;
      }

      if (child.code) {
        hasAnyCode = true;
      } else {
        allCode = false;
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
  const detectedFormats = {
    bold: charsInRange > 0 && allBold,
    italic: charsInRange > 0 && allItalic,
    underline: charsInRange > 0 && allUnderline,
    strikethrough: charsInRange > 0 && allStrikethrough,
    code: charsInRange > 0 && allCode,
    elementType: allSameElementType ? firstElementType : null,
    href: allSameHref ? firstHref || null : null,
    className: allSameClassName ? firstClassName || null : null,
    styles: allSameStyles ? firstStyles || null : null,
  };
  
  console.log('🎨 [Selection] Detected formats:', { className: detectedFormats.className, href: detectedFormats.href, elementType: detectedFormats.elementType, bold: detectedFormats.bold, italic: detectedFormats.italic, underline: detectedFormats.underline, strikethrough: detectedFormats.strikethrough, code: detectedFormats.code, styles: detectedFormats.styles });
  
  return detectedFormats;
}

/**
 * Helper function to find a node in the tree (including nested containers)
 */
export function findNodeInTree(
  searchId: string,
  container: ContainerNode
): {
  node: EditorNode;
  parentId: string | null;
  siblings: EditorNode[];
} | null {
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
}

/**
 * Helper to find a node anywhere (root or in container)
 */
export function findNodeAnywhere(
  id: string,
  container: ContainerNode
): {
  node: EditorNode;
  parentId?: string;
  parent?: ContainerNode;
} | null {
  // Check root level
  const rootNode = container.children.find((n) => n.id === id);
  if (rootNode) return { node: rootNode };

  // Check inside containers
  for (const child of container.children) {
    if (isContainerNode(child)) {
      const containerNode = child as ContainerNode;
      const foundInContainer = containerNode.children.find((c) => c.id === id);
      if (foundInContainer)
        return {
          node: foundInContainer,
          parentId: child.id,
          parent: containerNode,
        };
    }
  }
  return null;
}

/**
 * Helper to restore selection after formatting
 */
export function restoreSelection(
  element: HTMLElement,
  start: number,
  end: number
) {
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
}

