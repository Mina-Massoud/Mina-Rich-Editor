/**
 * HTML to Nodes Parser
 *
 * Converts pasted HTML content into EditorNode tree.
 * Used by clipboard paste handlers to support rich-text paste.
 */

import { EditorNode, InlineText, StructuralNode, TextNode } from '../types';
import { generateId } from './id-generator';

/**
 * Parse pasted HTML into an EditorNode array.
 * Sanitizes the HTML before parsing to prevent XSS.
 */
export function parseHtmlToNodes(html: string): EditorNode[] {
  const temp = document.createElement('div');
  temp.innerHTML = sanitizeHtml(html);

  const nodes: EditorNode[] = [];

  for (const child of Array.from(temp.childNodes)) {
    const result = parseElement(child);
    if (result === null) continue;
    // List parsing returns an array; all other parsers return a single node.
    if (Array.isArray(result)) {
      nodes.push(...result);
    } else {
      nodes.push(result);
    }
  }

  // If no block-level elements found, wrap plain text in a paragraph
  if (nodes.length === 0) {
    const text = temp.textContent || '';
    if (text.trim()) {
      nodes.push({
        id: generateId('p'),
        type: 'p',
        content: text,
      });
    }
  }

  return nodes;
}

// Return type is EditorNode | EditorNode[] | null because list parsing
// produces multiple nodes from a single <ul>/<ol> element.
type ParseResult = EditorNode | EditorNode[] | null;

function parseElement(node: Node): ParseResult {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    if (!text.trim()) return null;
    return { id: generateId('p'), type: 'p', content: text };
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6': {
      const inlineChildren = parseInlineChildren(el);
      return {
        id: generateId(tag),
        type: tag as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6',
        content: inlineChildren ? undefined : (el.textContent || ''),
        children: inlineChildren,
      };
    }
    case 'p':
    case 'div': {
      const inlineChildren = parseInlineChildren(el);
      return {
        id: generateId('p'),
        type: 'p',
        content: inlineChildren ? undefined : (el.textContent || ''),
        children: inlineChildren,
      };
    }
    case 'blockquote':
      return {
        id: generateId('blockquote'),
        type: 'blockquote',
        content: el.textContent || '',
      };
    case 'pre':
    case 'code':
      return {
        id: generateId('code'),
        type: 'code',
        content: el.textContent || '',
      };
    case 'ul':
      return parseList(el, 'li');
    case 'ol':
      return parseList(el, 'ol');
    case 'li':
      return { id: generateId('li'), type: 'li', content: el.textContent || '' };
    case 'hr':
      return { id: generateId('hr'), type: 'hr', content: '' };
    case 'img':
      return parseImg(el);
    case 'video':
      return parseMedia(el, 'video');
    case 'audio':
      return parseMedia(el, 'audio');
    case 'figure':
      return parseFigure(el);
    case 'table':
      return parseTable(el);
    case 'br':
      // Skip bare <br> tags
      return null;
    default:
      // For unknown elements, try to extract text content
      if (el.textContent?.trim()) {
        const inlineChildren = parseInlineChildren(el);
        return {
          id: generateId('p'),
          type: 'p',
          content: inlineChildren ? undefined : (el.textContent || ''),
          children: inlineChildren,
        };
      }
      return null;
  }
}

// ---------------------------------------------------------------------------
// List parsing — Bug 1 fix
// ---------------------------------------------------------------------------

/**
 * Parse a <ul> or <ol> element into an array of TextNodes.
 * Previously only the first <li> was returned; now ALL items are returned.
 *
 * @param el   - The list element
 * @param type - 'li' for <ul>, 'ol' for <ol>
 */
function parseList(el: HTMLElement, type: 'li' | 'ol'): EditorNode[] {
  const items = Array.from(el.querySelectorAll(':scope > li'));
  if (items.length === 0) return [];

  return items.map((item) => {
    const li = item as HTMLElement;
    const inlineChildren = parseInlineChildren(li);
    const node: TextNode = {
      id: generateId(type),
      type,
      content: inlineChildren ? undefined : (li.textContent || ''),
      children: inlineChildren,
    };
    return node;
  });
}

// ---------------------------------------------------------------------------
// Table parsing — Bug 2 fix
// ---------------------------------------------------------------------------

function parseTable(el: HTMLElement): StructuralNode {
  const tableNode: StructuralNode = {
    id: generateId('table'),
    type: 'table',
    children: [],
  };

  // Process <thead> and <tbody> children directly under <table>
  for (const child of Array.from(el.children)) {
    const childTag = child.tagName.toLowerCase();

    if (childTag === 'thead') {
      const theadNode: StructuralNode = {
        id: generateId('thead'),
        type: 'thead',
        children: parseTableRows(child as HTMLElement, 'th'),
      };
      tableNode.children.push(theadNode);
    } else if (childTag === 'tbody') {
      const tbodyNode: StructuralNode = {
        id: generateId('tbody'),
        type: 'tbody',
        children: parseTableRows(child as HTMLElement, 'td'),
      };
      tableNode.children.push(tbodyNode);
    } else if (childTag === 'tr') {
      // <tr> directly inside <table> (no thead/tbody wrapper)
      const rows = parseTableRows(el, 'td');
      tableNode.children.push(...rows);
      break;
    }
  }

  return tableNode;
}

function parseTableRows(section: HTMLElement, _defaultCellTag: 'th' | 'td'): StructuralNode[] {
  return Array.from(section.querySelectorAll(':scope > tr')).map((rowEl) => {
    const row = rowEl as HTMLElement;
    const cells: EditorNode[] = Array.from(
      row.querySelectorAll(':scope > th, :scope > td')
    ).map((cellEl) => {
      const cell = cellEl as HTMLElement;
      const cellTag = cell.tagName.toLowerCase() as 'th' | 'td';
      const inlineChildren = parseInlineChildren(cell);
      const textNode: TextNode = {
        id: generateId(cellTag),
        type: cellTag,
        content: inlineChildren ? undefined : (cell.textContent || ''),
        children: inlineChildren,
      };
      return textNode;
    });

    const rowNode: StructuralNode = {
      id: generateId('tr'),
      type: 'tr',
      children: cells,
    };
    return rowNode;
  });
}

// ---------------------------------------------------------------------------
// Image parsing — Bug 4 fix (alt text)
// ---------------------------------------------------------------------------

function parseImg(el: HTMLElement): TextNode {
  return {
    id: generateId('img'),
    type: 'img',
    attributes: {
      src: el.getAttribute('src') || '',
      alt: el.getAttribute('alt') || undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Video / Audio parsing — Bug 3 fix
// ---------------------------------------------------------------------------

function parseMedia(el: HTMLElement, mediaType: 'video' | 'audio'): TextNode {
  // src can live on the element itself or on a nested <source> child
  const src =
    el.getAttribute('src') ||
    (el.querySelector('source')?.getAttribute('src') ?? '');

  return {
    id: generateId(mediaType),
    type: mediaType,
    attributes: { src },
  };
}

/**
 * Handle <figure> wrappers around media or images.
 * Returns the inner media/image node, or a paragraph if no media found.
 */
function parseFigure(el: HTMLElement): ParseResult {
  const video = el.querySelector('video');
  if (video) return parseMedia(video, 'video');

  const audio = el.querySelector('audio');
  if (audio) return parseMedia(audio, 'audio');

  const img = el.querySelector('img');
  if (img) return parseImg(img);

  // Fallback: treat figure text content as a paragraph
  const text = el.textContent?.trim();
  if (text) {
    return { id: generateId('p'), type: 'p', content: text };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Inline children / inline styles — Bug 5 fix
// ---------------------------------------------------------------------------

function parseInlineChildren(el: HTMLElement): InlineText[] | undefined {
  // If element has only a single text node child, no inline children needed
  if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
    return undefined;
  }

  // If the element has no child elements (only text), no inline children needed
  const hasChildElements = Array.from(el.childNodes).some(
    (n) => n.nodeType === Node.ELEMENT_NODE
  );
  if (!hasChildElements) {
    return undefined;
  }

  const children: InlineText[] = [];

  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text) children.push({ content: text });
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const childEl = child as HTMLElement;
      const tag = childEl.tagName.toLowerCase();
      const text = childEl.textContent || '';
      if (!text) continue;

      const inline: InlineText = { content: text };

      // Detect formatting from HTML tags
      if (tag === 'strong' || tag === 'b') inline.bold = true;
      if (tag === 'em' || tag === 'i') inline.italic = true;
      if (tag === 'u') inline.underline = true;
      if (tag === 's' || tag === 'del' || tag === 'strike') inline.strikethrough = true;
      if (tag === 'code') inline.code = true;
      if (tag === 'a') inline.href = childEl.getAttribute('href') || undefined;

      // Bug 5: also apply inline style attribute formatting
      applyInlineStyles(childEl, inline);

      children.push(inline);
    }
  }

  return children.length > 0 ? children : undefined;
}

/**
 * Parse a CSS `style` attribute string and apply recognised properties to an
 * InlineText object.
 *
 * Recognised mappings:
 *   font-weight: bold | 700 | 800 | 900  → bold: true
 *   font-style: italic                    → italic: true
 *   text-decoration: underline            → underline: true
 *   text-decoration: line-through         → strikethrough: true
 *   color: <value>                        → styles.color
 *   font-size: <value>                    → styles.fontSize
 */
function applyInlineStyles(el: HTMLElement, inline: InlineText): void {
  const style = el.getAttribute('style');
  if (!style) return;

  // Parse each declaration
  const declarations = style.split(';').map((s) => s.trim()).filter(Boolean);

  const extraStyles: Record<string, string> = {};

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;

    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const value = decl.slice(colonIdx + 1).trim().toLowerCase();

    switch (prop) {
      case 'font-weight':
        if (value === 'bold' || value === 'bolder' || parseInt(value, 10) >= 700) {
          inline.bold = true;
        }
        break;
      case 'font-style':
        if (value === 'italic' || value === 'oblique') {
          inline.italic = true;
        }
        break;
      case 'text-decoration':
      case 'text-decoration-line': {
        // value may be compound e.g. "underline line-through"
        if (value.includes('underline')) inline.underline = true;
        if (value.includes('line-through')) inline.strikethrough = true;
        break;
      }
      case 'color':
        // Preserve original casing for colour values
        extraStyles['color'] = decl.slice(colonIdx + 1).trim();
        break;
      case 'font-size':
        extraStyles['fontSize'] = decl.slice(colonIdx + 1).trim();
        break;
      default:
        break;
    }
  }

  if (Object.keys(extraStyles).length > 0) {
    inline.styles = { ...(inline.styles ?? {}), ...extraStyles };
  }
}

// ---------------------------------------------------------------------------
// Plain text parser
// ---------------------------------------------------------------------------

/**
 * Parse pasted plain text into an EditorNode array.
 * Each non-empty line becomes a paragraph node.
 */
export function parsePlainTextToNodes(text: string): EditorNode[] {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => ({
      id: generateId('p'),
      type: 'p' as const,
      content: line,
    }));
}

// ---------------------------------------------------------------------------
// HTML sanitizer
// ---------------------------------------------------------------------------

/**
 * Remove dangerous HTML elements and event handler attributes to prevent XSS.
 */
function sanitizeHtml(html: string): string {
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove dangerous elements
  const dangerous = temp.querySelectorAll(
    'script, iframe, object, embed, form, style, link, meta'
  );
  dangerous.forEach((el) => el.remove());

  // Remove event handler attributes (on*)
  const allElements = temp.querySelectorAll('*');
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name);
    });
  });

  return temp.innerHTML;
}
