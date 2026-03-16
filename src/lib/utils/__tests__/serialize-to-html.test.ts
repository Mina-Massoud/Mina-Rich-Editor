import { describe, it, expect } from 'vitest';
import {
  serializeToHtml,
  serializeToHtmlFragment,
  serializeToHtmlWithClass,
} from '../serialize-to-html';
import { ContainerNode, TextNode, StructuralNode } from '../../types';

function makeContainer(children: (TextNode | ContainerNode | StructuralNode)[]): ContainerNode {
  return {
    id: 'root',
    type: 'container',
    children,
    attributes: {},
  };
}

function makeText(
  type: TextNode['type'],
  content: string,
  attrs?: Partial<TextNode>,
): TextNode {
  return {
    id: `${type}-1`,
    type,
    content,
    attributes: {},
    ...attrs,
  };
}

describe('serializeToHtml', () => {
  it('wraps content in div with default class', () => {
    const container = makeContainer([makeText('p', 'Hello')]);
    const html = serializeToHtml(container);
    expect(html).toContain('<div class="editor-content">');
    expect(html).toContain('</div>');
  });

  it('renders h1 with correct classes', () => {
    const container = makeContainer([makeText('h1', 'Title')]);
    const html = serializeToHtml(container);
    expect(html).toContain('<h1');
    expect(html).toContain('text-4xl');
    expect(html).toContain('font-bold');
    expect(html).toContain('Title</h1>');
  });

  it('renders h2 with correct classes', () => {
    const container = makeContainer([makeText('h2', 'Subtitle')]);
    const html = serializeToHtml(container);
    expect(html).toContain('<h2');
    expect(html).toContain('text-3xl');
    expect(html).toContain('Subtitle</h2>');
  });

  it('renders paragraph with correct classes', () => {
    const container = makeContainer([makeText('p', 'Some text')]);
    const html = serializeToHtml(container);
    expect(html).toContain('<p');
    expect(html).toContain('text-base');
    expect(html).toContain('Some text</p>');
  });

  it('renders empty block as br', () => {
    const container = makeContainer([makeText('p', '')]);
    const html = serializeToHtml(container);
    expect(html).toContain('<br />');
  });

  it('renders inline bold formatting', () => {
    const node: TextNode = {
      id: 'p-1',
      type: 'p',
      children: [{ content: 'Bold text', bold: true }],
      attributes: {},
    };
    const container = makeContainer([node]);
    const html = serializeToHtml(container);
    expect(html).toContain('font-bold');
    expect(html).toContain('Bold text');
  });

  it('renders inline italic formatting', () => {
    const node: TextNode = {
      id: 'p-1',
      type: 'p',
      children: [{ content: 'Italic text', italic: true }],
      attributes: {},
    };
    const container = makeContainer([node]);
    const html = serializeToHtml(container);
    expect(html).toContain('italic');
    expect(html).toContain('Italic text');
  });

  it('renders inline bold+italic', () => {
    const node: TextNode = {
      id: 'p-1',
      type: 'p',
      children: [{ content: 'Bold italic', bold: true, italic: true }],
      attributes: {},
    };
    const container = makeContainer([node]);
    const html = serializeToHtml(container);
    expect(html).toContain('font-bold');
    expect(html).toContain('italic');
    expect(html).toContain('Bold italic');
  });

  it('renders links with href', () => {
    const node: TextNode = {
      id: 'p-1',
      type: 'p',
      children: [{ content: 'Click here', href: 'https://example.com' }],
      attributes: {},
    };
    const container = makeContainer([node]);
    const html = serializeToHtml(container);
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('Click here</a>');
  });

  it('renders code blocks as pre tag', () => {
    const container = makeContainer([makeText('code', 'const x = 1;')]);
    const html = serializeToHtml(container);
    expect(html).toContain('<pre');
    expect(html).toContain('font-mono');
    expect(html).toContain('const x = 1;</pre>');
  });

  it('renders image nodes with figure/img', () => {
    const node: TextNode = {
      id: 'img-1',
      type: 'img',
      content: 'A caption',
      attributes: { src: 'https://example.com/img.png', alt: 'Test image' },
    };
    const container = makeContainer([node]);
    const html = serializeToHtml(container);
    expect(html).toContain('<figure');
    expect(html).toContain('<img src="https://example.com/img.png"');
    expect(html).toContain('alt="Test image"');
    expect(html).toContain('<figcaption');
    expect(html).toContain('A caption');
  });

  it('renders video nodes', () => {
    const node: TextNode = {
      id: 'vid-1',
      type: 'video',
      content: '',
      attributes: { src: 'https://example.com/video.mp4' },
    };
    const container = makeContainer([node]);
    const html = serializeToHtml(container);
    expect(html).toContain('<video src="https://example.com/video.mp4"');
    expect(html).toContain('controls');
  });

  it('renders list items grouped in ol', () => {
    const li1: TextNode = { id: 'li-1', type: 'li', content: 'Item 1', attributes: {} };
    const li2: TextNode = { id: 'li-2', type: 'li', content: 'Item 2', attributes: {} };
    const container = makeContainer([li1, li2]);
    const html = serializeToHtml(container);
    expect(html).toContain('<ol');
    expect(html).toContain('<li');
    expect(html).toContain('Item 1');
    expect(html).toContain('Item 2');
    expect(html).toContain('</ol>');
  });

  it('renders blockquote', () => {
    const container = makeContainer([makeText('blockquote', 'A quote')]);
    const html = serializeToHtml(container);
    expect(html).toContain('<blockquote');
    expect(html).toContain('border-l-4');
    expect(html).toContain('A quote</blockquote>');
  });

  it('handles custom wrapper class option', () => {
    const container = makeContainer([makeText('p', 'Hi')]);
    const html = serializeToHtml(container, { wrapperClass: 'my-custom' });
    expect(html).toContain('<div class="my-custom">');
  });

  it('handles includeWrapper false', () => {
    const container = makeContainer([makeText('p', 'Hi')]);
    const html = serializeToHtml(container, { includeWrapper: false });
    expect(html).not.toContain('<div class=');
    expect(html).toContain('Hi</p>');
  });

  it('escapes HTML special characters', () => {
    const container = makeContainer([makeText('p', '<script>alert("xss")</script>')]);
    const html = serializeToHtml(container);
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;xss&quot;');
    expect(html).not.toContain('<script>');
  });

  it('renders inline styles', () => {
    const node: TextNode = {
      id: 'p-1',
      type: 'p',
      children: [{ content: 'Styled', styles: { fontSize: '24px' } }],
      attributes: {},
    };
    const container = makeContainer([node]);
    const html = serializeToHtml(container);
    expect(html).toContain('style="font-size: 24px;"');
  });

  it('renders background color', () => {
    const node: TextNode = {
      id: 'p-1',
      type: 'p',
      content: 'With bg',
      attributes: { backgroundColor: '#ff0000' },
    };
    const container = makeContainer([node]);
    const html = serializeToHtml(container);
    expect(html).toContain('background-color: #ff0000');
  });

  it('renders table structure', () => {
    const th1: TextNode = { id: 'th-1', type: 'th', content: 'Header 1', attributes: {} };
    const th2: TextNode = { id: 'th-2', type: 'th', content: 'Header 2', attributes: {} };
    const td1: TextNode = { id: 'td-1', type: 'td', content: 'Cell 1', attributes: {} };
    const td2: TextNode = { id: 'td-2', type: 'td', content: 'Cell 2', attributes: {} };

    const headerRow: StructuralNode = { id: 'tr-h', type: 'tr', children: [th1, th2], attributes: {} };
    const bodyRow: StructuralNode = { id: 'tr-b', type: 'tr', children: [td1, td2], attributes: {} };
    const thead: StructuralNode = { id: 'thead-1', type: 'thead', children: [headerRow], attributes: {} };
    const tbody: StructuralNode = { id: 'tbody-1', type: 'tbody', children: [bodyRow], attributes: {} };
    const table: StructuralNode = { id: 'table-1', type: 'table', children: [thead, tbody], attributes: {} };

    // Table must be the first child of a container node (table wrapper)
    const tableWrapper: ContainerNode = {
      id: 'table-wrapper',
      type: 'container',
      children: [table],
      attributes: {},
    };

    const container: ContainerNode = {
      id: 'root',
      type: 'container',
      children: [tableWrapper],
      attributes: {},
    };

    const html = serializeToHtml(container);
    expect(html).toContain('<table');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('<th');
    expect(html).toContain('Header 1');
    expect(html).toContain('<td');
    expect(html).toContain('Cell 1');
  });
});

describe('serializeToHtmlFragment', () => {
  it('returns HTML without wrapper div', () => {
    const container = makeContainer([makeText('p', 'No wrapper')]);
    const html = serializeToHtmlFragment(container);
    expect(html).not.toContain('<div class=');
    expect(html).toContain('No wrapper</p>');
  });
});

describe('serializeToHtmlWithClass', () => {
  it('uses custom wrapper class', () => {
    const container = makeContainer([makeText('p', 'Custom')]);
    const html = serializeToHtmlWithClass(container, 'prose');
    expect(html).toContain('<div class="prose">');
  });
});
