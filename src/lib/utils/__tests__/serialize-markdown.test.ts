/**
 * Unit tests for serializeToMarkdown
 *
 * Each test builds a minimal ContainerNode fixture and asserts the
 * Markdown string that the serializer should produce.
 */

import { describe, it, expect } from 'vitest';
import { serializeToMarkdown } from '@/lib/utils/serialize-markdown';
import type { ContainerNode, TextNode, InlineText, StructuralNode } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap children in a root ContainerNode. */
function root(...children: ContainerNode['children']): ContainerNode {
  return { id: 'root', type: 'container', children };
}

/** Create a plain TextNode (no inline formatting). */
function textNode(
  id: string,
  type: TextNode['type'],
  content: string,
  attrs?: TextNode['attributes']
): TextNode {
  return { id, type, content, attributes: attrs };
}

/** Create a TextNode with inline children. */
function richNode(
  id: string,
  type: TextNode['type'],
  children: InlineText[]
): TextNode {
  return { id, type, children };
}

/**
 * Trim trailing blank lines and normalize line endings for easy comparison.
 * Tests use trimEnd() on the full output so we don't worry about trailing \n.
 */
function normalize(md: string): string {
  return md
    .split('\n')
    .map(l => l.trimEnd())
    .join('\n')
    .trimEnd();
}

// ---------------------------------------------------------------------------
// 1. Paragraph
// ---------------------------------------------------------------------------

describe('serializeToMarkdown', () => {
  it('1. paragraph serializes to plain text followed by blank line', () => {
    const md = serializeToMarkdown(root(textNode('p1', 'p', 'Hello world')));
    expect(normalize(md)).toBe('Hello world');
  });

  // -------------------------------------------------------------------------
  // 2. Heading h1
  // -------------------------------------------------------------------------

  it('2. h1 heading serializes to "# text"', () => {
    const md = serializeToMarkdown(root(textNode('h1', 'h1', 'My Title')));
    expect(normalize(md)).toContain('# My Title');
  });

  // -------------------------------------------------------------------------
  // 3. Heading h3
  // -------------------------------------------------------------------------

  it('3. h3 heading serializes to "### text"', () => {
    const md = serializeToMarkdown(root(textNode('h3', 'h3', 'Sub-section')));
    expect(normalize(md)).toContain('### Sub-section');
  });

  // -------------------------------------------------------------------------
  // 4. Bold inline
  // -------------------------------------------------------------------------

  it('4. bold inline text serializes to **text**', () => {
    const md = serializeToMarkdown(
      root(richNode('p1', 'p', [{ content: 'bold', bold: true }]))
    );
    expect(normalize(md)).toContain('**bold**');
  });

  // -------------------------------------------------------------------------
  // 5. Italic inline
  // -------------------------------------------------------------------------

  it('5. italic inline text serializes to *text*', () => {
    const md = serializeToMarkdown(
      root(richNode('p1', 'p', [{ content: 'italic', italic: true }]))
    );
    expect(normalize(md)).toContain('*italic*');
  });

  // -------------------------------------------------------------------------
  // 6. Bold + italic
  // -------------------------------------------------------------------------

  it('6. bold+italic serializes to ***text***', () => {
    const md = serializeToMarkdown(
      root(
        richNode('p1', 'p', [{ content: 'both', bold: true, italic: true }])
      )
    );
    expect(normalize(md)).toContain('***both***');
  });

  // -------------------------------------------------------------------------
  // 7. Inline code
  // -------------------------------------------------------------------------

  it('7. inline code serializes to `text`', () => {
    const md = serializeToMarkdown(
      root(richNode('p1', 'p', [{ content: 'fn()', code: true }]))
    );
    expect(normalize(md)).toContain('`fn()`');
  });

  // -------------------------------------------------------------------------
  // 8. Link
  // -------------------------------------------------------------------------

  it('8. link serializes to [text](url)', () => {
    const md = serializeToMarkdown(
      root(
        richNode('p1', 'p', [
          { content: 'click here', href: 'https://example.com' },
        ])
      )
    );
    expect(normalize(md)).toContain('[click here](https://example.com)');
  });

  // -------------------------------------------------------------------------
  // 9. Strikethrough
  // -------------------------------------------------------------------------

  it('9. strikethrough serializes to ~~text~~', () => {
    const md = serializeToMarkdown(
      root(richNode('p1', 'p', [{ content: 'deleted', strikethrough: true }]))
    );
    expect(normalize(md)).toContain('~~deleted~~');
  });

  // -------------------------------------------------------------------------
  // 10. Blockquote
  // -------------------------------------------------------------------------

  it('10. blockquote serializes to "> text"', () => {
    const md = serializeToMarkdown(
      root(textNode('bq1', 'blockquote', 'To be or not to be'))
    );
    expect(normalize(md)).toContain('> To be or not to be');
  });

  // -------------------------------------------------------------------------
  // 11. Code block
  // -------------------------------------------------------------------------

  it('11. code block serializes to fenced triple backticks', () => {
    const md = serializeToMarkdown(
      root(textNode('code1', 'code', 'const x = 1;'))
    );
    const out = normalize(md);
    expect(out).toContain('```');
    expect(out).toContain('const x = 1;');
    // Opening and closing fences
    const fenceCount = (out.match(/```/g) || []).length;
    expect(fenceCount).toBeGreaterThanOrEqual(2);
  });

  // -------------------------------------------------------------------------
  // 12. Unordered list
  // -------------------------------------------------------------------------

  it('12. consecutive li nodes serialize to "- item" lines', () => {
    const md = serializeToMarkdown(
      root(
        textNode('li1', 'li', 'Apple'),
        textNode('li2', 'li', 'Banana'),
        textNode('li3', 'li', 'Cherry')
      )
    );
    const out = normalize(md);
    expect(out).toContain('- Apple');
    expect(out).toContain('- Banana');
    expect(out).toContain('- Cherry');
  });

  // -------------------------------------------------------------------------
  // 13. Ordered list
  // -------------------------------------------------------------------------

  it('13. consecutive ol nodes serialize to "1. 2. 3." prefix lines', () => {
    const md = serializeToMarkdown(
      root(
        textNode('ol1', 'ol', 'First'),
        textNode('ol2', 'ol', 'Second'),
        textNode('ol3', 'ol', 'Third')
      )
    );
    const out = normalize(md);
    expect(out).toContain('1. First');
    expect(out).toContain('2. Second');
    expect(out).toContain('3. Third');
  });

  // -------------------------------------------------------------------------
  // 14. Image
  // -------------------------------------------------------------------------

  it('14. image serializes to ![alt](src)', () => {
    const md = serializeToMarkdown(
      root(
        textNode('img1', 'img', '', {
          src: 'https://example.com/photo.jpg',
          alt: 'A photo',
        })
      )
    );
    expect(normalize(md)).toContain('![A photo](https://example.com/photo.jpg)');
  });

  // -------------------------------------------------------------------------
  // 15. HR
  // -------------------------------------------------------------------------

  it('15. hr node serializes to "---"', () => {
    const hrNode: TextNode = { id: 'hr1', type: 'hr' };
    const md = serializeToMarkdown(root(hrNode));
    expect(normalize(md)).toContain('---');
  });

  // -------------------------------------------------------------------------
  // 16. Table
  // -------------------------------------------------------------------------

  it('16. table serializes to pipe table format', () => {
    const tableNode: StructuralNode = {
      id: 'table1',
      type: 'table',
      children: [
        {
          id: 'thead1',
          type: 'thead',
          children: [
            {
              id: 'tr1',
              type: 'tr',
              children: [
                { id: 'th1', type: 'th', content: 'Name' } as TextNode,
                { id: 'th2', type: 'th', content: 'Age' } as TextNode,
              ],
            } as StructuralNode,
          ],
        } as StructuralNode,
        {
          id: 'tbody1',
          type: 'tbody',
          children: [
            {
              id: 'tr2',
              type: 'tr',
              children: [
                { id: 'td1', type: 'td', content: 'Alice' } as TextNode,
                { id: 'td2', type: 'td', content: '30' } as TextNode,
              ],
            } as StructuralNode,
          ],
        } as StructuralNode,
      ],
    };

    const md = serializeToMarkdown(root(tableNode));
    const out = normalize(md);

    // Header row
    expect(out).toContain('| Name | Age |');
    // Separator row
    expect(out).toContain('| --- | --- |');
    // Body row
    expect(out).toContain('| Alice | 30 |');
  });

  // -------------------------------------------------------------------------
  // 17. Mixed content — paragraph with bold and normal text
  // -------------------------------------------------------------------------

  it('17. paragraph with mixed inline content serializes correctly', () => {
    const md = serializeToMarkdown(
      root(
        richNode('p1', 'p', [
          { content: 'Hello ' },
          { content: 'world', bold: true },
          { content: '!' },
        ])
      )
    );
    const out = normalize(md);
    expect(out).toContain('Hello ');
    expect(out).toContain('**world**');
    expect(out).toContain('!');
  });

  // -------------------------------------------------------------------------
  // 18. Empty / whitespace nodes are skipped
  // -------------------------------------------------------------------------

  it('18. empty paragraph nodes are not emitted', () => {
    const md = serializeToMarkdown(
      root(
        textNode('p-empty', 'p', ''),
        textNode('p-ws', 'p', '   '),
        textNode('p-real', 'p', 'Actual content')
      )
    );
    const out = normalize(md);
    expect(out).toBe('Actual content');
  });

  // -------------------------------------------------------------------------
  // Additional: underline uses HTML fallback <u>
  // -------------------------------------------------------------------------

  it('underline serializes to <u>text</u>', () => {
    const md = serializeToMarkdown(
      root(richNode('p1', 'p', [{ content: 'underlined', underline: true }]))
    );
    expect(normalize(md)).toContain('<u>underlined</u>');
  });

  // -------------------------------------------------------------------------
  // Additional: h2, h4 heading levels
  // -------------------------------------------------------------------------

  it('h2 heading serializes to "## text"', () => {
    const md = serializeToMarkdown(root(textNode('h2', 'h2', 'Section')));
    expect(normalize(md)).toContain('## Section');
  });

  it('h6 heading serializes to "###### text"', () => {
    const md = serializeToMarkdown(root(textNode('h6', 'h6', 'Fine print')));
    expect(normalize(md)).toContain('###### Fine print');
  });

  // -------------------------------------------------------------------------
  // Additional: nested container (flex) passes through children
  // -------------------------------------------------------------------------

  it('nested container (flex) serializes children normally', () => {
    const nested: ContainerNode = {
      id: 'inner',
      type: 'container',
      attributes: { layoutType: 'flex' },
      children: [
        textNode('h1-in', 'h1', 'Inside flex'),
        textNode('p-in', 'p', 'Paragraph inside'),
      ],
    };
    const md = serializeToMarkdown(root(nested));
    const out = normalize(md);
    expect(out).toContain('# Inside flex');
    expect(out).toContain('Paragraph inside');
  });

  // -------------------------------------------------------------------------
  // Additional: video uses image syntax fallback
  // -------------------------------------------------------------------------

  it('video node uses image syntax fallback ![video](src)', () => {
    const md = serializeToMarkdown(
      root(
        textNode('vid1', 'video', '', { src: 'https://example.com/clip.mp4' })
      )
    );
    expect(normalize(md)).toContain('![video](https://example.com/clip.mp4)');
  });

  // -------------------------------------------------------------------------
  // Additional: code block with language attribute
  // -------------------------------------------------------------------------

  it('code block with language attribute emits ```language fence', () => {
    const codeNode: TextNode = {
      id: 'code1',
      type: 'code',
      content: 'let x = 1',
      attributes: { language: 'typescript' },
    };
    const md = serializeToMarkdown(root(codeNode));
    const out = normalize(md);
    expect(out).toContain('```typescript');
    expect(out).toContain('let x = 1');
  });
});
