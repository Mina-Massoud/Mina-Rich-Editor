/**
 * SelectionToolbar Component
 *
 * A floating toolbar that appears above selected text, similar to Notion's selection menu.
 * Provides quick access to text formatting and styling options.
 */

"use client";

import React, { useEffect, useState, useRef } from "react";
import { type SelectionInfo } from "../lib";
import { Link as LinkIcon, Type, Sparkles } from "lucide-react";
import type { AIProvider } from "../lib/ai/types";
import { AISelectionMenu } from "./AISelectionMenu";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { ElementSelector, type ElementType } from "./ElementSelector";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useEditorDispatch, EditorActions } from "../lib";
import { useToast } from "@/hooks/use-toast";
import { tailwindClasses } from "../lib/tailwind-classes";
import {
  getUserFriendlyClasses,
  searchUserFriendlyClasses,
} from "../lib/class-mappings";
import {
  mergeClasses,
  getReplacementInfo,
} from "../lib/utils/class-replacement";
import {
  LinkPopoverContent,
  CustomClassPopoverContent,
  FormatButtons,
} from "./_toolbar-components";
import { ColorPickerComponent } from "./ColorPicker";
import { FontSizePicker } from "./FontSizePicker";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface SelectionToolbarProps {
  selection: SelectionInfo | null;
  selectedColor: string;
  onFormat: (format: "bold" | "italic" | "underline" | "strikethrough" | "code") => void;
  onTypeChange: (type: string) => void;
  onColorSelect: (color: string) => void;
  onFontSizeSelect: (fontSize: string) => void;
  aiProvider?: AIProvider;
  aiSystemPrompt?: string;
}

export function SelectionToolbar({
  selection,
  selectedColor,
  onFormat,
  onTypeChange,
  onColorSelect,
  onFontSizeSelect,
  aiProvider,
  aiSystemPrompt,
}: SelectionToolbarProps) {
  const dispatch = useEditorDispatch();
  const { toast } = useToast();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Link popover state
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [hrefInput, setHrefInput] = useState("");

  // Custom class popover state
  const [customClassPopoverOpen, setCustomClassPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [devMode, setDevMode] = useState(false);

  // AI menu state
  const [aiMenuOpen, setAiMenuOpen] = useState(false);

  // Store selection for link/class application
  const savedSelectionRef = useRef<typeof selection>(null);

  useEffect(() => {
    // Keep toolbar visible and position stable if either popover is open
    if (linkPopoverOpen || customClassPopoverOpen || aiMenuOpen) {
      return;
    }

    if (!selection || selection.text.length === 0) {
      setIsVisible(false);
      return;
    }

    // Save selection for later use in popovers
    savedSelectionRef.current = selection;

    // Pre-fill link input if selection has an existing link
    if (selection.href && !linkPopoverOpen) {
      setHrefInput(selection.href);
    }

    // Get the current selection range
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      // Don't hide if we already have a position and saved selection
      if (savedSelectionRef.current && position.top !== 0) {
        return;
      }
      setIsVisible(false);
      return;
    }

    const range = domSelection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Don't update position if rect is empty/collapsed and we already have a good position
    if (rect.width === 0 && rect.height === 0 && position.top !== 0) {
      return;
    }

    // Calculate position above the selection
    const toolbarHeight = 44; // Approximate toolbar height
    const gap = 8; // Gap between selection and toolbar

    // Position toolbar centered above the selection
    let left = rect.left + rect.width / 2;
    const top = rect.top - toolbarHeight - gap;

    // Adjust horizontal position if toolbar would go off-screen
    if (toolbarRef.current) {
      const toolbarWidth = toolbarRef.current.offsetWidth;
      left = left - toolbarWidth / 2;

      // Keep toolbar within viewport
      const padding = 16;
      if (left < padding) {
        left = padding;
      } else if (left + toolbarWidth > window.innerWidth - padding) {
        left = window.innerWidth - toolbarWidth - padding;
      }
    }

    setPosition({ top, left });
    setIsVisible(true);
  }, [selection, linkPopoverOpen, customClassPopoverOpen, position.top]);

  // Link handlers
  const handleApplyLink = () => {
    if (!savedSelectionRef.current || !hrefInput.trim()) return;

    dispatch(EditorActions.setCurrentSelection(savedSelectionRef.current));

    requestAnimationFrame(() => {
      dispatch(EditorActions.applyLink(hrefInput.trim()));

      toast({
        title: "Link Applied",
        description: `Linked to: ${hrefInput}`,
      });

      setHrefInput("");
      setLinkPopoverOpen(false);
    });
  };

  const handleRemoveLink = () => {
    if (!savedSelectionRef.current) return;

    dispatch(EditorActions.setCurrentSelection(savedSelectionRef.current));

    requestAnimationFrame(() => {
      dispatch(EditorActions.removeLink());

      toast({
        title: "Link Removed",
        description: "Link has been removed from selection",
      });

      setHrefInput("");
      setLinkPopoverOpen(false);
    });
  };

  // Custom class handlers with smart replacement
  const handleApplyCustomClass = (className: string) => {
    if (!savedSelectionRef.current) return;

    // Get current classes from selection
    const currentClassName = savedSelectionRef.current.className || "";

    // Get replacement info
    const replacementInfo = getReplacementInfo(currentClassName, className);

    // Merge classes intelligently (replaces same-category classes)
    const mergedClasses = mergeClasses(currentClassName, className);

    dispatch(
      EditorActions.setCurrentSelection({
        ...savedSelectionRef.current,
        formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
      })
    );

    requestAnimationFrame(() => {
      dispatch(EditorActions.applyCustomClass(mergedClasses));

      // Show appropriate toast message
      if (
        replacementInfo.willReplace &&
        replacementInfo.replacedClasses.length > 0
      ) {
        toast({
          title: "Class Replaced",
          description: `Replaced "${replacementInfo.replacedClasses.join(
            ", "
          )}" with "${className}"`,
        });
      } else {
        toast({
          title: "Custom Class Applied",
          description: `Applied class: ${className}`,
        });
      }

      setCustomClassPopoverOpen(false);
      setSearchQuery("");
    });
  };

  // Filter classes for custom class popover
  const filteredClasses = devMode
    ? searchQuery
      ? tailwindClasses
          .map((group) => ({
            ...group,
            classes: group.classes.filter((cls) =>
              cls.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          }))
          .filter((group) => group.classes.length > 0)
      : tailwindClasses
    : searchQuery
    ? searchUserFriendlyClasses(searchQuery)
    : getUserFriendlyClasses();

  // Use savedSelection if current selection is lost but popovers are open
  const activeSelection = selection || savedSelectionRef.current;

  if (!activeSelection && !linkPopoverOpen && !customClassPopoverOpen && !aiMenuOpen) {
    return null;
  }

  const { formats } = activeSelection || {
    formats: { bold: false, italic: false, underline: false, strikethrough: false, code: false },
  };
  const hasExistingLink = Boolean(savedSelectionRef.current?.href);



  return (
    <AnimatePresence mode="wait">
      {position &&
        isVisible && ( // Keep toolbar visible if either popover is open, even if selection is lost
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={toolbarRef}
            role="toolbar"
            aria-label="Text formatting"
            aria-orientation="horizontal"
            className={cn(
              "fixed z-[200] duration-200",
              "inline-flex items-stretch rounded-lg shadow-md pointer-events-auto",
              "bg-popover/95 backdrop-blur-sm border border-border/50",
              "text-sm leading-tight"
            )}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              height: "40px",
              padding: "4px",
            }}
          >
            {/* Text Type Selector */}
            <ElementSelector
              value={activeSelection?.elementType as ElementType}
              onValueChange={(value) => onTypeChange(value)}
              variant="compact"
              showDescription={false}
              showIcon={false}
              className="mr-2"
            />

            {/* Format Buttons */}
            <FormatButtons formats={formats} onFormat={onFormat} size="sm" />

            <Separator
              orientation="vertical"
              className="h-6 my-auto mx-1.5 bg-border/50"
            />

            {/* Color Picker */}
            <ColorPickerComponent
              disabled={!activeSelection}
              onColorSelect={onColorSelect}
              selectedColor={selectedColor}
            />

            {/* Font Size Picker */}
            <FontSizePicker
              disabled={!activeSelection}
              onFontSizeSelect={onFontSizeSelect}
              currentFontSize={activeSelection?.styles?.fontSize || undefined}
            />

            <Separator
              orientation="vertical"
              className="h-6 my-auto mx-1.5 bg-border/50"
            />

            {/* Link Popover */}
            <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={hasExistingLink ? "Edit link" : "Insert link"}
                  aria-haspopup="dialog"
                  aria-expanded={linkPopoverOpen}
                  className={cn(
                    "h-7 px-2 rounded-md hover:bg-accent/50 transition-colors duration-75 gap-1.5 min-w-fit",
                    hasExistingLink && "text-blue-500"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80"
                align="start"
                {...{ onOpenAutoFocus: (e: any) => e.preventDefault() }}
                {...{ onInteractOutside: (e: any) => {
                  const target = e.target as HTMLElement;
                  if (toolbarRef.current?.contains(target)) {
                    e.preventDefault();
                  }
                }}}
              >
                <LinkPopoverContent
                  hrefInput={hrefInput}
                  setHrefInput={setHrefInput}
                  hasExistingLink={hasExistingLink}
                  selectedText={savedSelectionRef.current?.text || ""}
                  onApply={handleApplyLink}
                  onRemove={handleRemoveLink}
                />
              </PopoverContent>
            </Popover>

            {/* Custom Class Popover */}
            <Popover
              open={customClassPopoverOpen}
              onOpenChange={setCustomClassPopoverOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Apply custom class"
                  aria-haspopup="dialog"
                  aria-expanded={customClassPopoverOpen}
                  className="h-7 px-2 rounded-md hover:bg-accent/50 transition-colors duration-75 gap-1.5 min-w-fit"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center justify-center w-6 h-6 text-center font-medium rounded-md border border-border/50">
                    <Type className="h-3.5 w-3.5" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-96"
                align="start"
                {...{ onOpenAutoFocus: (e: any) => e.preventDefault() }}
                {...{ onInteractOutside: (e: any) => {
                  const target = e.target as HTMLElement;
                  if (toolbarRef.current?.contains(target)) {
                    e.preventDefault();
                  }
                }}}
              >
                <CustomClassPopoverContent
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  devMode={devMode}
                  setDevMode={setDevMode}
                  filteredClasses={filteredClasses}
                  onApplyClass={handleApplyCustomClass}
                />
              </PopoverContent>
            </Popover>

            <Separator
              orientation="vertical"
              className="h-6 my-auto mx-1.5 bg-border/50"
            />

            {/* AI Selection Menu */}
            {aiProvider && activeSelection && (
              <Popover open={aiMenuOpen} onOpenChange={setAiMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="AI edit"
                    aria-haspopup="dialog"
                    aria-expanded={aiMenuOpen}
                    className="h-7 px-2 rounded-md hover:bg-accent/50 transition-colors duration-75 gap-1.5 min-w-fit"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 border-0 bg-transparent shadow-none"
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  {...{ onOpenAutoFocus: (e: any) => e.preventDefault() }}
                  {...{ onInteractOutside: (e: any) => {
                    const target = e.target as HTMLElement;
                    if (toolbarRef.current?.contains(target)) {
                      e.preventDefault();
                    }
                  }}}
                >
                  <AISelectionMenu
                    selection={activeSelection}
                    provider={aiProvider}
                    defaultSystemPrompt={aiSystemPrompt}
                    onClose={() => setAiMenuOpen(false)}
                  />
                </PopoverContent>
              </Popover>
            )}
          </motion.div>
        )}
    </AnimatePresence>
  );
}
