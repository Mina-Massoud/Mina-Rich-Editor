/**
 * useEditorAPI — Programmatic CMS Integration API
 *
 * Gives CMS consumers a clean way to get/set editor content in any format
 * (JSON, HTML, Markdown, plain text) without coupling to internal store shape.
 *
 * All getter functions are non-reactive: they read from `store.getState()`
 * at call time and will never cause a component re-render.
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const api = useEditorAPI();
 *
 *   const handleSave = () => {
 *     fetch('/api/save', {
 *       method: 'POST',
 *       body: JSON.stringify({ html: api.getHTML(), json: api.getJSON() }),
 *     });
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 */

import { useRef } from 'react';
import { ContainerNode, EditorNode, TextNode, isTextNode } from '../lib/types';
import { serializeToSemanticHtml } from '../lib/utils/serialize-semantic-html';
import { useEditorStoreInstance } from '../lib/store/editor-store';

// ---------------------------------------------------------------------------
// Markdown serializer — loaded once via require so a missing file in a
// consumer's environment never breaks the module at load time.
// ---------------------------------------------------------------------------

let _serializeToMarkdown: ((container: ContainerNode) => string) | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../lib/utils/serialize-markdown');
  if (mod && typeof mod.serializeToMarkdown === 'function') {
    _serializeToMarkdown = mod.serializeToMarkdown;
  }
} catch {
  // Module not available — getMarkdown() will return '' and warn the caller.
}

// ---------------------------------------------------------------------------
// Plain-text walker
// ---------------------------------------------------------------------------

/**
 * Recursively walks all nodes in a tree and concatenates text content,
 * separating blocks with newlines.
 */
function extractPlainText(node: EditorNode): string {
  if (isTextNode(node)) {
    const textNode = node as TextNode;

    // Multi-line nodes (e.g. ordered lists)
    if (textNode.lines && textNode.lines.length > 0) {
      return textNode.lines
        .map((line) => {
          if (line.children && line.children.length > 0) {
            return line.children.map((c) => c.content).join('');
          }
          return line.content ?? '';
        })
        .join('\n');
    }

    // Inline-children (rich text, single line)
    if (textNode.children && textNode.children.length > 0) {
      return textNode.children.map((c) => c.content).join('');
    }

    // Simple content
    return textNode.content ?? '';
  }

  // Container / structural node — recurse
  if ('children' in node && Array.isArray((node as ContainerNode).children)) {
    return (node as ContainerNode).children
      .map(extractPlainText)
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface EditorAPI {
  /** Returns the document as JSON (the native block model). */
  getJSON: () => ContainerNode;

  /** Returns the document as clean semantic HTML (no Tailwind classes). */
  getHTML: () => string;

  /**
   * Returns the document as Markdown.
   * Logs a warning and returns '' if the Markdown serializer is unavailable.
   */
  getMarkdown: () => string;

  /** Replaces the entire editor content with the provided container. */
  setContent: (content: ContainerNode) => void;

  /**
   * Returns true if the document has been modified from its initial state
   * (any edits have been pushed onto the undo history stack).
   */
  isDirty: () => boolean;

  /** Returns the number of top-level blocks in the document. */
  getBlockCount: () => number;

  /** Returns all text content concatenated as plain text. */
  getPlainText: () => string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Hook that provides programmatic access to editor content in all formats.
 *
 * Must be called inside an `<EditorProvider>` tree.
 *
 * Design notes:
 * - Uses `store.getState()` (via `useEditorStoreInstance`) for all reads so
 *   that NO reactive subscription is created — the hook itself never causes
 *   a re-render.
 * - The returned `EditorAPI` object is stable across renders (held in a ref).
 */
export function useEditorAPI(): EditorAPI {
  // Grab the raw Zustand store instance from context. This does NOT subscribe
  // to state — it only gives us access to getState() and dispatch().
  const store = useEditorStoreInstance();

  // Keep a stable API object so callers can destructure once.
  const apiRef = useRef<EditorAPI | null>(null);

  if (!apiRef.current) {
    apiRef.current = {
      getJSON(): ContainerNode {
        const state = store.getState();
        return state.current;
      },

      getHTML(): string {
        const state = store.getState();
        const container = state.current;
        return serializeToSemanticHtml(container);
      },

      getMarkdown(): string {
        if (!_serializeToMarkdown) {
          console.warn(
            '[useEditorAPI] getMarkdown(): Markdown serializer is not available. ' +
              'Ensure `src/lib/utils/serialize-markdown.ts` exports `serializeToMarkdown`.'
          );
          return '';
        }
        const state = store.getState();
        const container = state.current;
        return _serializeToMarkdown(container);
      },

      setContent(content: ContainerNode): void {
        store.getState().dispatch({
          type: 'REPLACE_CONTAINER',
          payload: { container: content },
        });
      },

      isDirty(): boolean {
        return store.getState().undoStack.length > 0;
      },

      getBlockCount(): number {
        const state = store.getState();
        const container = state.current;
        return container.children.length;
      },

      getPlainText(): string {
        const state = store.getState();
        const container = state.current;
        return extractPlainText(container);
      },
    };
  }

  return apiRef.current;
}
