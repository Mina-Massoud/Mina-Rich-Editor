/**
 * Block Styles Utilities
 * 
 * Functions for building className and style objects for blocks
 */

import { TextNode } from "../../types";
import { getTypeClassName } from "./block-utils";

interface BlockStyleParams {
  textNode: TextNode;
  className: string;
  readOnly: boolean;
  isActive: boolean;
  isListItem: boolean;
  isFirstBlock: boolean;
  notionBased: boolean;
}

/**
 * Build the complete className string for a block
 */
export function buildBlockClassName({
  textNode,
  className,
  readOnly,
  isActive,
  isListItem,
  isFirstBlock,
  notionBased,
}: BlockStyleParams): string {
  const parts = [
    // List item positioning
    isListItem ? "relative" : "",
    
    // Type-specific styles (h1, h2, p, etc.)
    getTypeClassName(textNode.type),
    
    // Custom className from node attributes
    className,
    
    // Editor mode styles
    readOnly ? "" : "outline-none",
    
    // Spacing based on type
    getBlockSpacing(textNode.type, isListItem),
    
    // Notion-style first block spacing
    notionBased && isFirstBlock && textNode.type === 'h1' ? "mt-8 pb-12" : "",
    
    // Transitions
    "transition-all",
    
    // Active/hover states
    !readOnly && isActive ? "border-b bg-accent/5" : "",
    !readOnly ? "hover:bg-accent/5" : "",
    readOnly ? "cursor-default" : "",
  ];
  
  return parts.filter(Boolean).join(" ");
}

/**
 * Get spacing classes based on node type
 */
function getBlockSpacing(nodeType: string, isListItem: boolean): string {
  if (isListItem) {
    return "px-3 py-0.5 mb-0.5";
  }
  
  if (nodeType.startsWith('h')) {
    return "px-3 py-1";
  }
  
  return "px-3 py-1 mb-1";
}

/**
 * Build inline styles for a block
 */
export function buildBlockStyles(
  depth: number,
  isListItem: boolean,
  textColor: string,
  backgroundColor?: string
): React.CSSProperties {
  return {
    marginLeft: isListItem ? `${depth * 0.5 + 1.5}rem` : `${depth * 0.5}rem`,
    ...(textColor ? { color: textColor } : {}),
    ...(backgroundColor ? { backgroundColor } : {}),
  };
}

/**
 * Parse custom className to extract color and class
 */
export function parseCustomClassName(customClassName: string | number | boolean | Record<string, string> | undefined): {
  textColor: string;
  className: string;
} {
  const classNameStr = typeof customClassName === "string" ? customClassName : "";
  const isHexColor = classNameStr.startsWith("#");
  
  return {
    textColor: isHexColor ? classNameStr : "",
    className: isHexColor ? "" : classNameStr,
  };
}

