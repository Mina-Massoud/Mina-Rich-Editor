"use client";

import React from "react";
import { MediaUploadPopover } from "./MediaUploadPopover";
import { Separator } from "./ui/separator";
import { CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import {
  List,
  ListOrdered,
  Table as TableIcon,
  Plus,
} from "lucide-react";

interface EditorToolbarProps {
  isUploading: boolean;
  onImageUploadClick: () => void;
  onMultipleImagesUploadClick: () => void;
  onVideoUploadClick: () => void;
  onInsertComponentClick: () => void;
  onCreateList: (listType: "ul" | "ol" | "li") => void;
  onCreateTable: () => void;
}

export function EditorToolbar({
  isUploading,
  onImageUploadClick,
  onMultipleImagesUploadClick,
  onVideoUploadClick,
  onInsertComponentClick,
  onCreateList,
  onCreateTable,
}: EditorToolbarProps) {
  return (
    <CardContent className="p-2 md:p-3 sticky z-[100] w-full top-0 backdrop-blur-2xl border-b mx-auto transition-all duration-300 bg-background/30">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-center max-w-4xl lg:px-6 mx-auto w-full gap-2 md:gap-3">
        {/* Insert Elements */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-center">
          {/* Media Upload Popover - combines image and video uploads */}
          <MediaUploadPopover
            isUploading={isUploading}
            onImageUploadClick={onImageUploadClick}
            onMultipleImagesUploadClick={onMultipleImagesUploadClick}
            onVideoUploadClick={onVideoUploadClick}
          />

          <Separator orientation="vertical" className="h-5 md:h-6 hidden sm:block" />

          {/* Insert Component Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onInsertComponentClick}
            className="h-7 w-7 md:h-8 md:w-8"
            title="Insert component"
            disabled={isUploading}
          >
            <Plus className="size-3 md:size-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 md:h-6 hidden sm:block" />

          {/* List Button Group */}
          <ButtonGroup>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCreateList("ul")}
              className="h-7 w-7 md:h-8 md:w-8"
              title="Add unordered list"
            >
              <List className="size-3 md:size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCreateList("ol")}
              className="h-7 w-7 md:h-8 md:w-8"
              title="Add ordered list"
            >
              <ListOrdered className="size-3 md:size-3.5" />
            </Button>
          </ButtonGroup>

          {/* Table Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreateTable}
            className="h-7 w-7 md:h-8 md:w-8"
            title="Add table"
          >
            <TableIcon className="size-3 md:size-3.5" />
          </Button>
        </div>
      </div>
    </CardContent>
  );
}

