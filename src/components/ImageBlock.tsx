/**
 * ImageBlock Component
 *
 * Renders an image node with upload state, loading indicator, and error handling
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import { TextNode } from "../lib";
import { Card } from "./ui/card";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { useEditor } from "../lib/context/EditorContext";

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
  const [, dispatch] = useEditor();
  const [imageError, setImageError] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<number>(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(100);

  // Initialize width from node attributes styles
  useEffect(() => {
    const styles = node.attributes?.styles;
    if (styles && typeof styles === 'object' && !Array.isArray(styles)) {
      const width = (styles as Record<string, string>).width;
      if (width && typeof width === 'string' && width.endsWith('%')) {
        const widthValue = parseFloat(width);
        if (!isNaN(widthValue)) {
          setCurrentWidth(widthValue);
        }
      }
    }
  }, [node.attributes?.styles]);

  const handleClick = (e: React.MouseEvent) => {
    // Don't trigger click when resizing
    if (isResizing) return;
    
    // Check for Ctrl/Cmd click first
    if (onClickWithModifier) {
      onClickWithModifier(e, node.id);
    }
    
    // Only call regular onClick if not a modifier click
    if (!e.ctrlKey && !e.metaKey) {
      onClick();
    }
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = currentWidth;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      // Calculate new width, constrained between 20% and 100%
      let newWidth = startWidthRef.current + deltaPercent;
      newWidth = Math.max(20, Math.min(100, newWidth));
      
      setCurrentWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      
      // Update node attributes with new width
      const existingStyles = node.attributes?.styles;
      const stylesObj = existingStyles && typeof existingStyles === 'object' && !Array.isArray(existingStyles)
        ? (existingStyles as Record<string, string>)
        : {};
      
      const newStyles = {
        ...stylesObj,
        width: `${currentWidth.toFixed(2)}%`,
      };

      dispatch({
        type: 'UPDATE_ATTRIBUTES',
        payload: {
          id: node.id,
          attributes: {
            ...node.attributes,
            styles: newStyles,
          },
          merge: false,
        },
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, currentWidth, node.id, node.attributes, dispatch]);

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

  const handleDragEnd = (e: React.DragEvent) => {};

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

  return (
    <div
      ref={containerRef}
      className="relative mb-4"
      style={{ width: '100%' }}
    >
      <Card
        draggable={!isResizing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`
          relative !border-0 p-4 duration-200 group
          ${!isResizing ? 'cursor-move' : ''}
          ${isActive ? "ring-2 ring-primary/50 bg-accent/5" : "hover:bg-accent/5"}
          ${isSelected ? "ring-2 ring-blue-500 bg-blue-500/10" : ""}
        `}
        style={{ width: `${currentWidth}%`, margin: '0 auto' }}
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
                style={{ width: 'auto', margin: 'auto' }}
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
      {!isUploading && !hasError && imageUrl && (
        <>
          {/* Left resize handle */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-16 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity z-20 flex items-center justify-center"
            onMouseDown={(e) => {
              const originalHandler = handleResizeStart;
              const mirroredEvent = {
                ...e,
                clientX: 2 * containerRef.current!.getBoundingClientRect().left + containerRef.current!.offsetWidth * (currentWidth / 100) - e.clientX,
              } as React.MouseEvent;
              
              startXRef.current = -e.clientX;
              startWidthRef.current = currentWidth;
              setIsResizing(true);
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="w-1 h-12 bg-primary/50 rounded-full hover:bg-primary transition-colors" />
          </div>

          {/* Right resize handle */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-16 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity z-20 flex items-center justify-center"
            onMouseDown={handleResizeStart}
          >
            <div className="w-1 h-12 bg-primary/50 rounded-full hover:bg-primary transition-colors" />
          </div>
        </>
      )}
    </Card>
    </div>
  );
}
