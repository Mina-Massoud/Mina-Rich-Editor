"use client";

import { useState, useRef, useEffect } from "react";
import { useEditor } from "@/lib/context/EditorContext";
import { EditorActions } from "@/lib/reducer/actions";
import { Button } from "@/components/ui/button";
import { 
  ImageIcon, 
  X, 
  Upload, 
  MoveVertical,
  Trash2 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CoverImageProps {
  onUploadImage?: (file: File) => Promise<string>;
  readOnly?: boolean;
}

export function CoverImage({ onUploadImage, readOnly = false }: CoverImageProps) {
  const [state, dispatch] = useEditor();
  const { coverImage } = state;
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragPosition, setDragPosition] = useState(coverImage?.position ?? 50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update drag position when coverImage changes
  useEffect(() => {
    if (coverImage?.position !== undefined) {
      setDragPosition(coverImage.position);
    }
  }, [coverImage?.position]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      console.warn("Selected file is not an image");
      return;
    }

    setIsUploading(true);

    try {
      let url: string;
      
      if (onUploadImage) {
        // Use custom upload handler
        url = await onUploadImage(file);
      } else {
        // Fallback to data URL
        url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      dispatch(
        EditorActions.setCoverImage({
          url,
          alt: file.name,
          position: 50,
        })
      );
    } catch (error) {
      console.error("Failed to upload cover image:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleRemove = () => {
    dispatch(EditorActions.removeCoverImage());
  };

  const handlePositionDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handlePositionDrag = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    setDragPosition(percentage);
    // Update state immediately so position is always saved
    dispatch(EditorActions.updateCoverImagePosition(percentage));
  };

  const handlePositionDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      // Position is already saved in state during drag
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handlePositionDrag);
      window.addEventListener("mouseup", handlePositionDragEnd);

      return () => {
        window.removeEventListener("mousemove", handlePositionDrag);
        window.removeEventListener("mouseup", handlePositionDragEnd);
      };
    }
  }, [isDragging, dragPosition]);

  const handleChangeImage = () => {
    fileInputRef.current?.click();
  };

  // If no cover image, don't render anything
  if (!coverImage) {
    return null;
  }

  // Show cover image with controls
  return (
    <div
      ref={containerRef}
      className="group absolute top-0 w-full h-[300px] overflow-hidden rounded-lg mb-8"
      onMouseEnter={() => !readOnly && setIsHovered(true)}
      onMouseLeave={() => !readOnly && setIsHovered(false)}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Cover Image */}
      <div className="absolute inset-0">
        <img
          src={coverImage.url}
          alt={coverImage.alt || "Cover image"}
          className="w-full h-full object-cover"
          style={{
            objectPosition: `center ${dragPosition}%`,
          }}
        />
      </div>

      {/* Overlay with controls */}
      {!readOnly && (
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-200 flex items-end justify-end p-4 gap-2",
            isHovered || isDragging ? "opacity-100" : "opacity-0"
          )}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={handleChangeImage}
            className="gap-2 bg-background/90 hover:bg-background"
          >
            <Upload className="h-4 w-4" />
            Change
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onMouseDown={handlePositionDragStart}
            className={cn(
              "gap-2 bg-background/90 hover:bg-background cursor-move",
              isDragging && "bg-primary text-primary-foreground"
            )}
          >
            <MoveVertical className="h-4 w-4" />
            Reposition
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRemove}
            className="gap-2 bg-background/90 hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      )}

      {/* Dragging indicator */}
      {isDragging && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-primary pointer-events-none z-50"
          style={{ top: `${dragPosition}%` }}
        >
          <div className="absolute left-1/2 -translate-x-1/2 -top-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            {Math.round(dragPosition)}%
          </div>
        </div>
      )}
    </div>
  );
}

