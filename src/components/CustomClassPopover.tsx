/**
 * CustomClassPopover Component
 *
 * A floating popover that appears on text selection, allowing users to apply custom Tailwind classes
 * Uses useEditor internally to access and modify the editor state
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Pencil, Search, Code2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Switch } from "./ui/switch";
import { useEditor, EditorActions } from "../lib";
import { useToast } from "@/hooks/use-toast";
import { tailwindClasses } from "../lib/tailwind-classes";
import {
  getUserFriendlyClasses,
  searchUserFriendlyClasses,
} from "../lib/class-mappings";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

export function CustomClassPopover() {
  const [state, dispatch] = useEditor();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const isMobile = useIsMobile();

  // Store the selection in a ref so it persists when focus changes
  const savedSelectionRef = useRef<{
    nodeId: string;
    start: number;
    end: number;
    text: string;
  } | null>(null);

  // Filter classes based on search and dev mode
  const filteredClasses = devMode
    ? // Dev Mode: Show Tailwind classes
      searchQuery
      ? tailwindClasses
          .map((group) => ({
            ...group,
            classes: group.classes.filter((cls) =>
              cls.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          }))
          .filter((group) => group.classes.length > 0)
      : tailwindClasses
    : // User Mode: Show user-friendly names
    searchQuery
    ? searchUserFriendlyClasses(searchQuery)
    : getUserFriendlyClasses();

  // Track selection and position the floating icon
  useEffect(() => {
    if (state.currentSelection && state.currentSelection.text.length > 0) {
      // Save the selection to ref so it persists when focus changes
      savedSelectionRef.current = {
        nodeId: state.currentSelection.nodeId,
        start: state.currentSelection.start,
        end: state.currentSelection.end,
        text: state.currentSelection.text,
      };

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Calculate position relative to document (absolute positioning)
        // Position the icon above the selection, centered
        setPosition({
          top: rect.top + window.scrollY - 45, // 45px above the selection + scroll offset
          left: rect.left + window.scrollX + rect.width / 2 - 16, // Centered on selection + scroll offset
        });
      }
    } else {
      // Only clear position if we don't have a saved selection and popover is closed
      if (!isOpen) {
        setPosition(null);
        savedSelectionRef.current = null;
      }
    }
  }, [state.currentSelection, state.selectionKey, isOpen]);

  // Close keyboard on mobile
  const closeKeyboard = () => {
    if (isMobile && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  // Handle opening the popover/sheet
  const handleOpenChange = (open: boolean) => {
    if (open && isMobile) {
      closeKeyboard();
      // Small delay to ensure keyboard is closed before opening
      setTimeout(() => setIsOpen(true), 100);
    } else {
      setIsOpen(open);
    }
  };

  // Handle class application
  const handleQuickStyle = (className: string) => {
    // Use saved selection from ref instead of state
    if (!savedSelectionRef.current) return;

    // Temporarily restore the selection in state for the action
    dispatch(
      EditorActions.setCurrentSelection({
        ...savedSelectionRef.current,
        formats: { bold: false, italic: false, underline: false },
      })
    );

    // Apply the custom class
    setTimeout(() => {
      dispatch(EditorActions.applyCustomClass(className));

      toast({
        title: "Custom Class Applied",
        description: `Applied class: ${className}`,
      });

      setIsOpen(false);
      setPosition(null);
      savedSelectionRef.current = null;
    }, 0);
  };

  // Reusable content component for both Popover and Sheet
  const ClassPickerContent = () => (
    <div className="space-y-3">
      {/* Dev Mode Toggle */}
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Dev Mode</span>
        </div>
        <Switch
          checked={devMode}
          onCheckedChange={setDevMode}
          aria-label="Toggle dev mode"
        />
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder={
            devMode
              ? "Search classes... (e.g., 'text', 'bg', 'flex')"
              : "Search styles... (e.g., 'red', 'bold', 'shadow')"
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {devMode ? (
            // Dev Mode: Show Tailwind classes
            <>
              {filteredClasses.map((group) => (
                <div key={group.category}>
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                    {group.category}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(group as any).classes.map((cls: string) => (
                      <Button
                        key={cls}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickStyle(cls)}
                        className="text-xs h-6 px-2"
                      >
                        {cls}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            // User Mode: Show user-friendly names
            <>
              {filteredClasses.map((group) => (
                <div key={group.category}>
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                    {group.category}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(group as any).items.map(
                      (item: { label: string; value: string }) => (
                        <Button
                          key={item.value}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickStyle(item.value)}
                          className="text-xs h-6 px-2"
                          title={`Applies: ${item.value}`}
                        >
                          {item.label}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
          {filteredClasses.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No classes found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  // Trigger button component
  const TriggerButton = () => (
    <button
      className="h-8 w-8 flex items-center justify-center rounded-full shadow-lg hover:scale-110 transition-all bg-background border-2 border-border hover:border-primary"
      onMouseDown={(e) => {
        // Prevent default to keep the selection
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        // Prevent default to keep the selection
        e.preventDefault();
        e.stopPropagation();
        if (isMobile) {
          closeKeyboard();
        }
        setIsOpen(true);
      }}
    >
      <Pencil className="size-4" />
    </button>
  );

  return (
    <motion.div
      layoutId="custom-class-popover"
      className={`${
        position ? "opacity-100" : "!opacity-0"
      } transition-opacity duration-300 absolute z-50 pointer-events-auto`}
      style={{
        top: `${position?.top || 0}px`,
        left: `${position?.left || 0}px`,
      }}
    >
      {isMobile ? (
        // Mobile: Use Sheet (drawer from bottom)
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
          <SheetTrigger asChild>
            <TriggerButton />
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[85vh] px-5 rounded-t-xl"
            onOpenAutoFocus={(e) => {
              // Prevent auto-focus to avoid reopening keyboard
              e.preventDefault();
            }}
          >
            <SheetHeader>
              <SheetTitle>Custom Classes</SheetTitle>
            </SheetHeader>
            <div className="mt-4 overflow-y-auto h-[calc(100%-60px)]">
              <ClassPickerContent />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        // Desktop: Use Popover
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger >
            <TriggerButton />
          </PopoverTrigger>
          <PopoverContent
            className="lg:w-[300px] max-h-[300px] overflow-y-auto"
            align="start"
            onOpenAutoFocus={(e) => {
              // Prevent the popover from stealing focus and losing selection
              e.preventDefault();
            }}
          >
            <ClassPickerContent />
          </PopoverContent>
        </Popover>
      )}
    </motion.div>
  );
}
