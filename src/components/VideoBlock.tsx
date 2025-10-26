/**
 * VideoBlock Component
 *
 * Renders a video node with upload state, loading indicator, and error handling
 */

"use client";

import React, { useState } from "react";
import { TextNode } from "../lib";
import { Card } from "./ui/card";
import { X, Video as VideoIcon, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";

interface VideoBlockProps {
  node: TextNode;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onDragStart?: (nodeId: string) => void;
  isSelected?: boolean;
  onToggleSelection?: (nodeId: string) => void;
  onClickWithModifier?: (e: React.MouseEvent, nodeId: string) => void;
}

export function VideoBlock({
  node,
  isActive,
  onClick,
  onDelete,
  onDragStart,
  isSelected = false,
  onToggleSelection,
  onClickWithModifier,
}: VideoBlockProps) {
  const [videoError, setVideoError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Check for Ctrl/Cmd click first
    if (onClickWithModifier) {
      onClickWithModifier(e, node.id);
    }
    
    // Only call regular onClick if not a modifier click
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

  const handleDragEnd = (e: React.DragEvent) => {};

  const videoUrl = node.attributes?.src as string | undefined;
  const caption = node.content || "";
  const isUploading =
    node.attributes?.loading === "true" || node.attributes?.loading === true;
  const hasError =
    node.attributes?.error === "true" || node.attributes?.error === true;

  // Check if the video URL is a base64 data URL (indicates no upload handler provided)
  const isBase64Video = videoUrl?.startsWith('data:video/') || videoUrl?.startsWith('data:image/svg');
  const needsUploadHandler = isBase64Video && !isUploading && !hasError;

  const handleVideoLoad = () => {
    setVideoError(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        relative !border-0 mb-4 p-4 transition-all duration-200 cursor-move group
        ${isActive ? "ring-2 ring-primary/[0.05] bg-accent/5" : "hover:bg-accent/5"}
        ${isSelected ? "ring-2 ring-blue-500 bg-blue-500/10" : ""}
      `}
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

      {/* Video container */}
      <div className="relative w-full">
        {/* Uploading state - show spinner overlay */}
        {isUploading && (
          <div className="w-full h-64 flex flex-col items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-primary/50">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-foreground">
              Uploading video...
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

        {/* Normal video loading/error states */}
        {!isUploading && !hasError && (
          <>
            {/* Upload handler required message */}
            {needsUploadHandler && (
              <div className="w-full h-64 flex flex-col items-center justify-center bg-amber-500/10 rounded-lg border-2 border-dashed border-amber-500/50">
                <VideoIcon className="h-12 w-12 text-amber-500 mb-3" />
                <p className="text-sm font-medium text-foreground">
                  Video Upload Handler Required
                </p>
                <p className="text-xs text-muted-foreground mt-2 max-w-md text-center px-4">
                  Video files need a custom upload handler. The default handler only supports images.
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md text-center px-4">
                  Pass <code className="px-1 py-0.5 bg-muted rounded text-xs">onUploadVideo</code> prop to the Editor component.
                </p>
              </div>
            )}

            {/* Error state */}
            {videoError && !needsUploadHandler && (
              <div className="w-full h-64 flex flex-col items-center justify-center bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25">
                <VideoIcon className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Failed to load video
                </p>
                {videoUrl && (
                  <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs truncate">
                    {videoUrl}
                  </p>
                )}
              </div>
            )}

            {/* Actual video */}
            {videoUrl && !videoError && !needsUploadHandler && (
              <video
                src={videoUrl}
                controls
                className="w-full h-auto rounded-lg object-cover max-h-[600px]"
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
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

