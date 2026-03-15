/**
 * Serialize Editor State to Clean Semantic HTML
 *
 * Converts the editor's block model to clean, semantic HTML with no
 * Tailwind or CSS-framework classes — suitable for any CMS target
 * (WordPress, Strapi, Contentful, etc.).
 *
 * Supports recursive rendering of nested containers and all block/inline
 * node types defined in the editor's type system.
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

export interface SemanticHtmlOptions {
  /**
   * Include inline styles for colors and font sizes.
   * When false, `style` attributes are omitted entirely.
   * @default true
   */
  includeStyles?: boolean;

  /**
   * Wrap the entire output in an `<article>` element.
   * @default false
   */
  wrapInArticle?: boolean;
}

/**
 * Serializes a ContainerNode tree to clean semantic HTML suitable for any CMS.
 *
 * @param container - The root container node from editor state
 * @param options   - Serialization options
 * @returns A clean HTML string with semantic tags and no CSS framework classes
 *
 * @example
 * ```typescript
 * const html = serializeToSemanticHtml(state.container);
 * // <h1>Title</h1>
 * // <p><strong>Bold</strong> normal text</p>
 * ```
 */
export function serializeToSemanticHtml(
  container: ContainerNode,
  options: SemanticHtmlOptions = {}
): string {
  const { includeStyles = true, wrapInArticle = false } = options;
  const ctx: SerializeContext = { includeStyles };

  const body = serializeChildren(container.children, ctx, '');

  if (wrapInArticle) {
    return `<article>\n${body}</article>\n`;
  }
  return body;
}

// ============================================================================
// Internal helpers
// ============================================================================

/** Shared context threaded through all serialization calls. */
interface SerializeContext {
  includeStyles: boolean;
}

// ---------------------------------------------------------------------------
// HTML entity escaping
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// camelCase → kebab-case helper for CSS property names
// ---------------------------------------------------------------------------

function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

// ---------------------------------------------------------------------------
// Inline text serialization
// ---------------------------------------------------------------------------

/**
 * Wraps `inner` HTML in semantic formatting tags derived from an InlineText
 * segment's boolean flags.  Tags are applied outermost-first in a consistent
 * order so that combined formats nest predictably.
 */
function wrapInlineFormatting(
  inner: string,
  segment: InlineText,
  ctx: SerializeContext
): string {
  let html = inner;

  // code wraps first (innermost), then other formats wrap outside it
  if (segment.code) {
    html = `<code>${html}</code>`;
  }
  if (segment.strikethrough) {
    html = `<del>${html}</del>`;
  }
  if (segment.underline) {
    html = `<u>${html}</u>`;
  }
  if (segment.italic) {
    html = `<em>${html}</em>`;
  }
  if (segment.bold) {
    html = `<strong>${html}</strong>`;
  }

  // Link wraps around all other formatting
  if (segment.href) {
    html = `<a href="${escapeHtml(segment.href)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
  }

  // Inline styles: color and fontSize
  if (ctx.includeStyles && segment.styles) {
    const styleParts: string[] = [];

    if (segment.styles.color) {
      styleParts.push(`color: ${segment.styles.color}`);
    }
    if (segment.styles.fontSize) {
      styleParts.push(`font-size: ${segment.styles.fontSize}`);
    }

    // Any remaining CSS properties (excluding color/fontSize already handled)
    for (const [key, value] of Object.entries(segment.styles)) {
      if (key !== 'color' && key !== 'fontSize') {
        styleParts.push(`${toKebabCase(key)}: ${value}`);
      }
    }

    if (styleParts.length > 0) {
      html = `<span style="${styleParts.join('; ')}">${html}</span>`;
    }
  }

  // Hex color stored in className (legacy pattern from Tailwind serializer)
  if (
    ctx.includeStyles &&
    segment.className &&
    segment.className.startsWith('#')
  ) {
    html = `<span style="color: ${segment.className}">${html}</span>`;
  }

  return html;
}

/**
 * Serializes a single InlineText segment to an HTML string.
 */
function serializeInlineSegment(
  segment: InlineText,
  ctx: SerializeContext
): string {
  const text = escapeHtml(segment.content || '');

  if (!text) return '';

  return wrapInlineFormatting(text, segment, ctx);
}

/**
 * Returns the inner HTML content for a TextNode, handling:
 *  - `content`  → plain string
 *  - `children` → array of InlineText segments
 *  - `lines`    → multiple BlockLines joined with `<br />`
 */
function serializeTextNodeContent(node: TextNode, ctx: SerializeContext): string {
  // Multi-line content (e.g. ordered list items with multiple lines)
  if (node.lines && node.lines.length > 0) {
    return node.lines
      .map(line => {
        if (line.children && line.children.length > 0) {
          return line.children.map(seg => serializeInlineSegment(seg, ctx)).join('');
        }
        return escapeHtml(line.content || '');
      })
      .join('<br />');
  }

  // Inline children (rich formatting)
  if (hasInlineChildren(node)) {
    return node.children!.map(seg => serializeInlineSegment(seg, ctx)).join('');
  }

  // Plain text
  return escapeHtml(node.content || '');
}

// ---------------------------------------------------------------------------
// Text node serialization
// ---------------------------------------------------------------------------

/**
 * Serializes a single TextNode to a semantic HTML element string.
 * Returns an empty string for nodes whose content is blank (so that callers
 * can decide to omit them).
 */
function serializeTextNode(
  node: TextNode,
  ctx: SerializeContext,
  indent: string
): string {
  const { type, attributes } = node;

  // ── Self-closing / structural elements ─────────────────────────────────

  if (type === 'hr') {
    return `${indent}<hr />\n`;
  }

  if (type === 'br') {
    // Standalone <br> blocks between paragraphs are meaningless — skip them
    return '';
  }

  // ── Image ───────────────────────────────────────────────────────────────

  if (type === 'img') {
    const src = (attributes?.src as string) || '';
    const alt = (attributes?.alt as string) || '';
    const caption = node.content || '';

    if (!src) return '';

    let imgAttrs = `src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"`;

    // Preserve width only when includeStyles is true
    if (ctx.includeStyles && attributes?.styles) {
      const styles = attributes.styles as Record<string, string>;
      const styleParts: string[] = [];
      for (const [k, v] of Object.entries(styles)) {
        styleParts.push(`${toKebabCase(k)}: ${v}`);
      }
      if (styleParts.length > 0) {
        imgAttrs += ` style="${styleParts.join('; ')}"`;
      }
    }

    let html = `${indent}<figure>\n`;
    html += `${indent}  <img ${imgAttrs} />\n`;
    if (caption) {
      html += `${indent}  <figcaption>${escapeHtml(caption)}</figcaption>\n`;
    }
    html += `${indent}</figure>\n`;
    return html;
  }

  // ── Video ───────────────────────────────────────────────────────────────

  if (type === 'video') {
    const src = (attributes?.src as string) || '';
    const caption = node.content || '';

    if (!src) return '';

    let html = `${indent}<figure>\n`;
    html += `${indent}  <video controls src="${escapeHtml(src)}"></video>\n`;
    if (caption) {
      html += `${indent}  <figcaption>${escapeHtml(caption)}</figcaption>\n`;
    }
    html += `${indent}</figure>\n`;
    return html;
  }

  // ── Code block ─────────────────────────────────────────────────────────

  if (type === 'code' || type === 'pre') {
    const inner = serializeTextNodeContent(node, ctx);
    if (!inner.trim()) return '';
    return `${indent}<pre><code>${inner}</code></pre>\n`;
  }

  // ── Table cells (th / td) ──────────────────────────────────────────────
  // These are handled inside serializeStructuralNode; but in case they appear
  // as lone TextNodes we handle them here too.

  if (type === 'th' || type === 'td') {
    const inner = serializeTextNodeContent(node, ctx);
    return `${indent}<${type}>${inner}</${type}>\n`;
  }

  // ── Remaining block elements ────────────────────────────────────────────

  const inner = serializeTextNodeContent(node, ctx);

  // Skip empty blocks (don't emit <p></p> noise)
  if (!inner.trim()) return '';

  // Build optional style attribute from attributes.styles / backgroundColor / color
  const styleAttr = buildBlockStyleAttr(node, ctx);

  return `${indent}<${type}${styleAttr}>${inner}</${type}>\n`;
}

/**
 * Builds an inline `style="..."` attribute string for a block-level TextNode,
 * respecting the `includeStyles` flag.
 */
function buildBlockStyleAttr(node: TextNode, ctx: SerializeContext): string {
  if (!ctx.includeStyles) return '';

  const { attributes } = node;
  const parts: string[] = [];

  const bgColor = attributes?.backgroundColor as string | undefined;
  if (bgColor) parts.push(`background-color: ${bgColor}`);

  // Hex color stored as className
  const customClass = attributes?.className as string | undefined;
  if (customClass && customClass.startsWith('#')) {
    parts.push(`color: ${customClass}`);
  }

  if (attributes?.styles) {
    const styles = attributes.styles as Record<string, string>;
    for (const [k, v] of Object.entries(styles)) {
      parts.push(`${toKebabCase(k)}: ${v}`);
    }
  }

  return parts.length > 0 ? ` style="${parts.join('; ')}"` : '';
}

// ---------------------------------------------------------------------------
// Structural node serialization (table, thead, tbody, tr)
// ---------------------------------------------------------------------------

function serializeStructuralNode(
  node: StructuralNode,
  ctx: SerializeContext,
  indent: string
): string {
  const { type } = node;

  if (type === 'table') {
    let html = `${indent}<table>\n`;
    for (const child of node.children) {
      if (isStructuralNode(child)) {
        html += serializeStructuralNode(child, ctx, indent + '  ');
      }
    }
    html += `${indent}</table>\n`;
    return html;
  }

  if (type === 'thead' || type === 'tbody') {
    let html = `${indent}<${type}>\n`;
    for (const child of node.children) {
      if (isStructuralNode(child)) {
        html += serializeStructuralNode(child, ctx, indent + '  ');
      }
    }
    html += `${indent}</${type}>\n`;
    return html;
  }

  if (type === 'tr') {
    let html = `${indent}<tr>\n`;
    for (const child of node.children) {
      if (isTextNode(child)) {
        const cellTag = child.type === 'th' ? 'th' : 'td';
        const content = serializeTextNodeContent(child, ctx);
        html += `${indent}  <${cellTag}>${content}</${cellTag}>\n`;
      }
    }
    html += `${indent}</tr>\n`;
    return html;
  }

  return '';
}

// ---------------------------------------------------------------------------
// Container node serialization
// ---------------------------------------------------------------------------

/**
 * Serializes an array of EditorNode children, grouping consecutive `li` / `ol`
 * items into the correct `<ul>` / `<ol>` wrapper automatically.
 */
function serializeChildren(
  children: EditorNode[],
  ctx: SerializeContext,
  indent: string
): string {
  let html = '';
  let i = 0;

  while (i < children.length) {
    const child = children[i];

    // ── List item grouping ───────────────────────────────────────────────
    if (isTextNode(child) && (child.type === 'li' || child.type === 'ol')) {
      // Determine which wrapper to use.
      // type === 'li'  → <ul>
      // type === 'ol'  → <ol>
      const listTag = child.type === 'ol' ? 'ol' : 'ul';
      html += `${indent}<${listTag}>\n`;

      // Consume all consecutive nodes of the same list type
      while (i < children.length) {
        const item = children[i];
        if (isTextNode(item) && item.type === child.type) {
          const inner = serializeTextNodeContent(item, ctx);
          if (inner.trim()) {
            html += `${indent}  <li>${inner}</li>\n`;
          }
          i++;
        } else {
          break;
        }
      }

      html += `${indent}</${listTag}>\n`;
      continue;
    }

    // ── Structural nodes (table family) ─────────────────────────────────
    if (isStructuralNode(child)) {
      html += serializeStructuralNode(child, ctx, indent);
      i++;
      continue;
    }

    // ── Container nodes ──────────────────────────────────────────────────
    if (isContainerNode(child)) {
      html += serializeContainerNode(child, ctx, indent);
      i++;
      continue;
    }

    // ── Text nodes (all other block types) ───────────────────────────────
    if (isTextNode(child)) {
      html += serializeTextNode(child, ctx, indent);
      i++;
      continue;
    }

    i++;
  }

  return html;
}

/**
 * Serializes a ContainerNode recursively.
 *
 * Handles:
 * - Table wrapper containers (first child is `table`)
 * - Flex layout containers
 * - Regular nesting containers
 * - List containers (listType attribute)
 */
function serializeContainerNode(
  node: ContainerNode,
  ctx: SerializeContext,
  indent: string
): string {
  if (!node.children || node.children.length === 0) return '';

  // Table wrapper: first child is a structural table node
  const firstChild = node.children[0];
  if (firstChild && isStructuralNode(firstChild) && firstChild.type === 'table') {
    return serializeStructuralNode(firstChild, ctx, indent);
  }

  // Flex layout container
  const layoutType = node.attributes?.layoutType as string | undefined;
  const isFlexContainer = layoutType === 'flex';

  if (isFlexContainer && ctx.includeStyles) {
    const gap = (node.attributes?.gap as string) || '1rem';
    const flexWrap = (node.attributes?.flexWrap as string) || 'wrap';
    const gapValue = /^\d+$/.test(gap) ? `${Number(gap) * 4}px` : gap;
    const styleAttr = `style="display: flex; gap: ${gapValue}; flex-wrap: ${flexWrap};"`;
    let html = `${indent}<div ${styleAttr}>\n`;
    html += serializeChildren(node.children, ctx, indent + '  ');
    html += `${indent}</div>\n`;
    return html;
  }

  if (isFlexContainer) {
    // includeStyles is false — emit plain div wrapper
    let html = `${indent}<div>\n`;
    html += serializeChildren(node.children, ctx, indent + '  ');
    html += `${indent}</div>\n`;
    return html;
  }

  // List container (listType attribute set explicitly)
  const listType = node.attributes?.listType as string | undefined;
  if (listType === 'ul' || listType === 'ol') {
    let html = `${indent}<${listType}>\n`;
    for (const child of node.children) {
      if (isTextNode(child)) {
        const inner = serializeTextNodeContent(child, ctx);
        if (inner.trim()) {
          html += `${indent}  <li>${inner}</li>\n`;
        }
      }
    }
    html += `${indent}</${listType}>\n`;
    return html;
  }

  // Generic nested container — just recurse, no wrapper element
  return serializeChildren(node.children, ctx, indent);
}
