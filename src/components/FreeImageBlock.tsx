/**
 * FreeImageBlock Component
 *
 * Renders a free-positioned image that can be dragged anywhere on the canvas
 * and maintains its position via styles (x, y coordinates)
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { TextNode } from "../lib";
import { X, ImageIcon, Loader2, Move } from "lucide-react";
import { Button } from "./ui/button";
import { useEditorDispatch } from "../lib/store/editor-store";
import { EditorActions } from "@/lib/reducer/actions";

interface FreeImageBlockProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function FreeImageBlock({
  node,
  isActive,
  onClick,
  onDelete,
  readOnly = false,
}: FreeImageBlockProps) {
  const dispatch = useEditorDispatch();
  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeSide, setResizeSide] = useState<"left" | "right" | null>(null);
  const [position, setPosition] = useState({
    x: parseFloat((node.attributes?.styles as any)?.left || "100") || 0,
    y: parseFloat((node.attributes?.styles as any)?.top || "100") || 0,
  });
  const [size, setSize] = useState<{ width: number; height: number | "auto" }>({
    width: parseFloat((node.attributes?.styles as any)?.width || "400") || 400,
    height: "auto",
  });
  const dragRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  const startSizeRef = useRef({ width: 0, height: 0, mouseX: 0, mouseY: 0 });

  const imageUrl = node.attributes?.src as string | undefined;
  const altText = node.attributes?.alt as string | undefined;
  const caption = node.content || "";
  const isUploading =
    node.attributes?.loading === "true" || node.attributes?.loading === true;
  const hasError =
    node.attributes?.error === "true" || node.attributes?.error === true;

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

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

  const handleResizeStart = (e: React.MouseEvent, side: "left" | "right") => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeSide(side);
    startSizeRef.current = {
      width: size.width,
      height: typeof size.height === "number" ? size.height : 0,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
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

      // Save position to node attributes
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

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startSizeRef.current.mouseX;

      if (resizeSide === "right") {
        // Resize from right side - only width changes
        const newWidth = Math.max(
          200,
          Math.min(800, startSizeRef.current.width + deltaX)
        );
        setSize({ width: newWidth, height: "auto" });
      } else if (resizeSide === "left") {
        // Resize from left side - width and position change
        const newWidth = Math.max(
          200,
          Math.min(800, startSizeRef.current.width - deltaX)
        );
        const widthDiff = startSizeRef.current.width - newWidth;
        const newX = startPosRef.current.x + widthDiff;

        setSize({ width: newWidth, height: "auto" });
        setPosition({ x: newX, y: position.y });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeSide(null);

      // Save size and position to node attributes
      const currentStyles = (node.attributes?.styles || {}) as Record<
        string,
        string
      >;
      const newStyles = {
        ...currentStyles,
        width: `${size.width}px`,
        height: "auto",
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
  }, [
    isResizing,
    resizeSide,
    size,
    position,
    node.id,
    node.attributes,
    dispatch,
  ]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) {
      onClick();
    }
  };

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
        width: `${size.width}px`,
        height:
          typeof size.height === "string" ? size.height : `${size.height}px`,
        zIndex: isDragging || isResizing ? 1000 : 10,
      }}
      onClick={handleClick}
    >
      <div className="relative">
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
        {!readOnly && !isUploading && !hasError && imageUrl && (
          <>
            {/* Right resize handle */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-16 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity z-20 flex items-center justify-center"
              onMouseDown={(e) => handleResizeStart(e, "right")}
            >
              <div className="w-1 h-12 bg-primary/50 rounded-full hover:bg-primary transition-colors" />
            </div>

            {/* Left resize handle */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity z-20 flex items-center justify-center"
              onMouseDown={(e) => handleResizeStart(e, "left")}
            >
              <div className="w-1 h-12 bg-primary/50 rounded-full hover:bg-primary transition-colors" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
