/**
 * Round-trip serialization tests
 *
 * Verifies that key structural and formatting properties survive a full
 * serialize → parse cycle for both semantic HTML and Markdown.
 *
 * These tests are deliberately structural: they check that the important
 * information (heading types, list items, image src, bold text) is
 * recoverable after the round-trip — not that the output is byte-perfect.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { serializeToSemanticHtml } from '@/lib/utils/serialize-semantic-html';
import { serializeToMarkdown } from '@/lib/utils/serialize-markdown';
import { parseHtmlToNodes } from '@/lib/utils/html-to-nodes';
import { parseMarkdownToNodes } from '@/lib/utils/parse-markdown';
import { resetIdCounter } from '@/lib/utils/id-generator';
import type { ContainerNode, TextNode, EditorNode } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrap a list of children in a root ContainerNode. */
function root(...children: ContainerNode['children']): ContainerNode {
  return { id: 'root', type: 'container', children };
}

/** Find all nodes of a given type anywhere in a flat array. */
function findAll(nodes: EditorNode[], type: string): EditorNode[] {
  return nodes.filter((n) => n.type === type);
}

/** Collect the concatenated text content from all nodes in the array. */
function allText(nodes: EditorNode[]): string {
  return nodes
    .map((n) => (n as TextNode).content ?? '')
    .join(' ');
}

beforeEach(() => {
  resetIdCounter();
});

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------

/**
 * Build a mixed-content container that exercises most node types:
 *   - h1 heading
 *   - h2 heading
 *   - paragraph with bold inline child
 *   - unordered list items (li)
 *   - ordered list item (ol)
 *   - blockquote
 *   - image with src
 */
function buildMixedContainer(): ContainerNode {
  return root(
    { id: 'h1-1', type: 'h1', content: 'Main Title' } as TextNode,
    { id: 'h2-1', type: 'h2', content: 'Sub Heading' } as TextNode,
    {
      id: 'p-1',
      type: 'p',
      children: [
        { content: 'Normal ' },
        { content: 'bold text', bold: true },
      ],
    } as TextNode,
    { id: 'li-1', type: 'li', content: 'First list item' } as TextNode,
    { id: 'li-2', type: 'li', content: 'Second list item' } as TextNode,
    { id: 'ol-1', type: 'ol', content: 'Ordered item one' } as TextNode,
    { id: 'bq-1', type: 'blockquote', content: 'A wise quote' } as TextNode,
    {
      id: 'img-1',
      type: 'img',
      attributes: { src: 'https://example.com/photo.jpg', alt: 'A photo' },
    } as TextNode
  );
}

// ---------------------------------------------------------------------------
// 1. HTML round-trip
// ---------------------------------------------------------------------------

describe('HTML round-trip — serializeToSemanticHtml → parseHtmlToNodes', () => {
  it('produces non-empty HTML from the mixed container', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    expect(html.length).toBeGreaterThan(0);
  });

  it('parses back to a non-empty nodes array', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('preserves the h1 heading type', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    const h1s = findAll(nodes, 'h1');
    expect(h1s.length).toBeGreaterThanOrEqual(1);
  });

  it('preserves the h2 heading type', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    const h2s = findAll(nodes, 'h2');
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it('preserves h1 text content', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    const h1 = findAll(nodes, 'h1')[0] as TextNode;
    expect(h1.content).toBe('Main Title');
  });

  it('preserves h2 text content', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    const h2 = findAll(nodes, 'h2')[0] as TextNode;
    expect(h2.content).toBe('Sub Heading');
  });

  it('preserves the image src attribute', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    const imgs = findAll(nodes, 'img');
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    expect((imgs[0] as TextNode).attributes?.src).toBe(
      'https://example.com/photo.jpg'
    );
  });

  it('preserves the image alt attribute', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    const img = findAll(nodes, 'img')[0] as TextNode;
    expect(img.attributes?.alt).toBe('A photo');
  });

  it('preserves bold text inside a paragraph as an inline child', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    // Find the paragraph that has inline children with a bold segment
    const paragraphs = nodes.filter((n) => n.type === 'p') as TextNode[];
    const boldParagraph = paragraphs.find((p) =>
      p.children?.some((c) => c.bold === true)
    );
    expect(boldParagraph).toBeDefined();
  });

  it('preserves bold text content in the paragraph inline children', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    const paragraphs = nodes.filter((n) => n.type === 'p') as TextNode[];
    const boldChild = paragraphs
      .flatMap((p) => p.children ?? [])
      .find((c) => c.bold === true);
    expect(boldChild?.content).toBe('bold text');
  });

  it('recovers at least 2 list items', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    // HTML serializer renders li nodes inside <ul>/<ol>; parseHtmlToNodes
    // returns them as individual li/ol nodes
    const listItems = nodes.filter(
      (n) => n.type === 'li' || n.type === 'ol'
    );
    expect(listItems.length).toBeGreaterThanOrEqual(2);
  });

  it('preserves blockquote content', () => {
    const html = serializeToSemanticHtml(buildMixedContainer());
    const nodes = parseHtmlToNodes(html);
    const quotes = findAll(nodes, 'blockquote') as TextNode[];
    expect(quotes.length).toBeGreaterThanOrEqual(1);
    expect(quotes[0].content).toBe('A wise quote');
  });
});

// ---------------------------------------------------------------------------
// 2. Markdown round-trip
// ---------------------------------------------------------------------------

describe('Markdown round-trip — serializeToMarkdown → parseMarkdownToNodes', () => {
  it('produces non-empty Markdown from the mixed container', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    expect(md.trim().length).toBeGreaterThan(0);
  });

  it('parses back to a non-empty nodes array', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    const nodes = parseMarkdownToNodes(md);
    expect(nodes.length).toBeGreaterThan(0);
  });

  it('preserves the h1 heading type', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    const nodes = parseMarkdownToNodes(md);
    expect(findAll(nodes, 'h1').length).toBeGreaterThanOrEqual(1);
  });

  it('preserves the h2 heading type', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    const nodes = parseMarkdownToNodes(md);
    expect(findAll(nodes, 'h2').length).toBeGreaterThanOrEqual(1);
  });

  it('preserves h1 text content', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    const nodes = parseMarkdownToNodes(md);
    const h1 = findAll(nodes, 'h1')[0] as TextNode;
    expect(h1.content).toBe('Main Title');
  });

  it('preserves h2 text content', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    const nodes = parseMarkdownToNodes(md);
    const h2 = findAll(nodes, 'h2')[0] as TextNode;
    expect(h2.content).toBe('Sub Heading');
  });

  it('preserves the image src in markdown syntax', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    expect(md).toContain('https://example.com/photo.jpg');
  });

  it('parses the image back as an img node with the correct src', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    const nodes = parseMarkdownToNodes(md);
    const imgs = findAll(nodes, 'img') as TextNode[];
    expect(imgs.length).toBeGreaterThanOrEqual(1);
    expect(imgs[0].attributes?.src).toBe('https://example.com/photo.jpg');
  });

  it('preserves the blockquote content', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    const nodes = parseMarkdownToNodes(md);
    const quotes = findAll(nodes, 'blockquote') as TextNode[];
    expect(quotes.length).toBeGreaterThanOrEqual(1);
    expect(quotes[0].content).toBe('A wise quote');
  });

  it('recovers list items (li or ol type nodes)', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    const nodes = parseMarkdownToNodes(md);
    const listNodes = nodes.filter((n) => n.type === 'li' || n.type === 'ol');
    expect(listNodes.length).toBeGreaterThanOrEqual(2);
  });

  it('recovers bold text content somewhere in the parsed nodes', () => {
    const md = serializeToMarkdown(buildMixedContainer());
    // Markdown bold survives as inline formatting in parsed nodes
    const nodes = parseMarkdownToNodes(md);
    const paragraphs = nodes.filter((n) => n.type === 'p') as TextNode[];

    // Bold text may survive as an inline child with bold:true,
    // OR the raw text "bold text" may appear in a paragraph's content
    const hasBoldInline = paragraphs.some((p) =>
      p.children?.some((c) => c.bold === true)
    );
    const hasBoldContent = paragraphs.some(
      (p) => p.content?.includes('bold text')
    );

    expect(hasBoldInline || hasBoldContent).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Minimal node round-trips (sanity checks on individual node types)
// ---------------------------------------------------------------------------

describe('HTML round-trip — individual node types', () => {
  it('h3 heading survives', () => {
    const container = root({ id: 'h3-1', type: 'h3', content: 'Level 3' } as TextNode);
    const nodes = parseHtmlToNodes(serializeToSemanticHtml(container));
    expect(findAll(nodes, 'h3')[0]).toBeDefined();
    expect((findAll(nodes, 'h3')[0] as TextNode).content).toBe('Level 3');
  });

  it('paragraph plain text survives', () => {
    const container = root({ id: 'p-1', type: 'p', content: 'Some text' } as TextNode);
    const nodes = parseHtmlToNodes(serializeToSemanticHtml(container));
    expect(findAll(nodes, 'p')[0]).toBeDefined();
    expect((findAll(nodes, 'p')[0] as TextNode).content).toBe('Some text');
  });

  it('italic inline text survives HTML round-trip', () => {
    const container = root({
      id: 'p-1',
      type: 'p',
      children: [{ content: 'slanted', italic: true }],
    } as TextNode);
    const nodes = parseHtmlToNodes(serializeToSemanticHtml(container));
    const paragraphs = nodes.filter((n) => n.type === 'p') as TextNode[];
    const italicChild = paragraphs
      .flatMap((p) => p.children ?? [])
      .find((c) => c.italic === true);
    expect(italicChild?.content).toBe('slanted');
  });
});

describe('Markdown round-trip — individual node types', () => {
  it('h3 heading survives', () => {
    const container = root({ id: 'h3-1', type: 'h3', content: 'Level 3' } as TextNode);
    const nodes = parseMarkdownToNodes(serializeToMarkdown(container));
    expect(findAll(nodes, 'h3')[0]).toBeDefined();
    expect((findAll(nodes, 'h3')[0] as TextNode).content).toBe('Level 3');
  });

  it('paragraph plain text survives', () => {
    const container = root({ id: 'p-1', type: 'p', content: 'Round trip' } as TextNode);
    const nodes = parseMarkdownToNodes(serializeToMarkdown(container));
    const text = allText(nodes);
    expect(text).toContain('Round trip');
  });

  it('image src survives', () => {
    const container = root({
      id: 'img-1',
      type: 'img',
      attributes: { src: 'https://img.test/pic.png', alt: '' },
    } as TextNode);
    const nodes = parseMarkdownToNodes(serializeToMarkdown(container));
    const imgs = findAll(nodes, 'img') as TextNode[];
    expect(imgs[0].attributes?.src).toBe('https://img.test/pic.png');
  });
});
