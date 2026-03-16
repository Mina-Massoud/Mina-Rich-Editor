/**
 * CompactToolbar
 *
 * An inline formatting toolbar that sits at the top of the CompactEditor.
 * Reads current selection formatting from the store and dispatches format
 * and block-type-change actions through the EditorContext handlers.
 *
 * @example
 * ```tsx
 * <CompactToolbar
 *   onFormat={handleFormat}
 *   onTypeChange={handleTypeChange}
 *   onCreateList={handleCreateList}
 *   className="border-b"
 * />
 * ```
 */

"use client";

import React, { useState, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  FileCode,
  Type,
} from "lucide-react";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { useEditorStore, useEditorDispatch } from "../lib/store/editor-store";
import { EditorActions } from "../lib";
import type { TextNode } from "../lib";

// ─── Block type descriptor ────────────────────────────────────────────────────

interface BlockTypeOption {
  label: string;
  value: TextNode["type"];
  icon: React.ReactNode;
}

const BLOCK_TYPES: BlockTypeOption[] = [
  { label: "Paragraph", value: "p", icon: <Type className="h-4 w-4" /> },
  { label: "Heading 1", value: "h1", icon: <Heading1 className="h-4 w-4" /> },
  { label: "Heading 2", value: "h2", icon: <Heading2 className="h-4 w-4" /> },
  { label: "Heading 3", value: "h3", icon: <Heading3 className="h-4 w-4" /> },
  {
    label: "Blockquote",
    value: "blockquote",
    icon: <Quote className="h-4 w-4" />,
  },
  {
    label: "Code Block",
    value: "code",
    icon: <FileCode className="h-4 w-4" />,
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CompactToolbarProps {
  /**
   * Called when a formatting button (bold, italic, etc.) is clicked.
   * Receives the format key to toggle.
   */
  onFormat: (
    format: "bold" | "italic" | "underline" | "strikethrough" | "code"
  ) => void;
  /**
   * Called when a block type is selected from the dropdown.
   * Receives the new block type string.
   */
  onTypeChange: (type: TextNode["type"]) => void;
  /**
   * Called when a list button is clicked.
   * Receives the list type ("ul" or "ol").
   */
  onCreateList: (listType: "ul" | "ol" | "li") => void;
  /** Additional CSS classes for the toolbar wrapper. */
  className?: string;
}

/**
 * CompactToolbar — inline formatting bar rendered at the top of CompactEditor.
 *
 * Active state for each format button is derived from `currentSelection`
 * in the editor store, so buttons visually reflect the active formatting
 * at the current cursor position or selection.
 */
export const CompactToolbar = React.memo(function CompactToolbar({
  onFormat,
  onTypeChange,
  onCreateList,
  className,
}: CompactToolbarProps) {
  const currentSelection = useEditorStore((s) => s.currentSelection);
  const dispatch = useEditorDispatch();
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Link popover state
  const [linkOpen, setLinkOpen] = useState(false);
  const [hrefInput, setHrefInput] = useState("");

  // Keyboard navigation: arrow keys move between buttons within toolbar
  const handleToolbarKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const buttons = toolbarRef.current?.querySelectorAll<HTMLButtonElement>(
        "button:not([disabled])"
      );
      if (!buttons || buttons.length === 0) return;
      const current = Array.from(buttons).indexOf(e.target as HTMLButtonElement);
      if (current === -1) return;
      e.preventDefault();
      if (e.key === "ArrowRight") {
        const next = (current + 1) % buttons.length;
        buttons[next].focus();
      } else {
        const prev = (current - 1 + buttons.length) % buttons.length;
        buttons[prev].focus();
      }
    },
    []
  );

  // Derive active formats from selection
  const formats = currentSelection?.formats ?? {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
  };
  const hasSelection = currentSelection !== null && currentSelection.text.length > 0;

  // Determine current block type label for the dropdown
  const activeTypeLabel =
    BLOCK_TYPES.find((bt) => bt.value === currentSelection?.elementType)
      ?.label ?? "Paragraph";

  const handleApplyLink = useCallback(() => {
    const url = hrefInput.trim();
    if (!url || !currentSelection) return;
    dispatch(EditorActions.setCurrentSelection(currentSelection));
    requestAnimationFrame(() => {
      dispatch(EditorActions.applyLink(url));
    });
    setHrefInput("");
    setLinkOpen(false);
  }, [hrefInput, currentSelection, dispatch]);

  const handleRemoveLink = useCallback(() => {
    if (!currentSelection) return;
    dispatch(EditorActions.setCurrentSelection(currentSelection));
    requestAnimationFrame(() => {
      dispatch(EditorActions.removeLink());
    });
    setHrefInput("");
    setLinkOpen(false);
  }, [currentSelection, dispatch]);

  return (
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Formatting toolbar"
      aria-orientation="horizontal"
      className={cn(
        "flex flex-wrap items-center gap-0.5 px-2 py-1 border-b bg-background",
        className
      )}
      onMouseDown={(e) => {
        // Prevent the toolbar from stealing focus from the editor content
        e.preventDefault();
      }}
      onKeyDown={handleToolbarKeyDown}
    >
      {/* ── Inline formatting ─────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Bold"
        aria-pressed={formats.bold}
        tabIndex={0}
        className={cn(
          "h-7 w-7 p-0",
          formats.bold && "bg-accent text-accent-foreground"
        )}
        onClick={() => onFormat("bold")}
        disabled={!hasSelection}
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Italic"
        aria-pressed={formats.italic}
        tabIndex={-1}
        className={cn(
          "h-7 w-7 p-0",
          formats.italic && "bg-accent text-accent-foreground"
        )}
        onClick={() => onFormat("italic")}
        disabled={!hasSelection}
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Underline"
        aria-pressed={formats.underline}
        tabIndex={-1}
        className={cn(
          "h-7 w-7 p-0",
          formats.underline && "bg-accent text-accent-foreground"
        )}
        onClick={() => onFormat("underline")}
        disabled={!hasSelection}
      >
        <Underline className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Strikethrough"
        aria-pressed={formats.strikethrough}
        tabIndex={-1}
        className={cn(
          "h-7 w-7 p-0",
          formats.strikethrough && "bg-accent text-accent-foreground"
        )}
        onClick={() => onFormat("strikethrough")}
        disabled={!hasSelection}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Inline Code"
        aria-pressed={formats.code}
        tabIndex={-1}
        className={cn(
          "h-7 w-7 p-0",
          formats.code && "bg-accent text-accent-foreground"
        )}
        onClick={() => onFormat("code")}
        disabled={!hasSelection}
      >
        <Code className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-0.5" />

      {/* ── Link ──────────────────────────────────────────────────────────── */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Insert link"
            aria-haspopup="dialog"
            aria-expanded={linkOpen}
            tabIndex={-1}
            className={cn(
              "h-7 w-7 p-0",
              currentSelection?.href && "bg-accent text-accent-foreground"
            )}
            disabled={!hasSelection}
          >
            <Link className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" align="start">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Insert link</p>
            <Input
              placeholder="https://..."
              value={hrefInput}
              onChange={(e) => setHrefInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyLink();
              }}
              className="h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7" onClick={handleApplyLink}>
                Apply
              </Button>
              {currentSelection?.href && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7"
                  onClick={handleRemoveLink}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="h-6 mx-0.5" />

      {/* ── Lists ─────────────────────────────────────────────────────────── */}
      <Button
        variant="ghost"
        size="sm"
        aria-label="Unordered list"
        tabIndex={-1}
        className="h-7 w-7 p-0"
        onClick={() => onCreateList("ul")}
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        aria-label="Ordered list"
        tabIndex={-1}
        className="h-7 w-7 p-0"
        onClick={() => onCreateList("ol")}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-0.5" />

      {/* ── Block type dropdown ────────────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Block type"
            aria-haspopup="listbox"
            tabIndex={-1}
            className="h-7 gap-1 px-2 text-xs font-normal"
          >
            <span className="max-w-[80px] truncate">{activeTypeLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent role="listbox" aria-label="Block type" align="start" className="w-44">
          {BLOCK_TYPES.map((bt) => (
            <DropdownMenuItem
              key={bt.value}
              role="option"
              className="gap-2 text-sm"
              onClick={() => onTypeChange(bt.value)}
            >
              {bt.icon}
              {bt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
