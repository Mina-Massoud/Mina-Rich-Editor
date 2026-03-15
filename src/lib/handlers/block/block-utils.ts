/**
 * Block Utility Functions
 *
 * Helper functions for Block component rendering and selection management
 */

import { TextNode } from "../../types";

/** Escapes HTML special characters in a string to prevent unintended markup rendering. */
export function escapeHTML(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/** Returns the Tailwind CSS class string for a given node type, used to style rendered block elements. */
export function getTypeClassName(type: string): string {
  switch (type) {
    case "h1":
      return "text-4xl font-bold text-foreground leading-[1.2] mb-2";
    case "h2":
      return "text-3xl font-bold text-foreground leading-[1.2] mb-1.5";
    case "h3":
      return "text-2xl font-bold text-foreground leading-[1.2] mb-1";
    case "h4":
      return "text-xl font-semibold text-foreground leading-[1.3] mb-1";
    case "h5":
      return "text-lg font-semibold text-foreground leading-[1.4] mb-0.5";
    case "h6":
      return "text-base font-semibold text-foreground leading-[1.4] mb-0.5";
    case "p":
      return "text-base text-foreground leading-[1.6]";
    case "ol":
      return "text-base text-foreground leading-[1.6] list-decimal list-inside";
    case "li":
      return "text-base text-foreground leading-[1.6] list-disc list-inside";
    case "blockquote":
      return "text-base text-muted-foreground italic border-l-4 border-primary pl-6 py-1";
    case "code":
      return "font-mono text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-lg whitespace-pre-wrap break-words";
    default:
      return "text-base text-foreground leading-[1.6]";
  }
}

/**
 * Build data-* attribute string for an inline child.
 * These attributes encode the formatting state so parseDOMToInlineChildren
 * can reliably reconstruct the data model without relying on CSS class names.
 */
function buildDataAttributes(child: import("../../types").InlineText): string {
  const attrs: string[] = [];
  if (child.bold) attrs.push('data-bold="true"');
  if (child.italic) attrs.push('data-italic="true"');
  if (child.underline) attrs.push('data-underline="true"');
  if (child.strikethrough) attrs.push('data-strikethrough="true"');
  if (child.code) attrs.push('data-code="true"');
  if (child.href) attrs.push(`data-href="${child.href}"`);
  if (child.elementType) attrs.push(`data-element-type="${child.elementType}"`);
  if (child.className) attrs.push(`data-class-name="${child.className}"`);
  if (child.styles) attrs.push(`data-styles="${escapeHTML(JSON.stringify(child.styles))}"`);
  return attrs.length > 0 ? " " + attrs.join(" ") : "";
}

/** Renders a TextNode's content (plain, inline-children, or multi-line) to an HTML string for use as innerHTML. */
export function buildHTML(textNode: TextNode, _readOnly: boolean): string {
  // Check if node has inline children with formatting
  const hasChildren =
    Array.isArray(textNode.children) && textNode.children.length > 0;
  // Check if node has multiple lines
  const hasLines = Array.isArray(textNode.lines) && textNode.lines.length > 0;

  // For code blocks, we need to escape HTML entities
  const isCodeBlock = textNode.type === "code";

  // If node has multiple lines (e.g., ordered list with multiple items)
  if (hasLines) {
    return textNode
      .lines!.map((line) => {
        let lineContent = "";

        // If line has inline children with formatting
        if (line.children && line.children.length > 0) {
          lineContent = line.children
            .map((child) => {
              // Check if className is a hex color or Tailwind class
              const isHexColor =
                child.className && child.className.startsWith("#");
              const colorStyle = isHexColor ? child.className : "";
              const className = isHexColor ? "" : child.className;

              const classes = [
                child.bold ? "font-bold" : "",
                child.italic ? "italic" : "",
                child.underline ? "underline" : "",
                child.strikethrough ? "line-through" : "",
                child.code ? "font-mono bg-warm-800/10 dark:bg-warm-200/10 px-1 py-0.5 rounded" : "",
                className || "", // Include custom className (only if not hex color)
              ]
                .filter(Boolean)
                .join(" ");

              const styleAttr = colorStyle
                ? ` style="color: ${colorStyle};"`
                : "";
              const childContent = isCodeBlock
                ? escapeHTML(child.content || "")
                : child.content || "";

              const dataAttrs = buildDataAttributes(child);

              // If it's a link
              if (child.href) {
                const linkClasses = ["hover:underline cursor-pointer", classes]
                  .filter(Boolean)
                  .join(" ");
                const italicSpacing = child.italic ? "inline" : "";
                const combinedClasses = [linkClasses, italicSpacing]
                  .filter(Boolean)
                  .join(" ");
                return `<a href="${child.href}" target="_blank" rel="noopener noreferrer" class="${combinedClasses}"${styleAttr}${dataAttrs}>${childContent}</a>`;
              }

              if (child.elementType) {
                const elementClasses = getTypeClassName(child.elementType);
                const italicSpacing = child.italic ? "inline" : "";
                const combinedClasses = [elementClasses, classes, italicSpacing]
                  .filter(Boolean)
                  .join(" ");
                return `<span class="${combinedClasses}"${styleAttr}${dataAttrs}>${childContent}</span>`;
              }

              if (classes || colorStyle) {
                const italicSpacing = child.italic ? "inline" : "";
                const combinedClasses = [classes, italicSpacing]
                  .filter(Boolean)
                  .join(" ");
                const classAttr = combinedClasses
                  ? ` class="${combinedClasses}"`
                  : "";
                return `<span${classAttr}${styleAttr}${dataAttrs}>${childContent}</span>`;
              }
              return childContent;
            })
            .join("");
        } else {
          lineContent = isCodeBlock
            ? escapeHTML(line.content || "")
            : line.content || "";
        }

        return lineContent;
      })
      .join("<br>");
  }

  // If node has inline children with formatting (single line)
  if (hasChildren) {
    return textNode
      .children!.map((child) => {
        // Build inline styles from the styles object
        let inlineStyles = "";
        if (child.styles) {
          inlineStyles = Object.entries(child.styles)
            .map(([key, value]) => {
              // Convert camelCase to kebab-case (fontSize -> font-size)
              const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
              return `${kebabKey}: ${value}`;
            })
            .join("; ");
        }

        const classes = [
          child.bold ? "font-bold" : "",
          child.italic ? "italic" : "",
          child.underline ? "underline" : "",
          child.strikethrough ? "line-through" : "",
          child.code ? "font-mono bg-warm-800/10 dark:bg-warm-200/10 px-1 py-0.5 rounded" : "",
          child.className || "",
        ]
          .filter(Boolean)
          .join(" ");

        const styleAttr = inlineStyles ? ` style="${inlineStyles}"` : "";
        const childContent = isCodeBlock
          ? escapeHTML(child.content || "")
          : child.content || "";

        const dataAttrs = buildDataAttributes(child);

        // If it's a link
        if (child.href) {
          const linkClasses = ["underline cursor-pointer", classes]
            .filter(Boolean)
            .join(" ");
          const combinedClasses = [linkClasses].filter(Boolean).join(" ");
          return `<a href="${child.href}" target="_blank" rel="noopener noreferrer" class="${combinedClasses}"${styleAttr}${dataAttrs}>${childContent}</a>`;
        }

        // If child has an elementType, wrap in appropriate element
        if (child.elementType) {
          const elementClasses = getTypeClassName(child.elementType);
          // Add extra spacing for italic text to prevent overlapping
          const combinedClasses = [elementClasses, classes]
            .filter(Boolean)
            .join(" ");
          return `<span class="${combinedClasses}"${styleAttr}${dataAttrs}>${childContent}</span>`;
        }

        if (classes || inlineStyles) {
          // Add extra spacing for italic text to prevent overlapping
          const combinedClasses = [classes].filter(Boolean).join(" ");
          const classAttr = combinedClasses
            ? ` class="${combinedClasses}"`
            : "";
          return `<span${classAttr}${styleAttr}${dataAttrs}>${childContent}</span>`;
        }
        return childContent;
      })
      .join("");
  }

  // Simple content (single line, no formatting)
  const content = textNode.content || "";
  return isCodeBlock ? escapeHTML(content) : content;
}

/** Captures the current selection start, end, and collapsed state relative to the given element ref. */
export function saveSelection(localRef: React.RefObject<HTMLElement | null>): {
  start: number;
  end: number;
  collapsed: boolean;
} | null {
  if (!localRef.current) return null;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!localRef.current.contains(range.commonAncestorContainer)) return null;

  // Create a simplified representation of the selection
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(localRef.current);
  preCaretRange.setEnd(range.startContainer, range.startOffset);

  return {
    start: preCaretRange.toString().length,
    end: preCaretRange.toString().length + range.toString().length,
    collapsed: range.collapsed,
  };
}

/** Restores a previously saved selection to its character offsets within the element referenced by localRef. */
export function restoreSelection(
  localRef: React.RefObject<HTMLElement | null>,
  savedSelection: { start: number; end: number; collapsed: boolean } | null
): void {
  if (!savedSelection || !localRef.current) return;

  const selection = window.getSelection();
  if (!selection) return;

  let charIndex = 0;
  let startNode: Node | undefined = undefined;
  let startOffset = 0;
  let endNode: Node | undefined = undefined;
  let endOffset = 0;

  const walk = (node: Node): void => {
    if (startNode && endNode) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;

      // Find start position
      if (!startNode && charIndex + textLength >= savedSelection.start) {
        startNode = node;
        startOffset = savedSelection.start - charIndex;
      }

      // Find end position
      if (!endNode && charIndex + textLength >= savedSelection.end) {
        endNode = node;
        endOffset = savedSelection.end - charIndex;
      }

      charIndex += textLength;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        walk(node.childNodes[i]);
        if (startNode && endNode) break;
      }
    }
  };

  walk(localRef.current);

  try {
    const range = document.createRange();

    if (startNode && endNode) {
      const start = startNode as Node;
      const end = endNode as Node;
      range.setStart(
        start,
        Math.min(startOffset, start.textContent?.length || 0)
      );

      if (savedSelection.collapsed) {
        range.collapse(true);
      } else {
        range.setEnd(end, Math.min(endOffset, end.textContent?.length || 0));
      }

      selection.removeAllRanges();
      selection.addRange(range);
    }
  } catch (e) {
    console.warn("Failed to restore selection:", e);
  }
}
