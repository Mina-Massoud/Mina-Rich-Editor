/**
 * Mina Rich Editor - useEditorAI Hook
 *
 * React hook that integrates AI content generation into the editor.
 * Manages streaming state, cancellation via AbortController, and
 * dispatches blocks into the editor tree via the store.
 *
 * @packageDocumentation
 */

'use client';

import { useState, useRef, useCallback } from 'react';
import type { AIProvider, AIStreamOptions } from '../lib/ai/types';
import type { SelectionInfo, InlineText } from '../lib/types';
import { streamToBlocks, parseInlineMarkdown } from '../lib/ai/stream-to-blocks';
import { useEditorDispatch, useActiveNodeId } from '../lib/store/editor-store';

/**
 * Configuration for {@link useEditorAI}.
 */
export interface UseEditorAIOptions {
  /** The AI provider to use for text generation. */
  provider: AIProvider;
  /** Default system prompt prepended to every generation request. */
  defaultSystemPrompt?: string;
}

/**
 * Return type of {@link useEditorAI}.
 */
export interface UseEditorAIReturn {
  /**
   * Generate AI content and stream it into the editor after the
   * currently active block (or a specified target block).
   */
  generateContent: (
    prompt: string,
    options?: AIStreamOptions,
    targetNodeId?: string,
  ) => Promise<void>;

  /**
   * Stream AI content for replacing selected text.
   * Returns the final replacement text and parsed InlineText[] children.
   * When `styled: true`, AI returns markdown-formatted text parsed into rich InlineText[].
   */
  replaceSelectionWithAI: (
    instruction: string,
    selection: SelectionInfo,
    options?: AIStreamOptions & { styled?: boolean },
  ) => Promise<{ text: string; children: InlineText[] }>;

  /** Whether a generation is currently in progress. */
  isGenerating: boolean;

  /** Live preview of streaming text (for selection replacement). */
  streamingPreview: string;

  /** Live preview of rich InlineText[] (for styled selection replacement). */
  streamingPreviewChildren: InlineText[];

  /** Reset the streaming preview. */
  resetPreview: () => void;

  /** Abort the current generation (no-op if not generating). */
  abort: () => void;
}

/**
 * Hook that provides AI content generation capabilities to the editor.
 */
export function useEditorAI(options: UseEditorAIOptions): UseEditorAIReturn {
  const { provider, defaultSystemPrompt } = options;

  const dispatch = useEditorDispatch();
  const activeNodeId = useActiveNodeId();
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingPreview, setStreamingPreview] = useState('');
  const [streamingPreviewChildren, setStreamingPreviewChildren] = useState<InlineText[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const resetPreview = useCallback(() => {
    setStreamingPreview('');
    setStreamingPreviewChildren([]);
  }, []);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const generateContent = useCallback(
    async (
      prompt: string,
      streamOptions?: AIStreamOptions,
      targetNodeId?: string,
    ) => {
      const targetId = targetNodeId ?? activeNodeId;
      if (!targetId) {
        console.warn(
          '[useEditorAI] No target node ID. Focus a block or pass targetNodeId.',
        );
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsGenerating(true);

      try {
        const fallbackSystemPrompt =
          'You are a content generator inside a rich text editor. Output ONLY clean markdown content. Rules:\n' +
          '- NO preamble (no "Here\'s...", "Sure!", "I\'d be happy to...")\n' +
          '- NO trailing summary or sign-off\n' +
          '- Start directly with the content\n' +
          '- Use proper markdown: # headings, - lists, ```code blocks```, **bold**, *italic*\n' +
          '- Each code block must use triple backtick fences on their own lines';

        const mergedOptions: AIStreamOptions = {
          ...streamOptions,
          systemPrompt:
            streamOptions?.systemPrompt ?? defaultSystemPrompt ?? fallbackSystemPrompt,
        };

        const rawStream = provider.stream(prompt, mergedOptions);

        async function* abortableStream(): AsyncIterable<string> {
          for await (const chunk of rawStream) {
            if (controller.signal.aborted) return;
            yield chunk;
          }
        }

        await streamToBlocks(abortableStream(), dispatch, targetId);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        console.error('[useEditorAI] Generation failed:', error);
        throw error;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsGenerating(false);
      }
    },
    [provider, defaultSystemPrompt, dispatch, activeNodeId],
  );

  const replaceSelectionWithAI = useCallback(
    async (
      instruction: string,
      selection: SelectionInfo,
      streamOptions?: AIStreamOptions & { styled?: boolean },
    ): Promise<{ text: string; children: InlineText[] }> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsGenerating(true);
      setStreamingPreview('');
      setStreamingPreviewChildren([]);

      const isStyled = streamOptions?.styled ?? false;

      try {
        const systemPrompt = isStyled
          ? 'You are a text editing assistant. Return ONLY the rewritten text. Use markdown: **bold**, *italic*, ~~strikethrough~~, `code` where appropriate. No explanations, no quotes.'
          : 'You are a text editing assistant. Return ONLY the rewritten text. No explanations, no markdown formatting, no quotes, no prefixes like "Here\'s...". Just the rewritten text itself.';

        const fullPrompt = `${instruction}\n\nText:\n${selection.text}`;

        const mergedOptions: AIStreamOptions = {
          ...streamOptions,
          systemPrompt:
            streamOptions?.systemPrompt ?? systemPrompt,
        };

        const rawStream = provider.stream(fullPrompt, mergedOptions);
        let accumulated = '';

        for await (const chunk of rawStream) {
          if (controller.signal.aborted) break;
          accumulated += chunk;
          setStreamingPreview(accumulated);
          if (isStyled) {
            setStreamingPreviewChildren(parseInlineMarkdown(accumulated));
          }
        }

        // Collapse newlines to spaces for inline replacement
        const finalText = accumulated.replace(/\n+/g, ' ').trim();
        setStreamingPreview(finalText);

        const children = isStyled
          ? parseInlineMarkdown(finalText)
          : [{ content: finalText }];
        setStreamingPreviewChildren(children);

        return { text: finalText, children };
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return { text: '', children: [] };
        }
        console.error('[useEditorAI] Selection replacement failed:', error);
        throw error;
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsGenerating(false);
      }
    },
    [provider],
  );

  return {
    generateContent,
    replaceSelectionWithAI,
    isGenerating,
    streamingPreview,
    streamingPreviewChildren,
    resetPreview,
    abort,
  };
}
