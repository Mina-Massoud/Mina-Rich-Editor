"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Download,
  Copy,
  Check,
  Eye,
  Code2,
  FileJson,
  Sparkles,
} from "lucide-react";
import { type ContainerNode, serializeToHtml } from "../lib";
import { cn } from "@/lib/utils";

interface ExportFloatingButtonProps {
  container: ContainerNode;
  onCopyHtml: () => void;
  onCopyJson: () => void;
  copiedHtml: boolean;
  copiedJson: boolean;
  enhanceSpaces: boolean;
  onEnhanceSpacesChange: (checked: boolean) => void;
}

export function ExportFloatingButton({
  container,
  onCopyHtml,
  onCopyJson,
  copiedHtml,
  copiedJson,
  enhanceSpaces,
  onEnhanceSpacesChange,
}: ExportFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ease-out",
            "bg-gradient-to-br from-primary via-primary to-primary/80",
            "hover:shadow-primary/50 hover:scale-110",
            "border-2 border-primary/20",
            "group relative overflow-hidden"
          )}
          size="icon"
        >
          {/* Animated background gradient */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br from-primary/0 via-primary-foreground/10 to-primary-foreground/20",
              "transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />
          
          {/* Icon with sparkle effect */}
          <div className="relative">
            <Code2 className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" />
        
          </div>
          
          {/* Ripple effect on hover */}
          <span
            className={cn(
              "absolute inset-0 rounded-full bg-primary-foreground/20",
              "transition-transform duration-700",
              isHovered ? "scale-150 opacity-0" : "scale-0 opacity-100"
            )}
          />
        </Button>
      </div>

      {/* Export Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[90vw] min-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Code
            </DialogTitle>
            <DialogDescription>
              Copy the HTML or JSON output of your editor content
            </DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue="preview"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="html" className="gap-2">
                <Code2 className="h-4 w-4" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <FileJson className="h-4 w-4" />
                JSON
              </TabsTrigger>
            </TabsList>

            {/* Enhance Spaces Toggle */}
            <div className="flex items-center justify-between mt-4 px-1">
              <p className="text-sm text-muted-foreground">Preview Options</p>
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

            {/* Preview Tab */}
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

            {/* HTML Tab */}
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

            {/* JSON Tab */}
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
    </>
  );
}

