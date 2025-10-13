/**
 * MediaUploadPopover Component
 * 
 * A popover that consolidates all media upload options (images and videos)
 * to save toolbar space
 */

"use client";

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { ImagePlus, LayoutGrid, Video, Image as ImageIcon } from "lucide-react";

interface MediaUploadPopoverProps {
  isUploading: boolean;
  onImageUploadClick: () => void;
  onMultipleImagesUploadClick: () => void;
  onVideoUploadClick: () => void;
}

export function MediaUploadPopover({
  isUploading,
  onImageUploadClick,
  onMultipleImagesUploadClick,
  onVideoUploadClick,
}: MediaUploadPopoverProps) {
  const [open, setOpen] = React.useState(false);

  const handleOptionClick = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isUploading}
          className="h-7 w-7 md:h-8 md:w-8"
          title="Add media"
        >
          <ImageIcon className="size-3 md:size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9"
            onClick={() => handleOptionClick(onImageUploadClick)}
            disabled={isUploading}
          >
            <ImagePlus className="size-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Single Image</span>
              <span className="text-xs text-muted-foreground">Upload one image</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9"
            onClick={() => handleOptionClick(onMultipleImagesUploadClick)}
            disabled={isUploading}
          >
            <LayoutGrid className="size-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Multiple Images</span>
              <span className="text-xs text-muted-foreground">Upload image grid</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-9"
            onClick={() => handleOptionClick(onVideoUploadClick)}
            disabled={isUploading}
          >
            <Video className="size-4" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">Video</span>
              <span className="text-xs text-muted-foreground">Upload video file</span>
            </div>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

