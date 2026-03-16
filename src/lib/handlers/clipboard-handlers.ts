/**
 * Clipboard Event Handlers
 *
 * Functions for handling copy, cut, and paste events in the editor.
 * Supports pasting HTML (with formatting) and plain text.
 * Sanitizes all pasted HTML to prevent XSS.
 */

import { EditorActions, EditorAction } from '../reducer/actions';
import { ContainerNode, EditorNode } from '../types';
import { parseHtmlToNodes, parsePlainTextToNodes } from '../utils/html-to-nodes';
import { parseMarkdownToNodes } from '../utils/parse-markdown';

/** Parameters required by all clipboard handler factory functions. */
export interface ClipboardHandlerParams {
  getContainer: () => ContainerNode;
  getActiveNodeId: () => string | null;
  dispatch: React.Dispatch<EditorAction>;
}

// ============================================================================
// Markdown detection helpers
// ============================================================================

/**
 * Returns true if the text contains any Markdown patterns (block or inline).
 * Used for multi-line paste detection.
 */
function looksLikeMarkdown(text: string): boolean {
  return (
    /^#{1,6}\s/m.test(text) ||   // headings
    /^[-*]\s/m.test(text) ||      // unordered lists
    /^\d+\.\s/m.test(text) ||     // ordered lists
    /^>\s/m.test(text) ||         // blockquotes
    /^```/m.test(text) ||         // code fences
    /^---$/m.test(text) ||        // horizontal rules
    /\*\*.+\*\*/m.test(text) ||   // bold
    /\[.+\]\(.+\)/m.test(text)    // links
  );
}

/**
 * Returns true if the text starts with a block-level Markdown pattern.
 * Used for single-line paste detection — we intentionally exclude inline
 * markers like **bold** to avoid surprising conversions.
 */
function looksLikeMarkdownBlock(text: string): boolean {
  return (
    /^#{1,6}\s/.test(text) ||  // heading
    /^[-*]\s/.test(text) ||    // unordered list item
    /^\d+\.\s/.test(text) ||   // ordered list item
    /^>\s/.test(text) ||       // blockquote
    /^```/.test(text) ||       // code fence
    /^---$/.test(text)         // horizontal rule
  );
}

/**
 * Creates a copy handler.
 * Lets the browser handle the default copy behavior for selected text.
 * No override needed — contentEditable elements copy correctly by default.
 */
export function createHandleCopy(_params: ClipboardHandlerParams) {
  return (_e: React.ClipboardEvent<HTMLDivElement>) => {
    // The browser handles the default copy of selected DOM content natively.
  };
}

/**
 * Creates a paste handler.
 * Handles pasting HTML or plain text from external sources by converting
 * the clipboard content into EditorNodes and inserting them after the active node.
 *
 * Media file pastes (images/videos) are handled separately in Editor.tsx via
 * a document-level paste listener, so they are skipped here.
 */
export function createHandlePaste(params: ClipboardHandlerParams) {
  return (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!e.clipboardData) return;

    // If the clipboard contains media files, let the media paste handler in
    // Editor.tsx deal with it (it runs on the document-level paste listener).
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (
        item.kind === 'file' &&
        (item.type.startsWith('image/') || item.type.startsWith('video/'))
      ) {
        // Media files — skip; the document-level handler takes care of them
        return;
      }
    }

    // Get plain text first to check if it's single-line
    const text = e.clipboardData.getData('text/plain');
    const html = e.clipboardData.getData('text/html');
    const isMultiLine = text.includes('\n');

    // Single-line text that matches a block-level Markdown pattern (e.g.
    // "# My Title", "- item", "> quote"): convert it to the appropriate block.
    // We deliberately exclude inline-only markers like **bold** here — those
    // are better inserted as-is at the cursor.
    if (!isMultiLine && looksLikeMarkdownBlock(text)) {
      const nodes = parseMarkdownToNodes(text);
      if (nodes.length > 0) {
        e.preventDefault();
        insertPastedNodes(params, nodes);
        return;
      }
    }

    // Single-line text with no Markdown block syntax: let the browser handle
    // it natively. The browser's default paste inserts text at the cursor
    // position within the focused contenteditable element — exactly what
    // the user expects for inline paste.
    if (!isMultiLine) {
      return; // Don't preventDefault — browser does the right thing
    }

    // Multi-line paste: parse into blocks and insert after active node
    if (html) {
      const nodes = parseHtmlToNodes(html);
      if (nodes.length > 0) {
        e.preventDefault();
        insertPastedNodes(params, nodes);
        return;
      }
    }

    if (text) {
      // If the plain text looks like Markdown, parse it with the Markdown
      // parser so headings, lists, blockquotes, etc. become proper blocks.
      if (looksLikeMarkdown(text)) {
        const nodes = parseMarkdownToNodes(text);
        if (nodes.length > 0) {
          e.preventDefault();
          insertPastedNodes(params, nodes);
          return;
        }
      }

      // Regular plain text (no Markdown) — split on newlines into paragraphs
      const nodes = parsePlainTextToNodes(text);
      if (nodes.length > 0) {
        e.preventDefault();
        insertPastedNodes(params, nodes);
      }
    }
  };
}

/**
 * Creates a cut handler.
 * Lets the browser handle the default cut of selected DOM content.
 * Deletion of the selected text inside a contentEditable element is done
 * automatically by the browser; block deletions are handled by the keyboard handler.
 */
export function createHandleCut(_params: ClipboardHandlerParams) {
  return (_e: React.ClipboardEvent<HTMLDivElement>) => {
    // Browser handles the cut of selected text in contentEditable natively.
  };
}

/**
 * Insert an array of parsed nodes after the currently active node.
 */
function insertPastedNodes(params: ClipboardHandlerParams, nodes: EditorNode[]) {
  const activeNodeId = params.getActiveNodeId();
  const container = params.getContainer();

  // Determine insertion target: active node, or last child of container
  const targetId =
    activeNodeId || container.children[container.children.length - 1]?.id;

  if (!targetId) return;

  if (nodes.length === 1) {
    params.dispatch(EditorActions.insertNode(nodes[0], targetId, 'after'));
  } else {
    // Build a batch of sequential inserts
    const actions: EditorAction[] = nodes.map((node, i) => {
      const insertAfter = i === 0 ? targetId : nodes[i - 1].id;
      return EditorActions.insertNode(node, insertAfter, 'after');
    });
    params.dispatch(EditorActions.batch(actions));
  }
}
