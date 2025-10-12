/**
 * Block Drag Handler Functions
 * 
 * Functions for handling drag operations in Block components
 */

import React from "react";
import { TextNode } from "../../types";

/**
 * Create handle block drag start
 */
export function createHandleBlockDragStart(
  textNode: TextNode,
  onBlockDragStart?: (nodeId: string) => void
) {
  return (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", textNode.id);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        nodeId: textNode.id,
        type: textNode.type,
      })
    );
    if (onBlockDragStart) {
      onBlockDragStart(textNode.id);
    }
  };
}

/**
 * Create handle block drag end
 */
export function createHandleBlockDragEnd() {
  return (e: React.DragEvent) => {
    e.stopPropagation();
  };
}

