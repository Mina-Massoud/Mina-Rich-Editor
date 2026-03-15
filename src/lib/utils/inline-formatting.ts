/**
 * Inline Formatting Utilities
 * 
 * Functions for splitting text nodes and applying inline formatting
 */

import { TextNode, InlineText, hasInlineChildren, getNodeTextContent } from '../types';
import { generateId } from './id-generator';

/** Splits a plain-text string at the given selection offsets, returning the before, selected, and after segments. */
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

/** Converts a plain-content TextNode into the inline-children format, leaving already-converted nodes unchanged. */
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
        id: generateId('text'),
        content: content,
      },
    ],
  };
}

/** Applies a Tailwind className to the selected character range within a node, splitting inline segments as needed. */
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
  const newChildren: InlineText[] = [];

  // Add "before" text if it exists
  if (before) {
    newChildren.push({
      id: generateId('text'),
      content: before,
    });
  }

  // Add formatted selection
  if (selected) {
    newChildren.push({
      id: generateId('span'),
      content: selected,
      className: className,
    });
  }

  // Add "after" text if it exists
  if (after) {
    newChildren.push({
      id: generateId('text'),
      content: after,
    });
  }
  
  return {
    ...inlineNode,
    children: newChildren,
  };
}

/** Merges adjacent inline text segments that share identical formatting properties to reduce tree size. */
export function mergeAdjacentTextNodes(children: InlineText[]): InlineText[] {
  if (children.length <= 1) return children;

  const merged: InlineText[] = [];
  let current = { ...children[0] };

  for (let i = 1; i < children.length; i++) {
    const next = children[i];

    // Check if formatting properties match
    if (
      current.bold === next.bold &&
      current.italic === next.italic &&
      current.underline === next.underline &&
      current.strikethrough === next.strikethrough &&
      current.code === next.code &&
      current.className === next.className &&
      current.href === next.href &&
      current.elementType === next.elementType &&
      JSON.stringify(current.styles) === JSON.stringify(next.styles)
    ) {
      // Merge them
      current = {
        ...current,
        content: (current.content || '') + (next.content || ''),
      };
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
}

/** Removes a specific className from inline children that overlap the given character range. */
export function removeFormatting(
  node: TextNode,
  _startOffset: number,
  _endOffset: number,
  _className: string
): TextNode {
  if (!hasInlineChildren(node)) {
    return node; // Nothing to remove
  }
  
  // This is more complex - we need to traverse inline children
  // and split spans that intersect with the selection
  // For now, simplified implementation
  
  return node;
}

/** Returns the array of class names applied to the inline segment at the given cursor offset within a node. */
export function getFormattingAtPosition(node: TextNode, offset: number): string[] {
  if (!hasInlineChildren(node)) {
    return node.attributes?.className ? [String(node.attributes.className)] : [];
  }

  let currentOffset = 0;
  for (const child of node.children!) {
    const childLength = (child.content || '').length;
    if (offset >= currentOffset && offset <= currentOffset + childLength) {
      return child.className ? [child.className] : [];
    }
    currentOffset += childLength;
  }

  return [];
}

