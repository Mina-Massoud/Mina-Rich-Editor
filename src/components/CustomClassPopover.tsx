/**
 * CustomClassPopover Component
 * 
 * A floating popover that appears on text selection, allowing users to apply custom Tailwind classes
 * Uses useEditor internally to access and modify the editor state
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useEditor, EditorActions } from '../lib';
import { useToast } from '@/hooks/use-toast';

export function CustomClassPopover() {
  const [state, dispatch] = useEditor();
  const { toast } = useToast();
  const [customClassInput, setCustomClassInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Store the selection in a ref so it persists when focus changes
  const savedSelectionRef = useRef<{
    nodeId: string;
    start: number;
    end: number;
    text: string;
  } | null>(null);

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

  // Handle custom class application
  const handleApplyCustomClass = () => {
    // Use saved selection from ref instead of state
    if (!savedSelectionRef.current || !customClassInput.trim()) return;

    // Temporarily restore the selection in state for the action
    dispatch(EditorActions.setCurrentSelection({
      ...savedSelectionRef.current,
      formats: { bold: false, italic: false, underline: false },
    }));

    // Apply the custom class
    setTimeout(() => {
      dispatch(EditorActions.applyCustomClass(customClassInput.trim()));
      
      toast({
        title: 'Custom Class Applied',
        description: `Applied class: ${customClassInput}`,
      });

      setCustomClassInput('');
      setIsOpen(false);
      setPosition(null);
      savedSelectionRef.current = null;
    }, 0);
  };

  // Handle quick style application
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

  if (!position) return null;

  return (
    <div
      className="fixed z-50 pointer-events-auto"
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
          className="w-80" 
          align="start"
          onOpenAutoFocus={(e) => {
            // Prevent the popover from stealing focus and losing selection
            e.preventDefault();
          }}
        >
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm mb-1">Add Custom Class</h4>
              <p className="text-xs text-muted-foreground">
                Type any custom class or style to apply
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., text-red-500, bg-blue-100"
                value={customClassInput}
                onChange={(e) => setCustomClassInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyCustomClass();
                  }
                }}
                className="flex-1"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                onClick={handleApplyCustomClass}
                disabled={!customClassInput.trim()}
                size="sm"
              >
                Save
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium">Quick Styles:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'text-red-500',
                  'text-blue-500',
                  'text-green-500',
                  'bg-yellow-100',
                  'font-bold',
                  'underline',
                  'text-2xl',
                  'opacity-50',
                ].map((cls) => (
                  <Button
                    key={cls}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickStyle(cls)}
                    className="text-xs h-7"
                  >
                    {cls}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

