/**
 * AICommandMenu Component
 *
 * A sharp-styled AI prompt modal that appears when selecting
 * "AI Generate" from the CommandMenu. Streams AI-generated content
 * into the editor as live blocks.
 *
 * @packageDocumentation
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import type { AIProvider } from '../lib/ai/types';
import { useEditorAI } from '../hooks/useEditorAI';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AICommandMenuProps {
  /** Whether the menu is open. */
  isOpen: boolean;
  /** Called when the menu should close (Escape, click-outside, after submit). */
  onClose: () => void;
  /** The AI provider to use for generation. */
  provider: AIProvider;
  /** Default system prompt for generation. */
  defaultSystemPrompt?: string;
  /** ID of the block to insert AI content after. */
  targetNodeId: string;
  /** The DOM element to position the menu relative to. */
  anchorElement: HTMLElement | null;
}

/**
 * AICommandMenu — a sharp-styled AI prompt input.
 *
 * Activated via the CommandMenu's "AI Generate" option. The user types
 * a prompt, presses Enter (or clicks Generate), and AI content streams
 * in below the current block.
 */
export function AICommandMenu({
  isOpen,
  onClose,
  provider,
  defaultSystemPrompt,
  targetNodeId,
  anchorElement,
}: AICommandMenuProps) {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const { generateContent, isGenerating, abort } = useEditorAI({
    provider,
    defaultSystemPrompt,
  });

  // ── Focus input when menu opens ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ── Close on Escape ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (isGenerating) {
          abort();
        } else {
          onClose();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isGenerating, abort, onClose]);

  // ── Close on click outside ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorElement &&
        !anchorElement.contains(e.target as Node)
      ) {
        if (isGenerating) {
          abort();
        }
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isGenerating, abort, onClose, anchorElement]);

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || isGenerating) return;

    try {
      await generateContent(trimmed, undefined, targetNodeId);
    } catch {
      // Error is already logged inside useEditorAI
    } finally {
      onClose();
    }
  }, [prompt, isGenerating, generateContent, targetNodeId, onClose]);

  // ── Keyboard shortcut: Enter to submit, Shift+Enter for newline ─────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  // ── Position calculation ─────────────────────────────────────────────────
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (!isOpen || !anchorElement) return;

    const rect = anchorElement.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
    });
  }, [isOpen, anchorElement]);

  // ── Don't render when closed ─────────────────────────────────────────────
  if (!isOpen || !anchorElement) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-[420px] border border-border bg-background/60 backdrop-blur-xl backdrop-saturate-150 p-4 text-foreground shadow-2xl dark:bg-background/40 dark:border-border"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center bg-foreground">
          <Sparkles className="h-3.5 w-3.5 text-background" />
        </div>
        <span className="text-sm font-semibold tracking-wide">AI Generate</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Prompt input */}
      <textarea
        ref={inputRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe what you want to write..."
        disabled={isGenerating}
        rows={3}
        className="w-full resize-none border border-border bg-background/50 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow"
      />

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground/70">
          {isGenerating ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </span>
          ) : (
            'Enter to generate, Esc to cancel'
          )}
        </span>
        <div className="flex gap-2">
          {isGenerating ? (
            <button
              type="button"
              onClick={abort}
              className="inline-flex items-center bg-red-500/20 px-3.5 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/30 active:scale-95"
            >
              Stop
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center border border-border px-3.5 py-1.5 text-xs font-medium transition-all hover:bg-accent active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!prompt.trim()}
                className="inline-flex items-center gap-1.5 bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-all hover:bg-foreground/90 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                <Sparkles className="h-3 w-3" />
                Generate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
