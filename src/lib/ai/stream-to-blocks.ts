/**
 * Mina Rich Editor - Stream-to-Blocks Converter
 *
 * Transforms a streaming `AsyncIterable<string>` from an AI provider into
 * live editor blocks. Tracks which lines have been processed so each
 * complete line is handled exactly once, while the partial (last) line
 * provides a live typing preview.
 *
 * @packageDocumentation
 */

import type { EditorAction } from '../reducer/actions';
import type { TextNode, NodeType, InlineText, NodeAttributes } from '../types';
import { generateId } from '../utils/id-generator';

// ─── Inline Markdown Parsing ─────────────────────────────────────────────────

/**
 * Strip orphaned markdown markers (e.g. standalone `**`, `~~`) that the LLM
 * left unclosed. Only removes markers that don't have a matching closing pair.
 */
function cleanOrphanedMarkers(text: string): string {
  // Count occurrences of each marker. Odd count means one is orphaned.
  const markers = ['**', '~~'] as const;
  let cleaned = text;
  for (const marker of markers) {
    // Split by the marker — if odd number of segments, there's an orphaned one
    const parts = cleaned.split(marker);
    if (parts.length % 2 === 0) {
      // Odd number of markers (even number of parts) — remove the last orphaned one
      const lastIdx = cleaned.lastIndexOf(marker);
      cleaned = cleaned.slice(0, lastIdx) + cleaned.slice(lastIdx + marker.length);
    }
  }
  return cleaned.trim();
}

/** Parse inline markdown formatting into InlineText children. */
export function parseInlineMarkdown(text: string): InlineText[] {
  if (!text) return [{ content: text }];

  // Clean up orphaned markers before parsing
  const cleaned = cleanOrphanedMarkers(text);
  if (!cleaned) return [{ content: '' }];

  const segments: InlineText[] = [];
  const inlineRe = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|~~(.+?)~~)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRe.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ content: cleaned.slice(lastIndex, match.index) });
    }

    if (match[2] !== undefined) {
      segments.push({ content: match[2], bold: true });
    } else if (match[3] !== undefined) {
      segments.push({ content: match[3], italic: true });
    } else if (match[4] !== undefined) {
      segments.push({ content: match[4], code: true });
    } else if (match[5] !== undefined) {
      segments.push({ content: match[5], strikethrough: true });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleaned.length) {
    segments.push({ content: cleaned.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ content: cleaned }];
}

export function hasInlineFormatting(text: string): boolean {
  return /(\*\*.+?\*\*|\*[^*]+?\*|`.+?`|~~.+?~~)/.test(text);
}

// ─── Block Helpers ───────────────────────────────────────────────────────────

function parseLineType(raw: string): { type: NodeType; content: string; attributes?: NodeAttributes } {
  if (raw.startsWith('### ')) return { type: 'h3', content: raw.slice(4) };
  if (raw.startsWith('## ')) return { type: 'h2', content: raw.slice(3) };
  if (raw.startsWith('# ')) return { type: 'h1', content: raw.slice(2) };
  if (/^[-*+] /.test(raw)) return { type: 'li', content: raw.slice(2) };
  if (/^\d+\.\s/.test(raw)) return { type: 'li', content: raw.replace(/^\d+\.\s/, '') };
  if (raw.startsWith('> ')) return { type: 'blockquote', content: raw.slice(2) };
  if (/^---+$/.test(raw.trim()) || /^\*\*\*+$/.test(raw.trim())) return { type: 'hr', content: '' };

  const imgMatch = raw.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (imgMatch) return { type: 'img', content: '', attributes: { src: imgMatch[2], alt: imgMatch[1] } };

  return { type: 'p', content: raw };
}

function createBlock(type: NodeType, content: string, attributes?: NodeAttributes): TextNode {
  return {
    id: generateId(type),
    type: type as TextNode['type'],
    content,
    ...(attributes && { attributes }),
  };
}

// ─── Preamble detection ─────────────────────────────────────────────────────

/** Common AI preamble patterns that should be stripped from the beginning of output. */
const PREAMBLE_PATTERNS = [
  /^here['']?s?\s/i,
  /^sure[!,.\s]/i,
  /^of course[!,.\s]/i,
  /^i['']?d be happy to/i,
  /^i['']?ll /i,
  /^let me /i,
  /^absolutely[!,.\s]/i,
  /^certainly[!,.\s]/i,
  /^great[!,.\s]/i,
];

function isPreambleLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return PREAMBLE_PATTERNS.some((re) => re.test(trimmed));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/**
 * Consumes an AI text stream and dispatches editor actions to build
 * blocks in real-time with a live typing effect.
 */
export async function streamToBlocks(
  stream: AsyncIterable<string>,
  dispatch: (action: EditorAction) => void,
  targetId: string,
): Promise<void> {
  let fullText = '';

  // Ordered list of block IDs we've inserted, used to find the insertion point.
  const insertedBlockIds: string[] = [];
  // Wrap in object to avoid TS closure narrowing on `let` across functions.
  const s = { block: null as TextNode | null };
  // How many complete lines we've already converted into finalized blocks.
  let processedLineCount = 0;
  // Code fence state
  let inCodeBlock = false;
  let codeBlockContent = '';
  // Content from finalized complete lines only — prevents partial preview
  // from being double-counted when the partial line becomes complete.
  let committedContent = '';
  // Whether we've seen real content yet (for preamble stripping)
  let pastPreamble = false;

  function lastInsertedId(): string {
    return insertedBlockIds.length > 0
      ? insertedBlockIds[insertedBlockIds.length - 1]
      : targetId;
  }

  /** Finalize the current block: apply inline formatting, mark as done. */
  function finalizeBlock(): void {
    if (!s.block) return;

    // Apply inline formatting on finalization
    if (s.block.type !== 'pre' && s.block.type !== 'img' && hasInlineFormatting(s.block.content ?? '')) {
      dispatch({
        type: 'UPDATE_NODE',
        payload: {
          id: s.block.id,
          updates: { children: parseInlineMarkdown(s.block.content ?? '') } as any,
        },
      });
    }

    insertedBlockIds.push(s.block.id);
    committedContent = '';
    s.block = null;
  }

  /** Insert a brand-new block after the last inserted one. */
  function insertBlock(type: NodeType, content: string, attributes?: NodeAttributes): void {
    finalizeBlock();

    const block = createBlock(type, content, attributes);
    s.block = block;
    committedContent = content;

    dispatch({
      type: 'INSERT_NODE',
      payload: { node: block, targetId: lastInsertedId(), position: 'after' },
    });
  }

  /** Update the live-preview content of the current block. */
  function updateContent(content: string): void {
    if (!s.block) return;
    s.block = { ...s.block, content };
    dispatch({
      type: 'UPDATE_CONTENT',
      payload: { id: s.block.id, content },
    });
  }

  /** Update the current block's type in-place (e.g. p → h2). */
  function updateType(type: NodeType, content: string): void {
    if (!s.block) return;
    s.block = { ...s.block, type: type as TextNode['type'], content };
    dispatch({
      type: 'UPDATE_NODE',
      payload: { id: s.block.id, updates: { type, content } as any },
    });
  }

  // ── Stream loop ─────────────────────────────────────────────────────────

  for await (const chunk of stream) {
    fullText += chunk;

    const lines = fullText.split('\n');
    // Everything except the last element is a complete line.
    const completeLines = lines.slice(0, -1);
    const partialLine = lines[lines.length - 1];

    // ── Process only NEW complete lines ──────────────────────────────────
    for (let i = processedLineCount; i < completeLines.length; i++) {
      const line = completeLines[i];

      // Code fence toggle
      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = '';
        } else {
          // Closing fence — finalize code block
          inCodeBlock = false;
          if (s.block?.type === 'pre') {
            updateContent(codeBlockContent);
            finalizeBlock();
          } else {
            insertBlock('pre', codeBlockContent);
            finalizeBlock();
          }
          codeBlockContent = '';
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent += (codeBlockContent ? '\n' : '') + line;
        // Live update the code block
        if (s.block?.type === 'pre') {
          updateContent(codeBlockContent);
        } else {
          insertBlock('pre', codeBlockContent);
        }
        continue;
      }

      // Blank line → finalize current block (paragraph break)
      if (line.trim() === '') {
        finalizeBlock();
        continue;
      }

      // Strip preamble lines at the start of the response
      if (!pastPreamble) {
        if (isPreambleLine(line)) continue;
        pastPreamble = true;
      }

      // Regular content line
      const { type, content, attributes } = parseLineType(line);

      // Skip empty content (e.g. bare `- ` with no text, or standalone `**`)
      if (!content.trim() && type !== 'hr') continue;

      if (!s.block) {
        insertBlock(type, content, attributes);
      } else if (s.block.type === type && type === 'p') {
        // Continue same paragraph — append using committed content
        // (not s.block.content which may include partial preview text)
        committedContent = committedContent + ' ' + content;
        updateContent(committedContent);
      } else {
        // Different type — new block
        insertBlock(type, content, attributes);
      }
    }

    processedLineCount = completeLines.length;

    // ── Live-preview the partial line ────────────────────────────────────
    if (!partialLine) continue;

    if (inCodeBlock) {
      // Inside code fence — show partial code
      const preview = codeBlockContent + (codeBlockContent ? '\n' : '') + partialLine;
      if (s.block?.type === 'pre') {
        updateContent(preview);
      } else {
        insertBlock('pre', preview);
      }
      continue;
    }

    const { type, content, attributes } = parseLineType(partialLine);

    if (!s.block) {
      // No block yet — create one for the partial line
      insertBlock(type, content, attributes);
    } else {
      // Update existing block with partial content.
      // If the type changed (e.g. `#` paragraph → `## ` heading), update in-place.
      if (type !== s.block.type) {
        updateType(type, content);
      } else if (type === 'p' && committedContent) {
        // Paragraph continuation preview — use committed base to avoid duplication
        updateContent(committedContent + ' ' + content);
      } else {
        updateContent(content);
      }
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────

  // Close any unclosed code fence
  if (inCodeBlock && codeBlockContent) {
    if (s.block?.type === 'pre') {
      updateContent(codeBlockContent);
    } else {
      insertBlock('pre', codeBlockContent);
    }
  }

  finalizeBlock();
}
