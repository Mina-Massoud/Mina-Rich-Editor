/**
 * FreeImageBlock Component
 *
 * Renders a free-positioned image that can be dragged anywhere on the canvas
 * and maintains its position via styles (x, y coordinates).
 * Resize logic is delegated to the useImageResize hook.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { TextNode } from "../lib";
import { X, ImageIcon, Loader2, Move } from "lucide-react";
import { Button } from "./ui/button";
import { useEditorDispatch } from "../lib/store/editor-store";
import { EditorActions } from "@/lib/reducer/actions";
import { useImageResize } from "../hooks/useImageResize";

interface FreeImageBlockProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function FreeImageBlock({
  node,
  onClick,
  onDelete,
  readOnly = false,
}: FreeImageBlockProps) {
  const dispatch = useEditorDispatch();
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [position, setPosition] = useState({
    x: parseFloat((node.attributes?.styles as any)?.left || "100") || 0,
    y: parseFloat((node.attributes?.styles as any)?.top || "100") || 0,
  });
  const dragRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });

  const imageUrl = node.attributes?.src as string | undefined;
  const altText = node.attributes?.alt as string | undefined;
  const caption = node.content || "";
  const isUploading =
    node.attributes?.loading === "true" || node.attributes?.loading === true;
  const hasError =
    node.attributes?.error === "true" || node.attributes?.error === true;

  // Parse initial width from node attributes (px mode)
  const getInitialWidth = (): number => {
    const styles = node.attributes?.styles;
    if (styles && typeof styles === "object" && !Array.isArray(styles)) {
      const width = (styles as Record<string, string>).width;
      if (width) {
        const v = parseFloat(width);
        if (!isNaN(v)) return Math.max(200, Math.min(800, v));
      }
    }
    return 400;
  };

  const getNodeAttributes = useCallback(
    () => (node.attributes || {}) as Record<string, any>,
    [node.attributes]
  );

  const {
    currentWidth,
    isResizing,
    dimensionLabel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    onKeyDown,
  } = useImageResize({
    nodeId: node.id,
    initialWidth: getInitialWidth(),
    unit: "px",
    minWidth: 200,
    maxWidth: 800,
    containerRef: dragRef as React.RefObject<HTMLElement>,
    dispatch,
    getNodeAttributes,
    aspectRatio,
  });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(false);
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  // --- Drag (position) logic remains here since it's specific to FreeImageBlock ---
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startPosRef.current = {
      x: position.x,
      y: position.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPosRef.current.mouseX;
      const deltaY = e.clientY - startPosRef.current.mouseY;

      const newX = startPosRef.current.x + deltaX;
      const newY = startPosRef.current.y + deltaY;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      const currentStyles = (node.attributes?.styles || {}) as Record<
        string,
        string
      >;
      const newStyles = {
        ...currentStyles,
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: "fixed",
        zIndex: currentStyles.zIndex || "10",
      };

      dispatch(
        EditorActions.updateNode(node.id, {
          attributes: {
            ...node.attributes,
            styles: newStyles,
          },
        })
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, position, node.id, node.attributes, dispatch]);

  const handleClick = (_e: React.MouseEvent) => {
    if (!isDragging && !isResizing) {
      onClick();
    }
  };

  const showResizeHandles = !readOnly && !isUploading && !hasError && imageUrl;

  return (
    <div
      ref={dragRef}
      className={`
        absolute group rounded-lg overflow-hidden
        ${readOnly ? "cursor-default" : isDragging ? "cursor-grabbing" : isResizing ? "cursor-ew-resize" : "cursor-grab"}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${currentWidth}px`,
        height: "auto",
        zIndex: isDragging || isResizing ? 1000 : 10,
      }}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <div className="relative">
        {/* Dimension overlay during resize */}
        {isResizing && dimensionLabel && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-black/75 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {dimensionLabel}
          </div>
        )}

        {/* Drag handle - only in edit mode */}
        {!readOnly && (
          <div
            className="absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onMouseDown={handleDragStart}
          >
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 hover:bg-background"
            >
              <Move className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Delete button - only in edit mode */}
        {!readOnly && onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Image container */}
        <div className="relative w-full">
          {/* Uploading state */}
          {isUploading && (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-muted/50 border-2 border-dashed border-primary/50">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium text-foreground">
                Uploading image...
              </p>
            </div>
          )}

          {/* Error state */}
          {!isUploading && hasError && (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-destructive/10 border-2 border-dashed border-destructive/50">
              <X className="h-12 w-12 text-destructive mb-2" />
              <p className="text-sm font-medium text-destructive">
                Upload Failed
              </p>
            </div>
          )}

          {/* Normal image */}
          {!isUploading && !hasError && (
            <>
              {imageError && (
                <div className="w-full h-64 flex flex-col items-center justify-center bg-muted border-2 border-dashed border-muted-foreground/25">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Failed to load image
                  </p>
                </div>
              )}

              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={altText || caption || "Free-positioned image"}
                  className="w-full h-auto rounded-lg object-cover"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  draggable={false}
                />
              )}

              {caption && (
                <p className="text-sm text-muted-foreground text-center p-2 italic bg-background/50">
                  {caption}
                </p>
              )}
            </>
          )}
        </div>

        {/* Resize handles - only in edit mode */}
        {showResizeHandles && (
          <>
            {/* Left resize handle — large hit area (44px), small visual indicator */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity z-20 flex items-center justify-center"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => handlePointerDown(e, "left")}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <div className="w-1.5 h-10 bg-primary/50 rounded-full hover:bg-primary transition-colors" />
            </div>

            {/* Right resize handle — large hit area (44px), small visual indicator */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity z-20 flex items-center justify-center"
              style={{ touchAction: "none" }}
              onPointerDown={(e) => handlePointerDown(e, "right")}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <div className="w-1.5 h-10 bg-primary/50 rounded-full hover:bg-primary transition-colors" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
