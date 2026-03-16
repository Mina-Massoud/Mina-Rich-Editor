/**
 * ImageBlock Component
 *
 * Renders an image node with upload state, loading indicator, error handling,
 * and resize functionality via the useImageResize hook.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { TextNode } from "../lib";
import { Card } from "./ui/card";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { useEditorDispatch } from "../lib/store/editor-store";
import { useImageResize } from "../hooks/useImageResize";

interface ImageBlockProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onDragStart?: (nodeId: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (nodeId: string) => void;
  onClickWithModifier?: (e: React.MouseEvent, nodeId: string) => void;
}

export function ImageBlock({
  node,
  isActive,
  onClick,
  onDelete,
  onDragStart,
  isSelected = false,
  onToggleSelection,
  onClickWithModifier,
}: ImageBlockProps) {
  const dispatch = useEditorDispatch();
  const [imageError, setImageError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial width from node attributes
  const getInitialWidth = (): number => {
    const styles = node.attributes?.styles;
    if (styles && typeof styles === "object" && !Array.isArray(styles)) {
      const width = (styles as Record<string, string>).width;
      if (width && typeof width === "string" && width.endsWith("%")) {
        const v = parseFloat(width);
        if (!isNaN(v)) return v;
      }
    }
    return 100;
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
    setWidthPreset,
    onKeyDown,
    setCurrentWidth,
  } = useImageResize({
    nodeId: node.id,
    initialWidth: getInitialWidth(),
    unit: "percent",
    minWidth: 20,
    maxWidth: 100,
    containerRef: containerRef as React.RefObject<HTMLElement>,
    dispatch,
    getNodeAttributes,
    aspectRatio,
  });

  // Sync width when node attributes change externally
  useEffect(() => {
    const styles = node.attributes?.styles;
    if (styles && typeof styles === "object" && !Array.isArray(styles)) {
      const width = (styles as Record<string, string>).width;
      if (width && typeof width === "string" && width.endsWith("%")) {
        const widthValue = parseFloat(width);
        if (!isNaN(widthValue) && !isResizing) {
          setCurrentWidth(widthValue);
        }
      }
    }
  }, [node.attributes?.styles, isResizing, setCurrentWidth]);

  const handleClick = (e: React.MouseEvent) => {
    if (isResizing) return;

    if (onClickWithModifier) {
      onClickWithModifier(e, node.id);
    }

    if (!e.ctrlKey && !e.metaKey) {
      onClick();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", node.id);
    e.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        nodeId: node.id,
        type: node.type,
        src: node.attributes?.src,
      })
    );
    if (onDragStart) {
      onDragStart(node.id);
    }
  };

  const handleDragEnd = (_e: React.DragEvent) => {};

  const imageUrl = node.attributes?.src as string | undefined;
  const altText = node.attributes?.alt as string | undefined;
  const caption = node.content || "";
  const isUploading =
    node.attributes?.loading === "true" || node.attributes?.loading === true;
  const hasError =
    node.attributes?.error === "true" || node.attributes?.error === true;

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

  const showResizeHandles = !isUploading && !hasError && imageUrl;

  return (
    <div
      ref={containerRef}
      className="relative mb-4"
      style={{ width: "100%" }}
      onKeyDown={onKeyDown}
      tabIndex={isActive ? 0 : undefined}
      data-node-id={node.id}
      data-node-type="img"
    >
      <Card
        draggable={!isResizing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`
          relative !border-0 p-4 duration-200 group
          ${!isResizing ? "cursor-move" : ""}
          ${isActive ? "ring-2 ring-primary/[0.05] bg-accent/5" : "hover:bg-accent/5"}
          ${isSelected ? "ring-2 ring-blue-500 bg-blue-500/10" : ""}
        `}
        style={{ width: `${currentWidth}%`, margin: "0 auto" }}
        onClick={handleClick}
      >
        {/* Selection checkbox */}
        {onToggleSelection && (
          <div
            className={`absolute top-2 left-2 z-10 transition-opacity ${
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(node.id)}
              className="h-5 w-5 bg-background border-2"
            />
          </div>
        )}

        {/* Delete button */}
        {onDelete && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
          {/* Dimension overlay during resize */}
          {isResizing && dimensionLabel && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-black/75 text-white text-xs px-2 py-1 rounded pointer-events-none">
              {dimensionLabel}
            </div>
          )}

          {/* Uploading state - show spinner overlay */}
          {isUploading && (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-primary/50">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
              <p className="text-sm font-medium text-foreground">
                Uploading image...
              </p>
              <p className="text-xs text-muted-foreground mt-1">Please wait</p>
            </div>
          )}

          {/* Error state (from upload failure) */}
          {!isUploading && hasError && (
            <div className="w-full h-64 flex flex-col items-center justify-center bg-destructive/10 rounded-lg border-2 border-dashed border-destructive/50">
              <X className="h-12 w-12 text-destructive mb-2" />
              <p className="text-sm font-medium text-destructive">
                Upload Failed
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please try again
              </p>
            </div>
          )}

          {/* Normal image loading/error states */}
          {!isUploading && !hasError && (
            <>
              {/* Error state */}
              {imageError && (
                <div className="w-full h-64 flex flex-col items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25">
                  <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Failed to load image
                  </p>
                  {imageUrl && (
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs truncate">
                      {imageUrl}
                    </p>
                  )}
                </div>
              )}

              {/* Actual image */}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={altText || caption || "Uploaded image"}
                  className="h-auto rounded-lg object-cover max-h-[600px]"
                  style={{ width: "auto", margin: "auto" }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}

              {/* Caption */}
              {caption && (
                <p className="text-sm text-muted-foreground text-center mt-3 italic">
                  {caption}
                </p>
              )}
            </>
          )}
        </div>

        {/* Resize handles */}
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
      </Card>

      {/* Width preset toolbar — shown when image is active */}
      {isActive && showResizeHandles && (
        <div className="flex items-center justify-center gap-1 mt-2">
          {([25, 50, 75, 100] as const).map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              className={`h-7 px-3 text-xs ${
                Math.round(currentWidth) === preset
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setWidthPreset(preset);
              }}
            >
              {preset}%
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
