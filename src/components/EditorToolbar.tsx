"use client";

import React from "react";
import { type TextNode, type SelectionInfo, serializeToHtml, type ContainerNode } from "../lib";
import { ColorPickerComponent } from "./ColorPicker";
import { FontSizePicker } from "./FontSizePicker";
import { MediaUploadPopover } from "./MediaUploadPopover";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Bold,
  Italic,
  Underline,
  Type,
  Download,
  Copy,
  Check,
  Eye,
  List,
  ListOrdered,
  Link as LinkIcon,
  Table as TableIcon,
} from "lucide-react";

interface EditorToolbarProps {
  currentNode?: TextNode | null;
  currentSelection: SelectionInfo | null;
  selectedColor: string;
  isUploading: boolean;
  enhanceSpaces: boolean;
  copiedHtml: boolean;
  copiedJson: boolean;
  container: ContainerNode;
  onTypeChange: (type: TextNode["type"]) => void;
  onFormat: (format: "bold" | "italic" | "underline") => void;
  onColorSelect: (color: string) => void;
  onFontSizeSelect: (fontSize: string) => void;
  onImageUploadClick: () => void;
  onMultipleImagesUploadClick: () => void;
  onVideoUploadClick: () => void;
  onCreateList: (listType: "ul" | "ol") => void;
  onCreateLink: () => void;
  onCreateTable: () => void;
  onCopyHtml: () => void;
  onCopyJson: () => void;
  onEnhanceSpacesChange: (checked: boolean) => void;
}

export function EditorToolbar({
  currentNode,
  currentSelection,
  selectedColor,
  isUploading,
  enhanceSpaces,
  copiedHtml,
  copiedJson,
  container,
  onTypeChange,
  onFormat,
  onColorSelect,
  onFontSizeSelect,
  onImageUploadClick,
  onMultipleImagesUploadClick,
  onVideoUploadClick,
  onCreateList,
  onCreateLink,
  onCreateTable,
  onCopyHtml,
  onCopyJson,
  onEnhanceSpacesChange,
}: EditorToolbarProps) {
  return (
    <CardContent className="p-2 md:p-3 sticky z-[100] w-full top-0 backdrop-blur-2xl border-b mx-auto transition-all duration-300 bg-background/30">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between max-w-4xl lg:px-6 mx-auto w-full gap-2 md:gap-3">
        {/* Left Section - Text Formatting */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          {/* Type Selector */}
          <div className="flex items-center gap-1 md:gap-1.5 bg-muted/50 rounded-md px-1.5 md:px-2 py-1">
            <Type className="size-3 md:size-3.5 text-muted-foreground hidden sm:block" />
            <Select
              value={
                currentSelection?.elementType !== undefined &&
                  currentSelection?.elementType !== null
                  ? currentSelection.elementType
                  : currentNode?.type || "p"
              }
              onValueChange={(value) => onTypeChange(value as TextNode["type"])}
              disabled={
                !currentNode ||
                currentNode.type === "br" ||
                currentNode.type === "img"
              }
            >
              <SelectTrigger className="w-[90px] sm:w-[120px] md:w-[140px] h-7 md:h-8 border-0 bg-transparent focus:ring-0 text-xs sm:text-sm">
                <SelectValue placeholder="Select type">
                  {(() => {
                    const type =
                      currentSelection?.elementType !== undefined &&
                        currentSelection?.elementType !== null
                        ? currentSelection.elementType
                        : currentNode?.type || "p";

                    switch (type) {
                      case "h1":
                        return (
                          <span className="font-bold text-base">Heading 1</span>
                        );
                      case "h2":
                        return (
                          <span className="font-bold text-sm">Heading 2</span>
                        );
                      case "h3":
                        return (
                          <span className="font-semibold text-sm">
                            Heading 3
                          </span>
                        );
                      case "h4":
                        return (
                          <span className="font-semibold text-xs">
                            Heading 4
                          </span>
                        );
                      case "h5":
                        return (
                          <span className="font-semibold text-xs">
                            Heading 5
                          </span>
                        );
                      case "h6":
                        return (
                          <span className="font-semibold text-xs">
                            Heading 6
                          </span>
                        );
                      case "li":
                        return <span className="text-sm">List Item</span>;
                      case "blockquote":
                        return <span className="italic text-sm">Quote</span>;
                      case "code":
                        return <span className="font-mono text-xs">Code</span>;
                      default:
                        return <span className="text-sm">Paragraph</span>;
                    }
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="p">
                  <span className="text-sm">Paragraph</span>
                </SelectItem>
                <SelectItem value="h1">
                  <span className="font-bold text-base">Heading 1</span>
                </SelectItem>
                <SelectItem value="h2">
                  <span className="font-bold text-sm">Heading 2</span>
                </SelectItem>
                <SelectItem value="h3">
                  <span className="font-semibold text-sm">Heading 3</span>
                </SelectItem>
                <SelectItem value="h4">
                  <span className="font-semibold text-xs">Heading 4</span>
                </SelectItem>
                <SelectItem value="h5">
                  <span className="font-semibold text-xs">Heading 5</span>
                </SelectItem>
                <SelectItem value="h6">
                  <span className="font-semibold text-xs">Heading 6</span>
                </SelectItem>
                <SelectItem value="li">
                  <span className="text-sm">List Item</span>
                </SelectItem>
                <SelectItem value="blockquote">
                  <span className="italic text-sm">Quote</span>
                </SelectItem>
                <SelectItem value="code">
                  <span className="font-mono text-xs">Code</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-5 md:h-6 hidden sm:block" />

          {/* Format Buttons */}
          <ToggleGroup
            type="multiple"
            variant="outline"
            disabled={!currentSelection}
            size="sm"
            value={[
              ...(currentSelection?.formats.bold ? ["bold"] : []),
              ...(currentSelection?.formats.italic ? ["italic"] : []),
              ...(currentSelection?.formats.underline ? ["underline"] : []),
            ]}
          >
            <ToggleGroupItem
              value="bold"
              aria-label="Toggle bold"
              onClick={() => onFormat("bold")}
              disabled={!currentSelection}
              className="h-7 w-7 md:h-8 md:w-8"
            >
              <Bold className="size-3 md:size-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="italic"
              aria-label="Toggle italic"
              onClick={() => onFormat("italic")}
              disabled={!currentSelection}
              className="h-7 w-7 md:h-8 md:w-8"
            >
              <Italic className="size-3 md:size-3.5" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="underline"
              aria-label="Toggle underline"
              onClick={() => onFormat("underline")}
              disabled={!currentSelection}
              className="h-7 w-7 md:h-8 md:w-8"
            >
              <Underline className="size-3 md:size-3.5" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Color Picker */}
          <ColorPickerComponent
            disabled={!currentSelection}
            onColorSelect={onColorSelect}
            selectedColor={selectedColor}
          />

          <Separator orientation="vertical" className="h-5 md:h-6 hidden lg:block" />

          {/* Font Size Picker */}
          <FontSizePicker
            disabled={!currentSelection}
            onFontSizeSelect={onFontSizeSelect}
            currentFontSize={currentSelection?.styles?.fontSize || undefined}
          />
        </div>

        <Separator orientation="vertical" className="h-8 hidden xl:block" />

        {/* Right Section - Insert Elements */}
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          {/* Media Upload Popover - combines image and video uploads */}
          <MediaUploadPopover
            isUploading={isUploading}
            onImageUploadClick={onImageUploadClick}
            onMultipleImagesUploadClick={onMultipleImagesUploadClick}
            onVideoUploadClick={onVideoUploadClick}
          />

          <Separator orientation="vertical" className="h-5 md:h-6 hidden sm:block" />

          {/* List Button Group */}
          <ButtonGroup>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCreateList("ul")}
              className="h-7 w-7 md:h-8 md:w-8"
              title="Add unordered list"
              type="button"
            >
              <List className="size-3 md:size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCreateList("ol")}
              className="h-7 w-7 md:h-8 md:w-8"
              title="Add ordered list"
              type="button"
            >
              <ListOrdered className="size-3 md:size-3.5" />
            </Button>
          </ButtonGroup>

          {/* Link Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreateLink}
            className="h-7 w-7 md:h-8 md:w-8"
            title="Add link"
            type="button"
          >
            <LinkIcon className="size-3 md:size-3.5" />
          </Button>

          {/* Table Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreateTable}
            className="h-7 w-7 md:h-8 md:w-8"
            title="Add table"
            type="button"
          >
            <TableIcon className="size-3 md:size-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 md:h-6 hidden sm:block" />

          {/* View Code Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                title="Export code"
              >
                <Download className="size-3 md:size-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] min-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Export Code</DialogTitle>
                <DialogDescription>
                  Copy the HTML or JSON output of your editor content
                </DialogDescription>
              </DialogHeader>

              <Tabs
                defaultValue="preview"
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="html">HTML Output</TabsTrigger>
                  <TabsTrigger value="json">JSON Data</TabsTrigger>
                </TabsList>

                {/* Enhance Spaces Toggle */}
                <div className="flex items-center justify-between mt-4 px-1">
                  <p className="text-sm text-muted-foreground">
                    Preview Options
                  </p>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="enhance-spaces"
                      className="text-sm cursor-pointer"
                    >
                      Enhance Spaces
                    </Label>
                    <Switch
                      id="enhance-spaces"
                      checked={enhanceSpaces}
                      onCheckedChange={onEnhanceSpacesChange}
                    />
                  </div>
                </div>

                <TabsContent
                  value="preview"
                  className="flex-1 flex flex-col overflow-hidden mt-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      Live preview of rendered HTML
                    </p>
                  </div>
                  <div
                    className="flex-1 bg-background p-6 rounded-lg overflow-auto border"
                    dangerouslySetInnerHTML={{
                      __html: enhanceSpaces
                        ? `<div class="[&>*]:my-3 [&_*]:my-5">${serializeToHtml(
                          container
                        )}</div>`
                        : serializeToHtml(container),
                    }}
                  />
                </TabsContent>

                <TabsContent
                  value="html"
                  className="flex-1 flex flex-col overflow-hidden mt-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      HTML with Tailwind CSS classes
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCopyHtml}
                      className="gap-2"
                    >
                      {copiedHtml ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy HTML
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="flex-1 text-xs bg-secondary text-secondary-foreground p-4 rounded-lg overflow-auto border">
                    {enhanceSpaces
                      ? `<div class="[&>*]:my-3 [&_*]:my-5">\n${serializeToHtml(
                        container
                      )}\n</div>`
                      : serializeToHtml(container)}
                  </pre>
                </TabsContent>

                <TabsContent
                  value="json"
                  className="flex-1 flex flex-col overflow-hidden mt-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      Editor state as JSON
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCopyJson}
                      className="gap-2"
                    >
                      {copiedJson ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy JSON
                        </>
                      )}
                    </Button>
                  </div>
                  <pre className="flex-1 text-xs bg-secondary text-secondary-foreground p-4 rounded-lg overflow-auto border">
                    {JSON.stringify(container.children, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </CardContent>
  );
}

