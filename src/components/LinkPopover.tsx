/**
 * LinkPopover Component
 * 
 * A floating popover that appears on text selection, allowing users to add/edit/remove links
 * Uses useEditor internally to access and modify the editor state
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Link as LinkIcon, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { useEditor, EditorActions } from '../lib';
import { useToast } from '@/hooks/use-toast';
import { AnimatePresence, motion } from 'framer-motion';

export function LinkPopover() {
  const [state, dispatch] = useEditor();
  const { toast } = useToast();
  const [hrefInput, setHrefInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  
  // Store the selection in a ref so it persists when focus changes
  const savedSelectionRef = useRef<{
    nodeId: string;
    start: number;
    end: number;
    text: string;
    href?: string | null;
    formats: {
      bold: boolean;
      italic: boolean;
      underline: boolean;
    };
    elementType?: 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'code' | 'blockquote' | null;
    className?: string | null;
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
        href: state.currentSelection.href,
        formats: state.currentSelection.formats,
        elementType: state.currentSelection.elementType,
        className: state.currentSelection.className,
      };
      
      // Pre-fill the href input if selection has an existing link
      if (state.currentSelection.href && !isOpen) {
        setHrefInput(state.currentSelection.href);
      }
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Find the editor container (the parent with relative positioning)
        const editorContainer = document
          .querySelector("[data-editor-content]")
          ?.closest(".relative");
        const containerRect = editorContainer?.getBoundingClientRect();

        if (containerRect) {
          // Calculate position relative to the editor container
          setPosition({
            top: rect.top - containerRect.top - 45, // 45px above the selection, relative to container
            left: rect.left - containerRect.left + rect.width / 2 + 16, // Offset to the right, relative to container
          });
        } else {
          // Fallback to old behavior if container not found
          setPosition({
            top: rect.top + window.scrollY - 45,
            left: rect.left + window.scrollX + (rect.width / 2) + 16,
          });
        }
      }
    } else {
      // Only clear position if we don't have a saved selection and popover is closed
      if (!isOpen) {
        setPosition(null);
        savedSelectionRef.current = null;
      }
    }
  }, [state.currentSelection, state.selectionKey, isOpen]);

  // Handle link application
  const handleApplyLink = () => {
    // Use saved selection from ref instead of state
    if (!savedSelectionRef.current || !hrefInput.trim()) return;

    // Temporarily restore the selection in state for the action
    dispatch(EditorActions.setCurrentSelection(savedSelectionRef.current));

    // Apply the link
    setTimeout(() => {
      dispatch(EditorActions.applyLink(hrefInput.trim()));
      
      toast({
        title: 'Link Applied',
        description: `Linked to: ${hrefInput}`,
      });

      setHrefInput('');
      setIsOpen(false);
      setPosition(null);
      savedSelectionRef.current = null;
    }, 0);
  };

  // Handle link removal
  const handleRemoveLink = () => {
    // Use saved selection from ref instead of state
    if (!savedSelectionRef.current) return;

    // Temporarily restore the selection in state for the action
    dispatch(EditorActions.setCurrentSelection(savedSelectionRef.current));

    // Remove the link
    setTimeout(() => {
      dispatch(EditorActions.removeLink());
      
      toast({
        title: 'Link Removed',
        description: 'Link has been removed from selection',
      });

      setHrefInput('');
      setIsOpen(false);
      setPosition(null);
      savedSelectionRef.current = null;
    }, 0);
  };

  const hasExistingLink = savedSelectionRef.current?.href;

  return (
    <AnimatePresence mode="wait">
      {position && (
        <motion.div
      key={position.top + position.left}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${
            position ? "opacity-100" : "!opacity-0"
          } transition-opacity duration-300 absolute z-50 pointer-events-auto`}
          style={{
            top: `${position?.top || 0}px`,
            left: `${position?.left || 0}px`,
          }}
          exit={{ opacity: 0 }}
        >
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button
                data-link-popover-trigger
                className={`h-8 w-8 flex items-center justify-center rounded-full shadow-lg hover:scale-110 transition-all bg-background border-2 ${
                  hasExistingLink 
                    ? 'border-blue-500 text-blue-500' 
                    : 'border-border hover:border-primary'
                }`}
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
                <LinkIcon className="size-4" />
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
                  <h4 className="font-medium text-sm mb-1">
                    {hasExistingLink ? 'Edit Link' : 'Add Link'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Selected text: "{savedSelectionRef.current?.text}"
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="href-input" className="text-xs">
                    Link URL
                  </Label>
                  <Input
                    id="href-input"
                    placeholder="https://example.com"
                    value={hrefInput}
                    onChange={(e) => setHrefInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyLink();
                      }
                    }}
                    className="flex-1"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApplyLink}
                    disabled={!hrefInput.trim()}
                    size="sm"
                    className="flex-1"
                  >
                    <LinkIcon className="size-3.5 mr-1.5" />
                    {hasExistingLink ? 'Update' : 'Add Link'}
                  </Button>
                  {hasExistingLink && (
                    <Button
                      onClick={handleRemoveLink}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

