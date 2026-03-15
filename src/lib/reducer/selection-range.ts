/**
 * Shared utility for splitting inline children at selection boundaries
 * and applying a transform to the overlapping segments.
 *
 * Used by TOGGLE_FORMAT, APPLY_CUSTOM_CLASS, APPLY_INLINE_STYLE,
 * APPLY_LINK, REMOVE_LINK, and APPLY_INLINE_ELEMENT_TYPE.
 */

import { InlineText } from "../types";

// Apply a transform function to inline children within a selection range
export function applyToSelectionRange(
  children: InlineText[],
  start: number,
  end: number,
  transform: (child: InlineText) => InlineText
): InlineText[] {
  const result: InlineText[] = [];
  let currentPos = 0;

  for (const child of children) {
    const childLength = (child.content || "").length;
    const childStart = currentPos;
    const childEnd = currentPos + childLength;

    if (childEnd <= start || childStart >= end) {
      // No overlap - keep as is
      result.push({ ...child });
    } else {
      // There's overlap - split this child
      const overlapStart = Math.max(childStart, start);
      const overlapEnd = Math.min(childEnd, end);

      // Before overlap
      if (childStart < overlapStart) {
        result.push({
          ...child,
          content: child.content!.substring(0, overlapStart - childStart),
        });
      }

      // Overlapping part - apply the transform
      result.push(
        transform({
          ...child,
          content: child.content!.substring(
            overlapStart - childStart,
            overlapEnd - childStart
          ),
        })
      );

      // After overlap
      if (childEnd > overlapEnd) {
        result.push({
          ...child,
          content: child.content!.substring(overlapEnd - childStart),
        });
      }
    }

    currentPos = childEnd;
  }

  return result;
}

// Get inline children from a node, handling plain content and empty content fallback
export function getInlineChildren(
  nodeChildren: InlineText[] | undefined,
  hasInline: boolean,
  nodeContent: string | undefined,
  selectionText: string | undefined
): InlineText[] {
  if (hasInline && nodeChildren) {
    return nodeChildren;
  }
  if (nodeContent) {
    return [{ content: nodeContent }];
  }
  if (selectionText) {
    return [{ content: selectionText }];
  }
  return [{ content: "" }];
}
