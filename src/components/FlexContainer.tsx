/**
 * FlexContainer Component
 *
 * Renders a flex container with drag-and-drop support for reordering/adding images
 * Shows visual indicators on left/right edges when dragging images
 */

"use client";

import React, { useState } from "react";
import { ContainerNode } from "../lib/types";

interface FlexContainerProps {
  node: ContainerNode;
  children: React.ReactNode;
  onDragOver?: (e: React.DragEvent, position: "left" | "right" | null) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, position: "left" | "right" | null) => void;
  dragOverPosition?: "left" | "right" | null;
  className?: string;
}

export function FlexContainer({
  node,
  children,
  onDragOver,
  onDragLeave,
  onDrop,
  dragOverPosition,
  className = "",
}: FlexContainerProps) {
  const [localDragPosition, setLocalDragPosition] = useState<"left" | "right" | null>(null);
  
  const gap = node.attributes?.gap as string | undefined;
  const flexWrap = node.attributes?.flexWrap as string | undefined;

  const handleDragOver = (e: React.DragEvent) => {
    // Only prevent default and handle if we're in an edge zone
    // This allows images to be dragged out of the container
    
    // Get the container's bounding rectangle
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    // Define edge threshold (30% from each edge)
    const edgeThreshold = rect.width * 0.3;
    
    // Determine if we're near the left or right edge
    let position: "left" | "right" | null = null;
    
    if (e.clientX < rect.left + edgeThreshold) {
      position = "left";
    } else if (e.clientX > rect.right - edgeThreshold) {
      position = "right";
    }

    // Only handle if we're in an edge zone
    if (position) {
      e.preventDefault();
      e.stopPropagation();
      setLocalDragPosition(position);
      
      if (onDragOver) {
        onDragOver(e, position);
      }
    } else {
      // Not in an edge zone - clear any indicators but don't prevent default
      // This allows the drag to bubble up to parent handlers
      setLocalDragPosition(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only clear if we're actually leaving the element (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;

    if (!currentTarget.contains(relatedTarget)) {
      setLocalDragPosition(null);
      
      if (onDragLeave) {
        onDragLeave(e);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    const position = localDragPosition;
    
    // Only handle the drop if we have a position (in an edge zone)
    if (position) {
      e.preventDefault();
      e.stopPropagation();
      
      if (onDrop) {
        onDrop(e, position);
      }
    }
    
    // Always clear the position indicator
    setLocalDragPosition(null);
  };

  const displayPosition = dragOverPosition ?? localDragPosition;

  return (
    <div
      data-node-id={node.id}
      data-node-type="container"
      data-layout-type="flex"
      className={`
        relative
        flex flex-row gap-${gap || "4"} items-start
        ${flexWrap === "wrap" ? "flex-wrap items-center" : ""}
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Left edge indicator */}
      {displayPosition === "left" && (
        <div className="absolute inset-y-0 -left-1 w-1 bg-blue-500/50 rounded-full z-10 pointer-events-none" />
      )}

      {/* Right edge indicator */}
      {displayPosition === "right" && (
        <div className="absolute inset-y-0 -right-1 w-1 bg-blue-500/50 rounded-full z-10 pointer-events-none" />
      )}

      {children}
    </div>
  );
}

