/**
 * AISelectionMenu Component
 *
 * A Notion-style AI editing menu that appears when clicking the AI button
 * in the SelectionToolbar. Provides preset actions (rephrase, fix grammar,
 * change tone) and custom prompts for AI-powered text replacement.
 *
 * @packageDocumentation
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Check,
  X,
  Loader2,
  PenLine,
  SpellCheck,
  Minimize2,
  Maximize2,
  Briefcase,
  MessageCircle,
} from 'lucide-react';
import type { AIProvider } from '../lib/ai/types';
import type { SelectionInfo } from '../lib/types';
import { useEditorAI } from '../hooks/useEditorAI';
import { useEditorDispatch, EditorActions } from '../lib';

// ─── Preset Actions ──────────────────────────────────────────────────────────

interface PresetAction {
  label: string;
  icon: React.ReactNode;
  prompt: string;
}

const presetActions: PresetAction[] = [
  {
    label: 'Rephrase',
    icon: <PenLine className="h-3.5 w-3.5" />,
    prompt: 'Rephrase this text differently while keeping the same meaning',
  },
  {
    label: 'Fix grammar',
    icon: <SpellCheck className="h-3.5 w-3.5" />,
    prompt: 'Fix any grammar and spelling errors in this text',
  },
  {
    label: 'Make shorter',
    icon: <Minimize2 className="h-3.5 w-3.5" />,
    prompt: 'Make this text shorter while keeping the key message',
  },
  {
    label: 'Make longer',
    icon: <Maximize2 className="h-3.5 w-3.5" />,
    prompt: 'Expand this text with more detail while maintaining the same tone',
  },
  {
    label: 'Professional',
    icon: <Briefcase className="h-3.5 w-3.5" />,
    prompt: 'Rewrite this text in a professional, formal tone',
  },
  {
    label: 'Casual',
    icon: <MessageCircle className="h-3.5 w-3.5" />,
    prompt: 'Rewrite this text in a casual, friendly tone',
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type MenuState = 'idle' | 'generating' | 'preview';

export interface AISelectionMenuProps {
  selection: SelectionInfo;
  provider: AIProvider;
  defaultSystemPrompt?: string;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AISelectionMenu({
  selection,
  provider,
  defaultSystemPrompt,
  onClose,
}: AISelectionMenuProps) {
  const [menuState, setMenuState] = useState<MenuState>('idle');
  const [customPrompt, setCustomPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [result, setResult] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useEditorDispatch();

  const {
    replaceSelectionWithAI,
    isGenerating,
    streamingPreview,
    resetPreview,
    abort,
  } = useEditorAI({ provider, defaultSystemPrompt });

  // ── Run AI ─────────────────────────────────────────────────────────────────
  const runAI = useCallback(
    async (prompt: string) => {
      setLastPrompt(prompt);
      setMenuState('generating');
      resetPreview();

      try {
        const text = await replaceSelectionWithAI(prompt, selection);
        if (text) {
          setResult(text);
          setMenuState('preview');
        } else {
          setMenuState('idle');
        }
      } catch {
        setMenuState('idle');
      }
    },
    [replaceSelectionWithAI, selection, resetPreview],
  );

  // ── Accept result ──────────────────────────────────────────────────────────
  const handleAccept = useCallback(() => {
    if (!result) return;
    dispatch(
      EditorActions.replaceSelectionText(
        selection.nodeId,
        selection.start,
        selection.end,
        result,
      ),
    );
    onClose();
  }, [result, dispatch, selection, onClose]);

  // ── Discard ────────────────────────────────────────────────────────────────
  const handleDiscard = useCallback(() => {
    setResult('');
    resetPreview();
    setMenuState('idle');
  }, [resetPreview]);

  // ── Retry ──────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    if (lastPrompt) {
      runAI(lastPrompt);
    }
  }, [lastPrompt, runAI]);

  // ── Custom prompt submit ───────────────────────────────────────────────────
  const handleCustomSubmit = useCallback(() => {
    const trimmed = customPrompt.trim();
    if (!trimmed) return;
    runAI(trimmed);
    setCustomPrompt('');
  }, [customPrompt, runAI]);

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCustomSubmit();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [handleCustomSubmit, onClose],
  );

  // ── Idle State ─────────────────────────────────────────────────────────────
  if (menuState === 'idle') {
    return (
      <div className="w-[280px] border border-border bg-background/60 backdrop-blur-xl backdrop-saturate-150 shadow-2xl dark:bg-background/40">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground tracking-wide">AI Edit</span>
        </div>

        {/* Selected text preview */}
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs text-muted-foreground/60 mb-1">Selected text:</p>
          <p className="text-xs text-foreground/80 line-clamp-2">&ldquo;{selection.text}&rdquo;</p>
        </div>

        {/* Preset actions */}
        <div className="py-1">
          {presetActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => runAI(action.prompt)}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
            >
              <span className="text-muted-foreground">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>

        {/* Custom prompt */}
        <div className="border-t border-border px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder="Custom instruction..."
            className="w-full bg-transparent text-xs placeholder:text-muted-foreground/50 focus:outline-none"
            autoFocus
          />
        </div>
      </div>
    );
  }

  // ── Generating State ───────────────────────────────────────────────────────
  if (menuState === 'generating') {
    return (
      <div className="w-[320px] border border-border bg-background/60 backdrop-blur-xl backdrop-saturate-150 shadow-2xl dark:bg-background/40">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground tracking-wide">Generating...</span>
          <button
            type="button"
            onClick={() => {
              abort();
              setMenuState('idle');
            }}
            className="ml-auto text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Stop
          </button>
        </div>

        {/* Live preview */}
        <div className="px-3 py-3 max-h-[200px] overflow-y-auto">
          <p className="text-xs text-foreground/80 whitespace-pre-wrap">
            {streamingPreview || '...'}
          </p>
        </div>
      </div>
    );
  }

  // ── Preview State ──────────────────────────────────────────────────────────
  return (
    <div className="w-[340px] border border-border bg-background/60 backdrop-blur-xl backdrop-saturate-150 shadow-2xl dark:bg-background/40">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground tracking-wide">AI Result</span>
      </div>

      {/* Original */}
      <div className="px-3 py-2 border-b border-border">
        <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">Original</p>
        <p className="text-xs text-foreground/50 line-through line-clamp-2">{selection.text}</p>
      </div>

      {/* Result */}
      <div className="px-3 py-2 border-b border-border">
        <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1">Replacement</p>
        <p className="text-xs text-foreground">{result}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 px-3 py-2">
        <button
          type="button"
          onClick={handleAccept}
          className="inline-flex items-center gap-1 bg-foreground px-2.5 py-1 text-[11px] font-medium text-background transition-all hover:bg-foreground/90 active:scale-95"
        >
          <Check className="h-3 w-3" />
          Accept
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          className="inline-flex items-center gap-1 border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:bg-accent active:scale-95"
        >
          <X className="h-3 w-3" />
          Discard
        </button>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-1 border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:bg-accent active:scale-95"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    </div>
  );
}
