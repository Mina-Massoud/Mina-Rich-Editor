/**
 * Serialize Editor State to Markdown
 *
 * Converts the editor's block model to standard Markdown text.
 * Handles all block types, inline formatting, lists, tables, images, and more.
 */

import {
  ContainerNode,
  StructuralNode,
  TextNode,
  EditorNode,
  InlineText,
  isTextNode,
  isContainerNode,
  isStructuralNode,
  hasInlineChildren,
} from '../types';

// ============================================================================
// Public API
// ============================================================================

/**
 * Serializes a ContainerNode tree to standard Markdown.
 *
 * @param container - The root container node from editor state
 * @returns A Markdown string representing the document
 *
 * @example
 * ```typescript
 * const md = serializeToMarkdown(state.container);
 * // # Title
 * //
 * // **Bold** normal text
 * ```
 */
export function serializeToMarkdown(container: ContainerNode): string {
  const lines = serializeChildrenToLines(container.children, 0);
  return lines.join('\n');
}

// ============================================================================
// Inline formatting
// ============================================================================

/**
 * Escapes Markdown special characters in plain text content.
 * Only escapes characters when they appear in plain text, not in formatting.
 */
function escapeMdChars(text: string): string {
  // Escape special Markdown characters in plain text content
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/`/g, '\\`')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/^(#+\s)/gm, '\\$1')
    .replace(/^(>\s)/gm, '\\$1');
}

/**
 * Serializes a single InlineText segment to a Markdown string.
 * Applies bold, italic, code, strikethrough, link, underline markers.
 */
function serializeInlineSegment(segment: InlineText): string {
  const text = segment.content || '';
  if (!text) return '';

  // For plain text (no formatting), escape special chars
  const hasFormatting =
    segment.bold ||
    segment.italic ||
    segment.code ||
    segment.strikethrough ||
    segment.href ||
    segment.underline;

  let result = hasFormatting ? text : escapeMdChars(text);

  // Apply formatting markers inside-out (code innermost)
  if (segment.code) {
    result = `\`${result}\``;
  }

  if (segment.strikethrough) {
    result = `~~${result}~~`;
  }

  if (segment.underline) {
    // No standard Markdown — use HTML fallback
    result = `<u>${result}</u>`;
  }

  // bold+italic combined → ***text***
  if (segment.bold && segment.italic) {
    result = `***${result}***`;
  } else if (segment.bold) {
    result = `**${result}**`;
  } else if (segment.italic) {
    result = `*${result}*`;
  }

  // Link wraps around all other formatting
  if (segment.href) {
    result = `[${result}](${segment.href})`;
  }

  // Colors/font sizes are skipped — Markdown doesn't support these

  return result;
}

/**
 * Returns the inline Markdown content for a TextNode, handling:
 * - `content`  → plain string (escaped)
 * - `children` → array of InlineText segments with formatting
 * - `lines`    → multiple BlockLines joined with newline
 */
function serializeTextNodeContent(node: TextNode): string {
  // Multi-line content (e.g. list items with multiple lines)
  if (node.lines && node.lines.length > 0) {
    return node.lines
      .map(line => {
        if (line.children && line.children.length > 0) {
          return line.children.map(seg => serializeInlineSegment(seg)).join('');
        }
        return escapeMdChars(line.content || '');
      })
      .join('\n');
  }

  // Inline children (rich formatting)
  if (hasInlineChildren(node)) {
    return node.children!.map(seg => serializeInlineSegment(seg)).join('');
  }

  // Plain text
  return escapeMdChars(node.content || '');
}

// ============================================================================
// Block serialization
// ============================================================================

const HEADING_PREFIXES: Record<string, string> = {
  h1: '#',
  h2: '##',
  h3: '###',
  h4: '####',
  h5: '#####',
  h6: '######',
};

/**
 * Serializes a single TextNode to an array of Markdown line strings.
 * Returns empty array for nodes with no content.
 */
function serializeTextNodeToLines(node: TextNode, _indent: number): string[] {
  const { type, attributes } = node;

  // ── HR ────────────────────────────────────────────────────────────────────
  if (type === 'hr') {
    return ['---', ''];
  }

  // ── BR ────────────────────────────────────────────────────────────────────
  if (type === 'br') {
    return [''];
  }

  // ── Image ─────────────────────────────────────────────────────────────────
  if (type === 'img') {
    const src = (attributes?.src as string) || '';
    const alt = (attributes?.alt as string) || node.content || '';
    if (!src) return [];
    return [`![${alt}](${src})`, ''];
  }

  // ── Video ─────────────────────────────────────────────────────────────────
  if (type === 'video') {
    const src = (attributes?.src as string) || '';
    const alt = node.content || 'video';
    if (!src) return [];
    // No standard Markdown video — use image syntax as fallback
    return [`![${alt}](${src})`, ''];
  }

  // ── Code / pre block ──────────────────────────────────────────────────────
  if (type === 'code' || type === 'pre') {
    const lang = (attributes?.language as string) || '';
    const inner = serializeTextNodeContent(node);
    if (!inner.trim()) return [];
    return ['```' + lang, inner, '```', ''];
  }

  // ── Table cells (th / td) — handled by structural node serializer ─────────
  if (type === 'th' || type === 'td') {
    return [serializeTextNodeContent(node)];
  }

  // ── Headings ──────────────────────────────────────────────────────────────
  if (type in HEADING_PREFIXES) {
    const inner = serializeTextNodeContent(node);
    if (!inner.trim()) return [];
    return [`${HEADING_PREFIXES[type]} ${inner}`, ''];
  }

  // ── Blockquote ────────────────────────────────────────────────────────────
  if (type === 'blockquote') {
    const inner = serializeTextNodeContent(node);
    if (!inner.trim()) return [];
    // Each line prefixed with "> "
    const prefixed = inner
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n');
    return [prefixed, ''];
  }

  // ── Paragraph ─────────────────────────────────────────────────────────────
  if (type === 'p') {
    const inner = serializeTextNodeContent(node);
    if (!inner.trim()) return [];
    return [inner, ''];
  }

  // ── li / ol — handled by serializeChildrenToLines list grouping ───────────
  // These should not be called directly; they're handled by the list grouping
  // logic in serializeChildrenToLines. But as a fallback:
  if (type === 'li') {
    const inner = serializeTextNodeContent(node);
    if (!inner.trim()) return [];
    return [`- ${inner}`];
  }

  if (type === 'ol') {
    const inner = serializeTextNodeContent(node);
    if (!inner.trim()) return [];
    return [`1. ${inner}`];
  }

  // ── Fallback: any other text node types ───────────────────────────────────
  const inner = serializeTextNodeContent(node);
  if (!inner.trim()) return [];
  return [inner, ''];
}

// ============================================================================
// Table serialization
// ============================================================================

/**
 * Serializes a table StructuralNode to Markdown pipe table lines.
 */
function serializeTableToLines(table: StructuralNode): string[] {
  if (table.type !== 'table') return [];

  const lines: string[] = [];
  let hasHeader = false;

  for (const child of table.children) {
    if (!isStructuralNode(child)) continue;

    if (child.type === 'thead') {
      for (const row of child.children) {
        if (!isStructuralNode(row) || row.type !== 'tr') continue;
        const cells = row.children
          .filter(isTextNode)
          .map(cell => serializeTextNodeContent(cell as TextNode));
        hasHeader = true;
        lines.push(`| ${cells.join(' | ')} |`);
        lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
      }
    }

    if (child.type === 'tbody') {
      for (const row of child.children) {
        if (!isStructuralNode(row) || row.type !== 'tr') continue;
        const cells = row.children
          .filter(isTextNode)
          .map(cell => serializeTextNodeContent(cell as TextNode));
        lines.push(`| ${cells.join(' | ')} |`);
      }
    }
  }

  // If no explicit thead, the first tr is the header
  if (!hasHeader && lines.length === 0) {
    for (const child of table.children) {
      if (isStructuralNode(child) && child.type === 'tr') {
        const cells = child.children
          .filter(isTextNode)
          .map(cell => serializeTextNodeContent(cell as TextNode));
        if (lines.length === 0) {
          lines.push(`| ${cells.join(' | ')} |`);
          lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
        } else {
          lines.push(`| ${cells.join(' | ')} |`);
        }
      }
    }
  }

  if (lines.length > 0) {
    lines.push('');
  }

  return lines;
}

// ============================================================================
// Children serialization with list grouping
// ============================================================================

/**
 * Serializes an array of EditorNode children to Markdown lines,
 * grouping consecutive `li` / `ol` items into proper list blocks.
 */
function serializeChildrenToLines(children: EditorNode[], indent: number): string[] {
  const lines: string[] = [];
  let i = 0;

  while (i < children.length) {
    const child = children[i];

    // ── Unordered list grouping ────────────────────────────────────────────
    if (isTextNode(child) && child.type === 'li') {
      // Collect all consecutive li nodes
      while (i < children.length) {
        const item = children[i];
        if (isTextNode(item) && item.type === 'li') {
          const inner = serializeTextNodeContent(item);
          if (inner.trim()) {
            lines.push(`- ${inner}`);
          }
          i++;
        } else {
          break;
        }
      }
      lines.push('');
      continue;
    }

    // ── Ordered list grouping ─────────────────────────────────────────────
    if (isTextNode(child) && child.type === 'ol') {
      let counter = 1;
      while (i < children.length) {
        const item = children[i];
        if (isTextNode(item) && item.type === 'ol') {
          const inner = serializeTextNodeContent(item);
          if (inner.trim()) {
            lines.push(`${counter}. ${inner}`);
            counter++;
          }
          i++;
        } else {
          break;
        }
      }
      lines.push('');
      continue;
    }

    // ── Structural nodes (table family) ───────────────────────────────────
    if (isStructuralNode(child)) {
      if (child.type === 'table') {
        lines.push(...serializeTableToLines(child));
      }
      i++;
      continue;
    }

    // ── Container nodes ───────────────────────────────────────────────────
    if (isContainerNode(child)) {
      // Check for table wrapper container
      const firstChild = child.children[0];
      if (firstChild && isStructuralNode(firstChild) && firstChild.type === 'table') {
        lines.push(...serializeTableToLines(firstChild));
      } else {
        // Flex/generic containers — serialize children normally
        lines.push(...serializeChildrenToLines(child.children, indent));
      }
      i++;
      continue;
    }

    // ── Text nodes ────────────────────────────────────────────────────────
    if (isTextNode(child)) {
      lines.push(...serializeTextNodeToLines(child, indent));
      i++;
      continue;
    }

    i++;
  }

  return lines;
}
