/**
 * ImageBlock Component
 *
 * Renders an image node with upload state, loading indicator, and error handling
 */

"use client";

import React, { useState } from "react";
import { TextNode } from "../lib";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface ImageBlockProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onDragStart?: (nodeId: string) => void;
}

export function ImageBlock({
  node,
  isActive,
  onClick,
  onDelete,
  onDragStart,
}: ImageBlockProps) {
  const [imageError, setImageError] = useState(false);

  console.log("image url", node.attributes?.src);

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

  console.log("isUploading", isUploading);
  console.log("hasError", hasError);
  console.log("imageUrl", imageUrl);
  console.log("altText", altText);
  console.log("caption", caption);
  console.log("imageError", imageError);

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        relative !border-0 mb-4 p-4 transition-all duration-200 cursor-move group
        ${isActive ? "ring-2 ring-primary/50 bg-accent/5" : "hover:bg-accent/5"}
      `}
      onClick={onClick}
    >
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
                className={`
                  w-full h-auto rounded-lg object-cover max-h-[600px]`}
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
    </Card>
  );
}
