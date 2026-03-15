/**
 * Parse Markdown to Editor Nodes
 *
 * Converts a Markdown string into an array of EditorNode blocks.
 * Uses a simple line-by-line parser — no external dependencies.
 * Handles headings, paragraphs, lists, blockquotes, code blocks,
 * horizontal rules, images, tables, and inline formatting.
 */

import { EditorNode, InlineText, StructuralNode, TextNode } from '../types';
import { generateId } from './id-generator';
import { parseMarkdownTable, isMarkdownTable } from './markdown-table-parser';

// ============================================================================
// Public API
// ============================================================================

/**
 * Parses a Markdown string into an array of EditorNode blocks.
 *
 * @param markdown - The Markdown string to parse
 * @returns An array of EditorNode blocks representing the document
 *
 * @example
 * ```typescript
 * const nodes = parseMarkdownToNodes('# Hello\n\nWorld');
 * // [{ type: 'h1', content: 'Hello' }, { type: 'p', content: 'World' }]
 * ```
 */
export function parseMarkdownToNodes(markdown: string): EditorNode[] {
  const lines = markdown.split('\n');
  const nodes: EditorNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Empty lines ─────────────────────────────────────────────────────────
    if (line.trim() === '') {
      i++;
      continue;
    }

    // ── Fenced code block ───────────────────────────────────────────────────
    if (line.trimStart().startsWith('```')) {
      const result = parseFencedCodeBlock(lines, i);
      nodes.push(result.node);
      i = result.nextIndex;
      continue;
    }

    // ── Table detection ─────────────────────────────────────────────────────
    // Collect all consecutive pipe lines to form a potential table
    if (line.trim().startsWith('|')) {
      const result = parseTableBlock(lines, i);
      if (result.node) {
        nodes.push(result.node);
        i = result.nextIndex;
        continue;
      }
    }

    // ── Heading ─────────────────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6;
      const type = `h${level}` as TextNode['type'];
      const content = headingMatch[2].trim();
      nodes.push(makeTextNode(type, content));
      i++;
      continue;
    }

    // ── Horizontal rule ─────────────────────────────────────────────────────
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      nodes.push({ id: generateId('hr'), type: 'hr' } as TextNode);
      i++;
      continue;
    }

    // ── Blockquote ──────────────────────────────────────────────────────────
    const bqMatch = line.match(/^>\s?(.*)$/);
    if (bqMatch) {
      const content = bqMatch[1];
      nodes.push(makeTextNode('blockquote', content));
      i++;
      continue;
    }

    // ── Unordered list item ─────────────────────────────────────────────────
    const ulMatch = line.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      nodes.push(makeTextNode('li', ulMatch[1]));
      i++;
      continue;
    }

    // ── Ordered list item ───────────────────────────────────────────────────
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      nodes.push(makeTextNode('ol', olMatch[1]));
      i++;
      continue;
    }

    // ── Image ────────────────────────────────────────────────────────────────
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      const alt = imgMatch[1];
      const src = imgMatch[2];
      const node: TextNode = {
        id: generateId('img'),
        type: 'img',
        content: '',
        attributes: { src, alt },
      };
      nodes.push(node);
      i++;
      continue;
    }

    // ── Paragraph (everything else) ─────────────────────────────────────────
    nodes.push(makeTextNode('p', line));
    i++;
  }

  return nodes;
}

// ============================================================================
// Inline formatting parser
// ============================================================================

/**
 * Parses inline Markdown formatting markers in a content string.
 * Returns `children` array when formatting is found, or plain `content` string.
 *
 * Supported markers:
 * - `***text***` → bold + italic
 * - `**text**`  → bold
 * - `*text*`    → italic
 * - `` `text` `` → inline code
 * - `~~text~~`  → strikethrough
 * - `[text](url)` → link
 * - `<u>text</u>` → underline
 */
function parseInlineFormatting(
  text: string
): { content: string } | { children: InlineText[] } {
  // Quick check: if no formatting markers are present, return plain content
  const hasMarkers =
    text.includes('**') ||
    text.includes('*') ||
    text.includes('`') ||
    text.includes('~~') ||
    text.includes('[') ||
    text.includes('<u>');

  if (!hasMarkers) {
    return { content: text };
  }

  const segments = tokenizeInline(text);
  if (segments.length === 0) {
    return { content: text };
  }

  // If there's exactly one segment and it has no formatting flags, keep plain
  if (
    segments.length === 1 &&
    !segments[0].bold &&
    !segments[0].italic &&
    !segments[0].code &&
    !segments[0].strikethrough &&
    !segments[0].href &&
    !segments[0].underline
  ) {
    return { content: segments[0].content };
  }

  return { children: segments };
}

/**
 * Tokenizes inline markdown text into an array of InlineText segments.
 * Uses a simple regex-based approach with ordered pattern matching.
 */
function tokenizeInline(text: string): InlineText[] {
  const segments: InlineText[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Try to match any inline pattern at the current position

    // ── Bold + Italic: ***text*** ─────────────────────────────────────────
    const boldItalicMatch = remaining.match(/^\*{3}([^*]+)\*{3}/);
    if (boldItalicMatch) {
      segments.push({ content: boldItalicMatch[1], bold: true, italic: true });
      remaining = remaining.slice(boldItalicMatch[0].length);
      continue;
    }

    // ── Bold: **text** ─────────────────────────────────────────────────────
    const boldMatch = remaining.match(/^\*{2}([^*]+)\*{2}/);
    if (boldMatch) {
      segments.push({ content: boldMatch[1], bold: true });
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // ── Italic: *text* ─────────────────────────────────────────────────────
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      segments.push({ content: italicMatch[1], italic: true });
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // ── Inline code: `text` ────────────────────────────────────────────────
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      segments.push({ content: codeMatch[1], code: true });
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // ── Strikethrough: ~~text~~ ────────────────────────────────────────────
    const strikeMatch = remaining.match(/^~~([^~]+)~~/);
    if (strikeMatch) {
      segments.push({ content: strikeMatch[1], strikethrough: true });
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    // ── Link: [text](url) ──────────────────────────────────────────────────
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      segments.push({ content: linkMatch[1], href: linkMatch[2] });
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // ── Underline: <u>text</u> ─────────────────────────────────────────────
    const underlineMatch = remaining.match(/^<u>([^<]*)<\/u>/);
    if (underlineMatch) {
      segments.push({ content: underlineMatch[1], underline: true });
      remaining = remaining.slice(underlineMatch[0].length);
      continue;
    }

    // ── Plain text: consume up to the next possible marker ────────────────
    // Find the position of the next potential formatting character
    const nextMarker = findNextMarkerPosition(remaining);

    if (nextMarker === 0) {
      // Current char is a marker char but didn't match any pattern
      // Consume one character as plain text
      const lastSeg = segments[segments.length - 1];
      if (lastSeg && !lastSeg.bold && !lastSeg.italic && !lastSeg.code && !lastSeg.strikethrough && !lastSeg.href && !lastSeg.underline) {
        lastSeg.content += remaining[0];
      } else {
        segments.push({ content: remaining[0] });
      }
      remaining = remaining.slice(1);
    } else {
      const plainText = remaining.slice(0, nextMarker);
      const lastSeg = segments[segments.length - 1];
      if (lastSeg && !lastSeg.bold && !lastSeg.italic && !lastSeg.code && !lastSeg.strikethrough && !lastSeg.href && !lastSeg.underline) {
        lastSeg.content += plainText;
      } else {
        segments.push({ content: plainText });
      }
      remaining = remaining.slice(nextMarker);
    }
  }

  return segments.filter(seg => seg.content.length > 0);
}

/**
 * Finds the position of the next potential inline formatting marker.
 * Returns the length of `text` if no markers are found (consume all).
 */
function findNextMarkerPosition(text: string): number {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '*' || ch === '`' || ch === '~' || ch === '[' || ch === '<') {
      return i;
    }
  }
  return text.length;
}

// ============================================================================
// Node factory helpers
// ============================================================================

/**
 * Creates a TextNode with parsed inline formatting.
 * Uses `children` array when formatting markers are found, otherwise plain `content`.
 */
function makeTextNode(type: TextNode['type'], rawContent: string): TextNode {
  const parsed = parseInlineFormatting(rawContent);

  if ('children' in parsed) {
    return {
      id: generateId(type),
      type,
      children: parsed.children,
    };
  }

  return {
    id: generateId(type),
    type,
    content: parsed.content,
  };
}

// ============================================================================
// Fenced code block parser
// ============================================================================

function parseFencedCodeBlock(
  lines: string[],
  startIndex: number
): { node: EditorNode; nextIndex: number } {
  const openingLine = lines[startIndex];
  const langMatch = openingLine.match(/^```(\w*)$/);
  const lang = langMatch ? langMatch[1] : '';
  const codeLines: string[] = [];
  let i = startIndex + 1;

  while (i < lines.length) {
    if (lines[i].trimStart() === '```') {
      i++; // consume closing fence
      break;
    }
    codeLines.push(lines[i]);
    i++;
  }

  const node: TextNode = {
    id: generateId('code'),
    type: 'code',
    content: codeLines.join('\n'),
    attributes: lang ? { language: lang } : {},
  };

  return { node, nextIndex: i };
}

// ============================================================================
// Table block parser
// ============================================================================

function parseTableBlock(
  lines: string[],
  startIndex: number
): { node: EditorNode | null; nextIndex: number } {
  // Collect consecutive pipe-table lines
  let i = startIndex;
  const tableLines: string[] = [];

  while (i < lines.length && lines[i].trim().startsWith('|')) {
    tableLines.push(lines[i]);
    i++;
  }

  const tableText = tableLines.join('\n');

  if (!isMarkdownTable(tableText)) {
    return { node: null, nextIndex: startIndex };
  }

  const result = parseMarkdownTable(tableText);

  if (!result.success || !result.table) {
    // Fall through to paragraph parsing
    return { node: null, nextIndex: startIndex };
  }

  return { node: result.table as StructuralNode, nextIndex: i };
}
