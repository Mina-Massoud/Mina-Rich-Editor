/**
 * Unit tests for serializeToSemanticHtml
 *
 * Each test builds a minimal ContainerNode fixture and asserts the exact
 * semantic HTML that the serializer should produce — no Tailwind classes,
 * no CSS framework dependencies.
 */

import { describe, it, expect } from 'vitest';
import { serializeToSemanticHtml } from '@/lib/utils/serialize-semantic-html';
import type { ContainerNode, TextNode, InlineText } from '@/lib/types';

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

/** Trim leading / trailing whitespace from each line and rejoin. */
function normalise(html: string): string {
  return html
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join('\n');
}

// ---------------------------------------------------------------------------
// 1. Simple paragraph
// ---------------------------------------------------------------------------

describe('serializeToSemanticHtml', () => {
  it('1. simple paragraph', () => {
    const html = serializeToSemanticHtml(root(textNode('p1', 'p', 'Hello world')));
    expect(normalise(html)).toBe('<p>Hello world</p>');
  });

  // -------------------------------------------------------------------------
  // 2. Heading
  // -------------------------------------------------------------------------

  it('2. h1 heading', () => {
    const html = serializeToSemanticHtml(root(textNode('h1', 'h1', 'My Title')));
    expect(normalise(html)).toBe('<h1>My Title</h1>');
  });

  // -------------------------------------------------------------------------
  // 3. Bold text
  // -------------------------------------------------------------------------

  it('3. bold inline text within paragraph', () => {
    const html = serializeToSemanticHtml(
      root(
        richNode('p1', 'p', [
          { content: 'bold', bold: true },
          { content: ' normal' },
        ])
      )
    );
    expect(normalise(html)).toBe('<p><strong>bold</strong> normal</p>');
  });

  // -------------------------------------------------------------------------
  // 4. Mixed formatting (bold + italic combined)
  // -------------------------------------------------------------------------

  it('4. bold + italic produces <strong><em>...</em></strong>', () => {
    const html = serializeToSemanticHtml(
      root(
        richNode('p1', 'p', [{ content: 'bold italic', bold: true, italic: true }])
      )
    );
    expect(normalise(html)).toBe('<p><strong><em>bold italic</em></strong></p>');
  });

  // -------------------------------------------------------------------------
  // 5. Link
  // -------------------------------------------------------------------------

  it('5. link renders as <a> with target/_blank and rel', () => {
    const html = serializeToSemanticHtml(
      root(
        richNode('p1', 'p', [
          { content: 'click here', href: 'https://example.com' },
        ])
      )
    );
    expect(normalise(html)).toBe(
      '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">click here</a></p>'
    );
  });

  // -------------------------------------------------------------------------
  // 6. Unordered list items
  // -------------------------------------------------------------------------

  it('6. consecutive li nodes wrap in <ul>', () => {
    const html = serializeToSemanticHtml(
      root(
        textNode('li1', 'li', 'Apple'),
        textNode('li2', 'li', 'Banana'),
        textNode('li3', 'li', 'Cherry')
      )
    );
    expect(normalise(html)).toBe(
      '<ul>\n<li>Apple</li>\n<li>Banana</li>\n<li>Cherry</li>\n</ul>'
    );
  });

  // -------------------------------------------------------------------------
  // 7. Ordered list items (ol type nodes)
  // -------------------------------------------------------------------------

  it('7. consecutive ol-type nodes wrap in <ol>', () => {
    const html = serializeToSemanticHtml(
      root(
        textNode('ol1', 'ol', 'First'),
        textNode('ol2', 'ol', 'Second')
      )
    );
    expect(normalise(html)).toBe('<ol>\n<li>First</li>\n<li>Second</li>\n</ol>');
  });

  // -------------------------------------------------------------------------
  // 8. Image
  // -------------------------------------------------------------------------

  it('8. image without caption renders <figure><img /></figure>', () => {
    const html = serializeToSemanticHtml(
      root(
        textNode('img1', 'img', '', {
          src: 'https://example.com/photo.jpg',
          alt: 'A photo',
        })
      )
    );
    const out = normalise(html);
    expect(out).toContain('<figure>');
    expect(out).toContain('<img src="https://example.com/photo.jpg" alt="A photo" />');
    expect(out).not.toContain('<figcaption>');
    expect(out).toContain('</figure>');
  });

  it('8b. image with caption renders <figcaption>', () => {
    const html = serializeToSemanticHtml(
      root(
        textNode('img1', 'img', 'A lovely landscape', {
          src: 'https://example.com/photo.jpg',
          alt: 'Landscape',
        })
      )
    );
    expect(normalise(html)).toContain(
      '<figcaption>A lovely landscape</figcaption>'
    );
  });

  // -------------------------------------------------------------------------
  // 9. Code block
  // -------------------------------------------------------------------------

  it('9. code block renders as <pre><code>...</code></pre>', () => {
    const html = serializeToSemanticHtml(
      root(textNode('code1', 'code', 'const x = 1;'))
    );
    expect(normalise(html)).toBe('<pre><code>const x = 1;</code></pre>');
  });

  // -------------------------------------------------------------------------
  // 10. Blockquote
  // -------------------------------------------------------------------------

  it('10. blockquote renders as <blockquote>', () => {
    const html = serializeToSemanticHtml(
      root(textNode('bq1', 'blockquote', 'To be or not to be'))
    );
    expect(normalise(html)).toBe('<blockquote>To be or not to be</blockquote>');
  });

  // -------------------------------------------------------------------------
  // 11. Table
  // -------------------------------------------------------------------------

  it('11. table serializes to proper semantic table structure', () => {
    const tableNode = {
      id: 'table1',
      type: 'table' as const,
      children: [
        {
          id: 'thead1',
          type: 'thead' as const,
          children: [
            {
              id: 'tr1',
              type: 'tr' as const,
              children: [
                { id: 'th1', type: 'th' as const, content: 'Name' },
                { id: 'th2', type: 'th' as const, content: 'Age' },
              ],
            },
          ],
        },
        {
          id: 'tbody1',
          type: 'tbody' as const,
          children: [
            {
              id: 'tr2',
              type: 'tr' as const,
              children: [
                { id: 'td1', type: 'td' as const, content: 'Alice' },
                { id: 'td2', type: 'td' as const, content: '30' },
              ],
            },
          ],
        },
      ],
    };

    const html = serializeToSemanticHtml(root(tableNode));
    const out = normalise(html);

    expect(out).toContain('<table>');
    expect(out).toContain('<thead>');
    expect(out).toContain('<tbody>');
    expect(out).toContain('<tr>');
    expect(out).toContain('<th>Name</th>');
    expect(out).toContain('<th>Age</th>');
    expect(out).toContain('<td>Alice</td>');
    expect(out).toContain('<td>30</td>');
    expect(out).toContain('</table>');
    // No Tailwind classes
    expect(out).not.toContain('class=');
  });

  // -------------------------------------------------------------------------
  // 12. Inline code
  // -------------------------------------------------------------------------

  it('12. inline code segment renders as <code> inside block', () => {
    const html = serializeToSemanticHtml(
      root(
        richNode('p1', 'p', [
          { content: 'call ' },
          { content: 'fn()', code: true },
          { content: ' now' },
        ])
      )
    );
    expect(normalise(html)).toBe('<p>call <code>fn()</code> now</p>');
  });

  // -------------------------------------------------------------------------
  // 13. Color with includeStyles
  // -------------------------------------------------------------------------

  it('13. color style produces <span style="color: ..."> when includeStyles=true', () => {
    const html = serializeToSemanticHtml(
      root(
        richNode('p1', 'p', [
          { content: 'red text', styles: { color: '#ff0000' } },
        ])
      ),
      { includeStyles: true }
    );
    expect(normalise(html)).toBe(
      '<p><span style="color: #ff0000">red text</span></p>'
    );
  });

  it('13b. color style is omitted when includeStyles=false', () => {
    const html = serializeToSemanticHtml(
      root(
        richNode('p1', 'p', [
          { content: 'red text', styles: { color: '#ff0000' } },
        ])
      ),
      { includeStyles: false }
    );
    expect(normalise(html)).toBe('<p>red text</p>');
  });

  // -------------------------------------------------------------------------
  // 14. Nested container
  // -------------------------------------------------------------------------

  it('14. nested container recurses correctly', () => {
    const nested: ContainerNode = {
      id: 'inner',
      type: 'container',
      children: [
        textNode('p-inner', 'p', 'Nested paragraph'),
      ],
    };

    const html = serializeToSemanticHtml(root(nested));
    expect(normalise(html)).toBe('<p>Nested paragraph</p>');
  });

  // -------------------------------------------------------------------------
  // 15. Empty content is skipped
  // -------------------------------------------------------------------------

  it('15. empty paragraph is not emitted', () => {
    const html = serializeToSemanticHtml(
      root(
        textNode('p-empty', 'p', ''),
        textNode('p-real', 'p', 'Not empty')
      )
    );
    // Should only contain one <p>
    const matches = normalise(html).match(/<p>/g) || [];
    expect(matches).toHaveLength(1);
    expect(normalise(html)).toBe('<p>Not empty</p>');
  });

  // -------------------------------------------------------------------------
  // Additional: wrapInArticle option
  // -------------------------------------------------------------------------

  it('wrapInArticle wraps output in <article>', () => {
    const html = serializeToSemanticHtml(
      root(textNode('p1', 'p', 'Content')),
      { wrapInArticle: true }
    );
    const out = normalise(html);
    expect(out.startsWith('<article>')).toBe(true);
    expect(out.endsWith('</article>')).toBe(true);
    expect(out).toContain('<p>Content</p>');
  });

  // -------------------------------------------------------------------------
  // Additional: HR
  // -------------------------------------------------------------------------

  it('hr node renders as <hr />', () => {
    const hrNode: TextNode = { id: 'hr1', type: 'hr' };
    const html = serializeToSemanticHtml(root(hrNode));
    expect(normalise(html)).toBe('<hr />');
  });

  // -------------------------------------------------------------------------
  // Additional: HTML entity escaping
  // -------------------------------------------------------------------------

  it('HTML entities in content are escaped', () => {
    const html = serializeToSemanticHtml(
      root(textNode('p1', 'p', 'a < b && c > d "quote"'))
    );
    expect(normalise(html)).toBe(
      '<p>a &lt; b &amp;&amp; c &gt; d &quot;quote&quot;</p>'
    );
  });

  // -------------------------------------------------------------------------
  // Additional: strikethrough and underline
  // -------------------------------------------------------------------------

  it('strikethrough renders as <del>', () => {
    const html = serializeToSemanticHtml(
      root(richNode('p1', 'p', [{ content: 'deleted', strikethrough: true }]))
    );
    expect(normalise(html)).toBe('<p><del>deleted</del></p>');
  });

  it('underline renders as <u>', () => {
    const html = serializeToSemanticHtml(
      root(richNode('p1', 'p', [{ content: 'underlined', underline: true }]))
    );
    expect(normalise(html)).toBe('<p><u>underlined</u></p>');
  });

  // -------------------------------------------------------------------------
  // Additional: video
  // -------------------------------------------------------------------------

  it('video renders as <figure><video controls ...>', () => {
    const html = serializeToSemanticHtml(
      root(
        textNode('vid1', 'video', '', {
          src: 'https://example.com/clip.mp4',
        })
      )
    );
    const out = normalise(html);
    expect(out).toContain('<figure>');
    expect(out).toContain(
      '<video controls src="https://example.com/clip.mp4"></video>'
    );
    expect(out).toContain('</figure>');
  });
});
