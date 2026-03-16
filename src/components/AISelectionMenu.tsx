/**
 * AISelectionMenu Component
 *
 * A Notion-style AI editing menu that appears when clicking the AI button
 * in the SelectionToolbar. Provides preset actions (rephrase, fix grammar,
 * change tone) and custom prompts for AI-powered text replacement.
 * Supports styled mode for AI-powered formatting (bold, italic, code).
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
  Highlighter,
  Type,
  Code,
} from 'lucide-react';
import type { AIProvider } from '../lib/ai/types';
import type { SelectionInfo, InlineText } from '../lib/types';
import { useEditorAI } from '../hooks/useEditorAI';
import { useEditorDispatch, EditorActions } from '../lib';

// ─── Preset Actions ──────────────────────────────────────────────────────────

interface PresetAction {
  label: string;
  icon: React.ReactNode;
  prompt: string;
  styled?: boolean;
}

const rewritePresets: PresetAction[] = [
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

const stylePresets: PresetAction[] = [
  {
    label: 'Emphasize key words',
    icon: <Highlighter className="h-3.5 w-3.5" />,
    prompt: 'Add **bold** to the most important words/phrases. Keep text otherwise identical.',
    styled: true,
  },
  {
    label: 'Add emphasis',
    icon: <Type className="h-3.5 w-3.5" />,
    prompt: 'Add **bold** and *italic* to emphasize key concepts. Keep text otherwise identical.',
    styled: true,
  },
  {
    label: 'Code terms',
    icon: <Code className="h-3.5 w-3.5" />,
    prompt: 'Wrap technical terms, function names, and code references in `backticks`. Keep text otherwise identical.',
    styled: true,
  },
];

// ─── Rich Preview Component ─────────────────────────────────────────────────

function RichPreview({ children }: { children: InlineText[] }) {
  return (
    <span>
      {children.map((segment, i) => {
        let el: React.ReactNode = segment.content;
        if (segment.bold) el = <strong key={i}>{el}</strong>;
        if (segment.italic) el = <em key={i}>{el}</em>;
        if (segment.code) el = <code key={i} className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono">{el}</code>;
        if (segment.strikethrough) el = <s key={i}>{el}</s>;
        if (segment.underline) el = <u key={i}>{el}</u>;
        // If none of the above wrapped, use a fragment with key
        if (typeof el === 'string') el = <span key={i}>{el}</span>;
        return el;
      })}
    </span>
  );
}

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
  const [lastStyled, setLastStyled] = useState(false);
  const [result, setResult] = useState('');
  const [isStyledResult, setIsStyledResult] = useState(false);
  const [resultChildren, setResultChildren] = useState<InlineText[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useEditorDispatch();

  const {
    replaceSelectionWithAI,
    isGenerating,
    streamingPreview,
    streamingPreviewChildren,
    resetPreview,
    abort,
  } = useEditorAI({ provider, defaultSystemPrompt });

  // ── Run AI ─────────────────────────────────────────────────────────────────
  const runAI = useCallback(
    async (prompt: string, styled = false) => {
      setLastPrompt(prompt);
      setLastStyled(styled);
      setMenuState('generating');
      setIsStyledResult(styled);
      resetPreview();

      try {
        const { text, children } = await replaceSelectionWithAI(prompt, selection, { styled });
        if (text) {
          setResult(text);
          setResultChildren(children);
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
    if (isStyledResult && resultChildren.length > 0) {
      dispatch(
        EditorActions.replaceSelectionWithInlines(
          selection.nodeId,
          selection.start,
          selection.end,
          resultChildren,
        ),
      );
    } else {
      dispatch(
        EditorActions.replaceSelectionText(
          selection.nodeId,
          selection.start,
          selection.end,
          result,
        ),
      );
    }
    onClose();
  }, [result, isStyledResult, resultChildren, dispatch, selection, onClose]);

  // ── Discard ────────────────────────────────────────────────────────────────
  const handleDiscard = useCallback(() => {
    setResult('');
    setResultChildren([]);
    setIsStyledResult(false);
    resetPreview();
    setMenuState('idle');
  }, [resetPreview]);

  // ── Retry ──────────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    if (lastPrompt) {
      runAI(lastPrompt, lastStyled);
    }
  }, [lastPrompt, lastStyled, runAI]);

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

  // ── Preset button renderer ────────────────────────────────────────────────
  const renderPreset = (action: PresetAction) => (
    <button
      key={action.label}
      type="button"
      onClick={() => runAI(action.prompt, action.styled)}
      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
    >
      <span className="text-muted-foreground">{action.icon}</span>
      {action.label}
    </button>
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

        {/* Rewrite presets */}
        <div className="py-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 px-3 pt-2 pb-1">Rewrite</p>
          {rewritePresets.map(renderPreset)}
        </div>

        {/* Style presets */}
        <div className="py-1 border-t border-border">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 px-3 pt-2 pb-1">Style</p>
          {stylePresets.map(renderPreset)}
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
          {isStyledResult && streamingPreviewChildren.length > 0 ? (
            <span className="text-xs text-foreground/80">
              <RichPreview>{streamingPreviewChildren}</RichPreview>
            </span>
          ) : (
            <p className="text-xs text-foreground/80 whitespace-pre-wrap">
              {streamingPreview || '...'}
            </p>
          )}
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
        {isStyledResult && resultChildren.length > 0 ? (
          <span className="text-xs text-foreground">
            <RichPreview>{resultChildren}</RichPreview>
          </span>
        ) : (
          <p className="text-xs text-foreground">{result}</p>
        )}
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
