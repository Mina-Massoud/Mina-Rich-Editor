/**
 * Block Utility Functions
 *
 * Helper functions for Block component rendering and selection management
 */

import { TextNode } from "../../types";

/**
 * Helper function to escape HTML entities
 */
export function escapeHTML(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get CSS classes for each node type
 */
export function getTypeClassName(type: string): string {
  switch (type) {
    case "h1":
      return "text-4xl text-foreground leading-[1.2]";
    case "h2":
      return "text-3xl text-foreground leading-[1.2]";
    case "h3":
      return "text-2xl text-foreground leading-[1.3]";
    case "h4":
      return "text-xl text-foreground leading-[1.3]";
    case "h5":
      return "text-lg text-foreground leading-[1.4]";
    case "h6":
      return "text-base text-foreground leading-[1.4]";
    case "p":
      return "text-base text-foreground leading-relaxed";
    case "ul":
      return "text-base text-foreground leading-relaxed";
    case "ol":
      return "text-base text-foreground leading-relaxed";
    case "li":
      return "text-base text-foreground leading-relaxed";
    case "blockquote":
      return "text-base text-muted-foreground italic border-l-4 border-primary pl-6 py-2";
    case "code":
      return "font-mono text-sm bg-secondary text-secondary-foreground px-4 py-3 rounded-lg whitespace-pre-wrap break-words";
    default:
      return "text-lg text-foreground leading-relaxed";
  }
}

/**
 * Build HTML content from children or lines
 */
export function buildHTML(textNode: TextNode, readOnly: boolean): string {
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
      .lines!.map((line, index) => {
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
                child.code ? "font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" : "",
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

              // If it's a link
              if (child.href) {
                const linkClasses = ["hover:underline cursor-pointer", classes]
                  .filter(Boolean)
                  .join(" ");
                const italicSpacing = child.italic ? "inline" : "";
                const combinedClasses = [linkClasses, italicSpacing]
                  .filter(Boolean)
                  .join(" ");
                return `<a href="${child.href}" target="_blank" rel="noopener noreferrer" class="${combinedClasses}"${styleAttr}>${childContent}</a>`;
              }

              if (child.elementType) {
                const elementClasses = getTypeClassName(child.elementType);
                const italicSpacing = child.italic ? "inline" : "";
                const combinedClasses = [elementClasses, classes, italicSpacing]
                  .filter(Boolean)
                  .join(" ");
                return `<span class="${combinedClasses}"${styleAttr}>${childContent}</span>`;
              }

              if (classes || colorStyle) {
                const italicSpacing = child.italic ? "inline" : "";
                const combinedClasses = [classes, italicSpacing]
                  .filter(Boolean)
                  .join(" ");
                const classAttr = combinedClasses
                  ? ` class="${combinedClasses}"`
                  : "";
                return `<span${classAttr}${styleAttr}>${childContent}</span>`;
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
          child.code ? "font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" : "",
          child.className || "",
        ]
          .filter(Boolean)
          .join(" ");

        const styleAttr = inlineStyles ? ` style="${inlineStyles}"` : "";
        const childContent = isCodeBlock
          ? escapeHTML(child.content || "")
          : child.content || "";

        // If it's a link
        if (child.href) {
          const linkClasses = ["underline cursor-pointer", classes]
            .filter(Boolean)
            .join(" ");
          const combinedClasses = [linkClasses].filter(Boolean).join(" ");
          return `<a href="${child.href}" target="_blank" rel="noopener noreferrer" class="${combinedClasses}"${styleAttr}>${childContent}</a>`;
        }

        // If child has an elementType, wrap in appropriate element
        if (child.elementType) {
          const elementClasses = getTypeClassName(child.elementType);
          // Add extra spacing for italic text to prevent overlapping
          const combinedClasses = [elementClasses, classes]
            .filter(Boolean)
            .join(" ");
          return `<span class="${combinedClasses}"${styleAttr}>${childContent}</span>`;
        }

        if (classes || inlineStyles) {
          // Add extra spacing for italic text to prevent overlapping
          const combinedClasses = [classes].filter(Boolean).join(" ");
          const classAttr = combinedClasses
            ? ` class="${combinedClasses}"`
            : "";
          return `<span${classAttr}${styleAttr}>${childContent}</span>`;
        }
        return childContent;
      })
      .join("");
  }

  // Simple content (single line, no formatting)
  const content = textNode.content || "";
  return isCodeBlock ? escapeHTML(content) : content;
}

/**
 * Save current selection position
 */
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

/**
 * Restore selection to saved position
 */
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
