/**
 * Empty Content for Normal Rich Editor Mode
 *
 * Simple starting content for standard rich editor (non-Notion mode)
 * Just a few empty paragraph blocks to get started
 *
 * @packageDocumentation
 */

import { EditorNode, TextNode } from "./types";

/**
 * Creates minimal empty content for normal rich editor mode.
 * 
 * Returns 3 empty paragraph blocks ready for editing.
 * No headers, no cover images - just clean, empty blocks.
 *
 * @param timestamp - Optional timestamp for unique IDs (defaults to current time)
 * @returns Array of empty paragraph nodes
 *
 * @example
 * ```typescript
 * import { createEmptyContent } from '@/lib/empty-content';
 *
 * const emptyNodes = createEmptyContent();
 * const newContainer: ContainerNode = {
 *   id: 'root',
 *   type: 'container',
 *   children: emptyNodes,
 *   attributes: {}
 * };
 * ```
 */
export function createEmptyContent(
  timestamp: number = Date.now()
): EditorNode[] {
  return [
    {
      id: `p-${timestamp}-1`,
      type: "p",
      content: "",
      attributes: {},
    } as TextNode,
    {
      id: `p-${timestamp}-2`,
      type: "p",
      content: "",
      attributes: {},
    } as TextNode,
    {
      id: `p-${timestamp}-3`,
      type: "p",
      content: "",
      attributes: {},
    } as TextNode,
  ];
}

