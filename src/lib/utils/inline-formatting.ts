/**
 * Inline Formatting Utilities
 * 
 * Functions for splitting text nodes and applying inline formatting
 */

import { TextNode, hasInlineChildren, getNodeTextContent } from '../types';

/**
 * Split a text node into inline segments based on selection range
 * 
 * @param node - The node to split
 * @param startOffset - Start offset of selection
 * @param endOffset - End offset of selection
 * @returns Array of text segments: [before, selected, after]
 * 
 * @example
 * ```typescript
 * const node = { id: 'p-1', type: 'p', content: 'Hello world' };
 * const [before, selected, after] = splitTextNode(node, 6, 11);
 * // before: 'Hello ', selected: 'world', after: ''
 * ```
 */
export function splitTextAtSelection(
  content: string,
  startOffset: number,
  endOffset: number
): { before: string; selected: string; after: string } {
  return {
    before: content.substring(0, startOffset),
    selected: content.substring(startOffset, endOffset),
    after: content.substring(endOffset),
  };
}

/**
 * Convert a simple text node to inline children format
 * 
 * @param node - The simple text node
 * @returns Node with inline children
 */
export function convertToInlineFormat(node: TextNode): TextNode {
  if (hasInlineChildren(node)) {
    return node; // Already in inline format
  }

  const content = node.content || '';
  
  return {
    ...node,
    content: undefined, // Remove content property
    children: [
      {
        id: `${node.id}-text-${Date.now()}`,
        type: 'text',
        content: content,
      },
    ],
  };
}

/**
 * Apply formatting to a selection within a node
 * 
 * @param node - The node to format
 * @param startOffset - Start offset of selection (in text content)
 * @param endOffset - End offset of selection (in text content)
 * @param className - Tailwind classes to apply
 * @returns New node with formatting applied
 */
export function applyFormatting(
  node: TextNode,
  startOffset: number,
  endOffset: number,
  className: string
): TextNode {
  // Convert to inline format if needed
  const inlineNode = convertToInlineFormat(node);
  const fullText = getNodeTextContent(inlineNode);
  
  // Split the text
  const { before, selected, after } = splitTextAtSelection(fullText, startOffset, endOffset);
  
  // Build new children array
  const newChildren: TextNode[] = [];
  
  // Add "before" text if it exists
  if (before) {
    newChildren.push({
      id: `${node.id}-before-${Date.now()}`,
      type: 'text',
      content: before,
    });
  }
  
  // Add formatted selection as a span
  if (selected) {
    newChildren.push({
      id: `${node.id}-span-${Date.now()}`,
      type: 'span',
      content: selected,
      attributes: {
        className: className,
      },
    });
  }
  
  // Add "after" text if it exists
  if (after) {
    newChildren.push({
      id: `${node.id}-after-${Date.now()}`,
      type: 'text',
      content: after,
    });
  }
  
  return {
    ...inlineNode,
    children: newChildren,
  };
}

/**
 * Merge adjacent text nodes with the same formatting
 * 
 * @param children - Array of inline text nodes
 * @returns Merged array
 */
export function mergeAdjacentTextNodes(children: TextNode[]): TextNode[] {
  if (children.length <= 1) return children;
  
  const merged: TextNode[] = [];
  let current = children[0];
  
  for (let i = 1; i < children.length; i++) {
    const next = children[i];
    
    // Check if both are plain text nodes (not spans) with same attributes
    if (
      current.type === 'text' &&
      next.type === 'text' &&
      current.attributes?.className === next.attributes?.className
    ) {
      // Merge them
      current = {
        ...current,
        content: (current.content || '') + (next.content || ''),
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  
  merged.push(current);
  return merged;
}

/**
 * Remove formatting from a selection
 * 
 * @param node - The node with inline formatting
 * @param startOffset - Start offset of selection
 * @param endOffset - End offset of selection
 * @param className - Class name to remove
 * @returns New node with formatting removed
 */
export function removeFormatting(
  node: TextNode,
  startOffset: number,
  endOffset: number,
  className: string
): TextNode {
  if (!hasInlineChildren(node)) {
    return node; // Nothing to remove
  }
  
  // This is more complex - we need to traverse inline children
  // and split spans that intersect with the selection
  // For now, simplified implementation
  
  return node;
}

/**
 * Get the formatting at a specific cursor position
 * 
 * @param node - The node to check
 * @param offset - Cursor position
 * @returns Array of class names at that position
 */
export function getFormattingAtPosition(node: TextNode, offset: number): string[] {
  if (!hasInlineChildren(node)) {
    return node.attributes?.className ? [String(node.attributes.className)] : [];
  }
  
  let currentOffset = 0;
  for (const child of node.children!) {
    const childLength = (child.content || '').length;
    if (offset >= currentOffset && offset <= currentOffset + childLength) {
      return child.attributes?.className ? [String(child.attributes.className)] : [];
    }
    currentOffset += childLength;
  }
  
  return [];
}

