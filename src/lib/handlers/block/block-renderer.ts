/**
 * Block Renderer Utilities
 * 
 * Helper functions for determining which component to render for each node type
 */

import { EditorNode, TextNode, isContainerNode, ContainerNode } from "../../types";

/**
 * Determine which HTML element to render based on node type
 */
export function getElementType(type: string): "li" | "ol" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "blockquote" | "pre" | "div" {
  switch (type) {
    case "li":
      return "li";
    case "ol":
      return "ol";
    case "h1":
      return "h1";
    case "h2":
      return "h2";
    case "h3":
      return "h3";
    case "h4":
      return "h4";
    case "h5":
      return "h5";
    case "h6":
      return "h6";
    case "p":
      return "p";
    case "blockquote":
      return "blockquote";
    case "code":
      return "pre";
    default:
      return "div";
  }
}

/**
 * Check if node should render as a special component
 */
export function getNodeRenderType(node: EditorNode): 
  | "container" 
  | "table" 
  | "flex" 
  | "nested-container"
  | "br" 
  | "img" 
  | "video" 
  | "text" 
{
  if (node.type === "br") return "br";
  if (node.type === "img") return "img";
  if (node.type === "video") return "video";
  
  if (isContainerNode(node)) {
    const containerNode = node as ContainerNode;
    const firstChild = containerNode.children[0];
    const layoutType = containerNode.attributes?.layoutType as string | undefined;
    
    if (firstChild?.type === "table") return "table";
    if (layoutType === "flex") return "flex";
    
    return "nested-container";
  }
  
  return "text";
}

/**
 * Get container CSS classes
 */
export function getContainerClasses(
  isFlexContainer: boolean,
  isActive: boolean
): string {
  if (isFlexContainer) return "";
  
  return `border-l-2 border-border/50 pl-2 ml-6 transition-all ${
    isActive ? "border-primary" : "hover:border-border"
  }`;
}

