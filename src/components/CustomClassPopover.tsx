/**
 * CustomClassPopover Component
 * 
 * A floating popover that appears on text selection, allowing users to apply custom Tailwind classes
 * Uses useEditor internally to access and modify the editor state
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { useEditor, EditorActions } from '../lib';
import { useToast } from '@/hooks/use-toast';
import { tailwindClasses } from '../lib/tailwind-classes';

export function CustomClassPopover() {
  const [state, dispatch] = useEditor();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Store the selection in a ref so it persists when focus changes
  const savedSelectionRef = useRef<{
    nodeId: string;
    start: number;
    end: number;
    text: string;
  } | null>(null);

  // Filter classes based on search
  const filteredClasses = searchQuery
    ? tailwindClasses.map(group => ({
        ...group,
        classes: group.classes.filter(cls => 
          cls.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(group => group.classes.length > 0)
    : tailwindClasses;

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
        
        // Calculate position relative to viewport (fixed positioning)
        // Position the icon above the selection, centered
        setPosition({
          top: rect.top - 45, // 45px above the selection
          left: rect.left + (rect.width / 2) - 16, // Centered on selection
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

  // Handle class application
  const handleQuickStyle = (className: string) => {
    // Use saved selection from ref instead of state
    if (!savedSelectionRef.current) return;

    // Temporarily restore the selection in state for the action
    dispatch(EditorActions.setCurrentSelection({
      ...savedSelectionRef.current,
      formats: { bold: false, italic: false, underline: false },
    }));

    // Apply the custom class
    setTimeout(() => {
      dispatch(EditorActions.applyCustomClass(className));
      
      toast({
        title: 'Custom Class Applied',
        description: `Applied class: ${className}`,
      });

      setIsOpen(false);
      setPosition(null);
      savedSelectionRef.current = null;
    }, 0);
  };

  console.log("position", position);
  if (!position) return null;

  return (
    <div
      className="fixed z-[10000] pointer-events-auto"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
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
              setIsOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="lg:w-[500px] max-h-[600px]" 
          align="start"
          onOpenAutoFocus={(e) => {
            // Prevent the popover from stealing focus and losing selection
            e.preventDefault();
          }}
        >
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
              autoFocus
                placeholder="Search classes... (e.g., 'text', 'bg', 'flex')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {filteredClasses.map((group) => (
                  <div key={group.category}>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                      {group.category}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {group.classes.map((cls) => (
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
                {filteredClasses.length === 0 && (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No classes found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

