/**
 * Unit tests for parseMarkdownToNodes
 *
 * Each test provides a Markdown string and asserts the EditorNode array
 * that the parser produces.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { parseMarkdownToNodes } from '@/lib/utils/parse-markdown';
import { resetIdCounter } from '@/lib/utils/id-generator';
import type { TextNode, StructuralNode } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the first node and assert it is a TextNode. */
function firstText(md: string): TextNode {
  const nodes = parseMarkdownToNodes(md);
  expect(nodes.length).toBeGreaterThan(0);
  const node = nodes[0] as TextNode;
  return node;
}

beforeEach(() => {
  resetIdCounter();
});

// ---------------------------------------------------------------------------
// 1. H1 heading
// ---------------------------------------------------------------------------

describe('parseMarkdownToNodes', () => {
  it('1. "# heading" produces h1 node', () => {
    const node = firstText('# Hello World');
    expect(node.type).toBe('h1');
    expect(node.content).toBe('Hello World');
  });

  // -------------------------------------------------------------------------
  // 2. H2 heading
  // -------------------------------------------------------------------------

  it('2. "## heading" produces h2 node', () => {
    const node = firstText('## Sub Title');
    expect(node.type).toBe('h2');
    expect(node.content).toBe('Sub Title');
  });

  // -------------------------------------------------------------------------
  // 2b. Other heading levels
  // -------------------------------------------------------------------------

  it('2b. "### heading" produces h3 node', () => {
    const node = firstText('### Third Level');
    expect(node.type).toBe('h3');
    expect(node.content).toBe('Third Level');
  });

  it('2c. "#### heading" produces h4 node', () => {
    const node = firstText('#### Fourth');
    expect(node.type).toBe('h4');
  });

  it('2d. "###### heading" produces h6 node', () => {
    const node = firstText('###### Fine Print');
    expect(node.type).toBe('h6');
    expect(node.content).toBe('Fine Print');
  });

  // -------------------------------------------------------------------------
  // 3. Plain paragraph
  // -------------------------------------------------------------------------

  it('3. plain text line produces p node', () => {
    const node = firstText('This is a paragraph.');
    expect(node.type).toBe('p');
    expect(node.content).toBe('This is a paragraph.');
  });

  // -------------------------------------------------------------------------
  // 4. Unordered list item
  // -------------------------------------------------------------------------

  it('4. "- item" produces li node', () => {
    const node = firstText('- List item');
    expect(node.type).toBe('li');
    expect(node.content).toBe('List item');
  });

  it('4b. "* item" also produces li node', () => {
    const node = firstText('* Another item');
    expect(node.type).toBe('li');
    expect(node.content).toBe('Another item');
  });

  // -------------------------------------------------------------------------
  // 5. Ordered list item
  // -------------------------------------------------------------------------

  it('5. "1. item" produces ol node', () => {
    const node = firstText('1. First item');
    expect(node.type).toBe('ol');
    expect(node.content).toBe('First item');
  });

  it('5b. "3. item" (any number) produces ol node', () => {
    const node = firstText('3. Third item');
    expect(node.type).toBe('ol');
    expect(node.content).toBe('Third item');
  });

  // -------------------------------------------------------------------------
  // 6. Blockquote
  // -------------------------------------------------------------------------

  it('6. "> quote" produces blockquote node', () => {
    const node = firstText('> To be or not to be');
    expect(node.type).toBe('blockquote');
    expect(node.content).toBe('To be or not to be');
  });

  // -------------------------------------------------------------------------
  // 7. Horizontal rule
  // -------------------------------------------------------------------------

  it('7. "---" produces hr node', () => {
    const node = firstText('---');
    expect(node.type).toBe('hr');
  });

  it('7b. "***" produces hr node', () => {
    const node = firstText('***');
    expect(node.type).toBe('hr');
  });

  it('7c. "___" produces hr node', () => {
    const node = firstText('___');
    expect(node.type).toBe('hr');
  });

  // -------------------------------------------------------------------------
  // 8. Image
  // -------------------------------------------------------------------------

  it('8. "![alt](url)" produces img node with src and alt', () => {
    const node = firstText('![A photo](https://example.com/img.jpg)');
    expect(node.type).toBe('img');
    expect(node.attributes?.src).toBe('https://example.com/img.jpg');
    expect(node.attributes?.alt).toBe('A photo');
  });

  it('8b. image with empty alt produces img node', () => {
    const node = firstText('![](https://example.com/img.jpg)');
    expect(node.type).toBe('img');
    expect(node.attributes?.src).toBe('https://example.com/img.jpg');
    expect(node.attributes?.alt).toBe('');
  });

  // -------------------------------------------------------------------------
  // 9. Fenced code block
  // -------------------------------------------------------------------------

  it('9. fenced code block produces code node', () => {
    const md = '```\nconst x = 1;\nconsole.log(x);\n```';
    const node = firstText(md);
    expect(node.type).toBe('code');
    expect(node.content).toBe('const x = 1;\nconsole.log(x);');
  });

  it('9b. fenced code block with language stores language attribute', () => {
    const md = '```typescript\nlet y: number = 2;\n```';
    const node = firstText(md);
    expect(node.type).toBe('code');
    expect(node.attributes?.language).toBe('typescript');
    expect(node.content).toBe('let y: number = 2;');
  });

  // -------------------------------------------------------------------------
  // 10. Bold inline formatting
  // -------------------------------------------------------------------------

  it('10. "**bold**" in paragraph produces children with bold=true', () => {
    const node = firstText('**bold text**');
    expect(node.type).toBe('p');
    expect(node.children).toBeDefined();
    const boldSegment = node.children!.find(c => c.bold);
    expect(boldSegment).toBeDefined();
    expect(boldSegment!.content).toBe('bold text');
    expect(boldSegment!.bold).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 11. Italic inline formatting
  // -------------------------------------------------------------------------

  it('11. "*italic*" produces children with italic=true', () => {
    const node = firstText('*italic text*');
    expect(node.type).toBe('p');
    expect(node.children).toBeDefined();
    const seg = node.children!.find(c => c.italic);
    expect(seg).toBeDefined();
    expect(seg!.content).toBe('italic text');
    expect(seg!.italic).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 11b. Bold + italic
  // -------------------------------------------------------------------------

  it('11b. "***both***" produces children with bold=true and italic=true', () => {
    const node = firstText('***both***');
    expect(node.children).toBeDefined();
    const seg = node.children![0];
    expect(seg.bold).toBe(true);
    expect(seg.italic).toBe(true);
    expect(seg.content).toBe('both');
  });

  // -------------------------------------------------------------------------
  // 11c. Inline code
  // -------------------------------------------------------------------------

  it('11c. backtick code in paragraph produces children with code=true', () => {
    const node = firstText('call `fn()` now');
    expect(node.children).toBeDefined();
    const codeSeg = node.children!.find(c => c.code);
    expect(codeSeg).toBeDefined();
    expect(codeSeg!.content).toBe('fn()');
    expect(codeSeg!.code).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 11d. Strikethrough
  // -------------------------------------------------------------------------

  it('11d. "~~strike~~" produces children with strikethrough=true', () => {
    const node = firstText('~~deleted~~');
    expect(node.children).toBeDefined();
    const seg = node.children!.find(c => c.strikethrough);
    expect(seg).toBeDefined();
    expect(seg!.content).toBe('deleted');
  });

  // -------------------------------------------------------------------------
  // 12. Link inline formatting
  // -------------------------------------------------------------------------

  it('12. "[text](url)" produces children with href', () => {
    const node = firstText('[click here](https://example.com)');
    expect(node.children).toBeDefined();
    const linkSeg = node.children!.find(c => c.href);
    expect(linkSeg).toBeDefined();
    expect(linkSeg!.content).toBe('click here');
    expect(linkSeg!.href).toBe('https://example.com');
  });

  // -------------------------------------------------------------------------
  // 13. Multiple paragraphs separated by blank lines
  // -------------------------------------------------------------------------

  it('13. multiple paragraphs separated by blank lines are parsed as separate p nodes', () => {
    const md = 'First paragraph\n\nSecond paragraph\n\nThird paragraph';
    const nodes = parseMarkdownToNodes(md);

    // Filter out only p nodes (blank lines are skipped)
    const pNodes = nodes.filter(n => n.type === 'p');
    expect(pNodes).toHaveLength(3);

    const contents = pNodes.map(n => (n as TextNode).content);
    expect(contents).toContain('First paragraph');
    expect(contents).toContain('Second paragraph');
    expect(contents).toContain('Third paragraph');
  });

  // -------------------------------------------------------------------------
  // 14. Table (pipe format)
  // -------------------------------------------------------------------------

  it('14. pipe table produces table StructuralNode', () => {
    const md = '| Name | Age |\n| --- | --- |\n| Alice | 30 |';
    const nodes = parseMarkdownToNodes(md);

    expect(nodes.length).toBeGreaterThan(0);
    const tableNode = nodes[0] as StructuralNode;
    expect(tableNode.type).toBe('table');

    // Should have thead and tbody
    const thead = tableNode.children.find(c => c.type === 'thead') as StructuralNode;
    const tbody = tableNode.children.find(c => c.type === 'tbody') as StructuralNode;
    expect(thead).toBeDefined();
    expect(tbody).toBeDefined();

    // Check header cells
    const headerRow = (thead.children[0] as StructuralNode).children as TextNode[];
    expect(headerRow[0].content).toBe('Name');
    expect(headerRow[1].content).toBe('Age');

    // Check body cells
    const bodyRow = (tbody.children[0] as StructuralNode).children as TextNode[];
    expect(bodyRow[0].content).toBe('Alice');
    expect(bodyRow[1].content).toBe('30');
  });

  // -------------------------------------------------------------------------
  // 15. Mixed document
  // -------------------------------------------------------------------------

  it('15. mixed document with headings, paragraphs, and lists parses correctly', () => {
    const md = [
      '# Main Title',
      '',
      'Introduction paragraph.',
      '',
      '## Section',
      '',
      '- Item one',
      '- Item two',
      '',
      '1. First step',
      '2. Second step',
      '',
      'Final paragraph.',
    ].join('\n');

    const nodes = parseMarkdownToNodes(md);

    const types = nodes.map(n => n.type);
    expect(types).toContain('h1');
    expect(types).toContain('p');
    expect(types).toContain('h2');
    expect(types).toContain('li');
    expect(types).toContain('ol');

    const h1 = nodes.find(n => n.type === 'h1') as TextNode;
    expect(h1.content).toBe('Main Title');

    const liNodes = nodes.filter(n => n.type === 'li') as TextNode[];
    expect(liNodes).toHaveLength(2);
    expect(liNodes[0].content).toBe('Item one');
    expect(liNodes[1].content).toBe('Item two');

    const olNodes = nodes.filter(n => n.type === 'ol') as TextNode[];
    expect(olNodes).toHaveLength(2);
    expect(olNodes[0].content).toBe('First step');
    expect(olNodes[1].content).toBe('Second step');
  });

  // -------------------------------------------------------------------------
  // Additional: plain text with no inline formatting uses content string
  // -------------------------------------------------------------------------

  it('plain text without formatting uses content field (not children)', () => {
    const node = firstText('Just plain text here');
    expect(node.content).toBe('Just plain text here');
    expect(node.children).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Additional: mixed inline formatting in a single line
  // -------------------------------------------------------------------------

  it('mixed inline formatting in one line produces correct children array', () => {
    const node = firstText('Hello **world** and *earth*');
    expect(node.children).toBeDefined();

    const segments = node.children!;
    const plainSeg = segments.find(s => s.content === 'Hello ');
    expect(plainSeg).toBeDefined();

    const boldSeg = segments.find(s => s.bold && s.content === 'world');
    expect(boldSeg).toBeDefined();

    const italicSeg = segments.find(s => s.italic && s.content === 'earth');
    expect(italicSeg).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // Additional: empty input
  // -------------------------------------------------------------------------

  it('empty input produces empty array', () => {
    const nodes = parseMarkdownToNodes('');
    expect(nodes).toHaveLength(0);
  });

  it('input with only blank lines produces empty array', () => {
    const nodes = parseMarkdownToNodes('\n\n\n');
    expect(nodes).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Additional: inline underline HTML fallback
  // -------------------------------------------------------------------------

  it('<u>text</u> produces children with underline=true', () => {
    const node = firstText('<u>underlined</u>');
    expect(node.children).toBeDefined();
    const seg = node.children!.find(c => c.underline);
    expect(seg).toBeDefined();
    expect(seg!.content).toBe('underlined');
    expect(seg!.underline).toBe(true);
  });
});
