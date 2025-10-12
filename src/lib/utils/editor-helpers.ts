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
export function detectFormatsInRange(
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

