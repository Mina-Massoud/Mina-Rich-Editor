/**
 * Unit tests for inline-formatting.ts
 *
 * Covers:
 *  1. splitTextAtSelection   — splits text at given range
 *  2. applyFormatting        — applies a className to a range, splitting segments
 *  3. removeFormatting       — returns unchanged node when no inline children exist
 *  4. mergeAdjacentTextNodes — collapses adjacent segments with identical formatting
 *  5. getFormattingAtPosition — returns class names at a given cursor offset
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  splitTextAtSelection,
  applyFormatting,
  removeFormatting,
  mergeAdjacentTextNodes,
  getFormattingAtPosition,
} from '@/lib/utils/inline-formatting';
import { resetIdCounter } from '@/lib/utils/id-generator';
import type { TextNode, InlineText } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Plain TextNode with no inline children. */
function plainNode(content: string): TextNode {
  return { id: 'p-1', type: 'p', content };
}

/** TextNode already in inline-children format. */
function inlineNode(children: InlineText[]): TextNode {
  return { id: 'p-1', type: 'p', children };
}

beforeEach(() => {
  resetIdCounter();
});

// ---------------------------------------------------------------------------
// 1. splitTextAtSelection
// ---------------------------------------------------------------------------

describe('splitTextAtSelection', () => {
  it('splits "Hello world" at [0,5] into before="", selected="Hello", after=" world"', () => {
    const result = splitTextAtSelection('Hello world', 0, 5);
    expect(result.before).toBe('');
    expect(result.selected).toBe('Hello');
    expect(result.after).toBe(' world');
  });

  it('splits text in the middle correctly', () => {
    const result = splitTextAtSelection('abcdef', 2, 4);
    expect(result.before).toBe('ab');
    expect(result.selected).toBe('cd');
    expect(result.after).toBe('ef');
  });

  it('handles a zero-width selection (startOffset === endOffset)', () => {
    const result = splitTextAtSelection('hello', 3, 3);
    expect(result.before).toBe('hel');
    expect(result.selected).toBe('');
    expect(result.after).toBe('lo');
  });

  it('handles selection spanning the entire string', () => {
    const result = splitTextAtSelection('test', 0, 4);
    expect(result.before).toBe('');
    expect(result.selected).toBe('test');
    expect(result.after).toBe('');
  });

  it('handles an empty string', () => {
    const result = splitTextAtSelection('', 0, 0);
    expect(result.before).toBe('');
    expect(result.selected).toBe('');
    expect(result.after).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 2. applyFormatting
// ---------------------------------------------------------------------------

describe('applyFormatting', () => {
  it('returns a node with children (converts plain-content node to inline format)', () => {
    const node = plainNode('Hello world');
    const result = applyFormatting(node, 0, 5, 'font-bold');
    expect(Array.isArray(result.children)).toBe(true);
  });

  it('the formatted segment carries the supplied className', () => {
    const node = plainNode('Hello world');
    const result = applyFormatting(node, 0, 5, 'font-bold');
    const formattedChild = result.children!.find((c) => c.className === 'font-bold');
    expect(formattedChild).toBeDefined();
    expect(formattedChild!.content).toBe('Hello');
  });

  it('produces a "before" segment when selection does not start at index 0', () => {
    const node = plainNode('Hello world');
    const result = applyFormatting(node, 6, 11, 'italic');
    const before = result.children![0];
    expect(before.content).toBe('Hello ');
    expect(before.className).toBeUndefined();
  });

  it('produces an "after" segment when selection ends before the text end', () => {
    const node = plainNode('Hello world');
    const result = applyFormatting(node, 0, 5, 'font-bold');
    const after = result.children![result.children!.length - 1];
    expect(after.content).toBe(' world');
    expect(after.className).toBeUndefined();
  });

  it('does NOT include a "before" segment when selection starts at 0', () => {
    const node = plainNode('Hello world');
    const result = applyFormatting(node, 0, 5, 'font-bold');
    // first child should be the formatted one, not an empty "before"
    expect(result.children![0].className).toBe('font-bold');
  });

  it('does NOT include an "after" segment when selection reaches the end', () => {
    const node = plainNode('Hello');
    const result = applyFormatting(node, 0, 5, 'font-bold');
    expect(result.children).toHaveLength(1);
    expect(result.children![0].content).toBe('Hello');
  });

  it('preserves the node id, type, and attributes', () => {
    const node: TextNode = { id: 'my-id', type: 'h2', content: 'Title' };
    const result = applyFormatting(node, 0, 5, 'text-xl');
    expect(result.id).toBe('my-id');
    expect(result.type).toBe('h2');
  });

  it('handles a node that is already in inline-children format', () => {
    const node = inlineNode([{ content: 'Hello world' }]);
    const result = applyFormatting(node, 0, 5, 'underline');
    const formatted = result.children!.find((c) => c.className === 'underline');
    expect(formatted).toBeDefined();
    expect(formatted!.content).toBe('Hello');
  });
});

// ---------------------------------------------------------------------------
// 3. removeFormatting
// ---------------------------------------------------------------------------

describe('removeFormatting', () => {
  it('returns the original node unchanged when it has no inline children', () => {
    const node = plainNode('plain text');
    const result = removeFormatting(node, 0, 5, 'font-bold');
    expect(result).toBe(node); // same reference — nothing mutated
  });

  it('returns a TextNode (does not throw)', () => {
    const node = plainNode('some content');
    expect(() => removeFormatting(node, 0, 4, 'italic')).not.toThrow();
  });

  it('returns a node with inline children unchanged (stub implementation)', () => {
    // Current implementation is a stub that returns the node as-is when it has
    // inline children too.
    const node = inlineNode([
      { content: 'Hello', className: 'font-bold' },
      { content: ' world' },
    ]);
    const result = removeFormatting(node, 0, 5, 'font-bold');
    // Stub returns the node unchanged; assert it is still a valid TextNode
    expect(result.type).toBe('p');
    expect(result.children).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 4. mergeAdjacentTextNodes
// ---------------------------------------------------------------------------

describe('mergeAdjacentTextNodes', () => {
  it('returns a single-element array unchanged', () => {
    const children: InlineText[] = [{ content: 'hello' }];
    expect(mergeAdjacentTextNodes(children)).toEqual(children);
  });

  it('merges two adjacent unformatted segments into one', () => {
    const children: InlineText[] = [{ content: 'foo' }, { content: 'bar' }];
    const merged = mergeAdjacentTextNodes(children);
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe('foobar');
  });

  it('does NOT merge segments with different className values', () => {
    const children: InlineText[] = [
      { content: 'bold text', className: 'font-bold' },
      { content: ' normal' },
    ];
    const merged = mergeAdjacentTextNodes(children);
    expect(merged).toHaveLength(2);
  });

  it('does NOT merge segments when bold differs', () => {
    const children: InlineText[] = [
      { content: 'A', bold: true },
      { content: 'B', bold: false },
    ];
    const merged = mergeAdjacentTextNodes(children);
    expect(merged).toHaveLength(2);
  });

  it('merges three consecutive segments sharing the same className', () => {
    const children: InlineText[] = [
      { content: 'a', className: 'x' },
      { content: 'b', className: 'x' },
      { content: 'c', className: 'x' },
    ];
    const merged = mergeAdjacentTextNodes(children);
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe('abc');
  });

  it('merges only the adjacent matching segments, not across different ones', () => {
    // [bold] [bold] [plain] [plain]  →  [bold merged] [plain merged]
    const children: InlineText[] = [
      { content: 'A', bold: true },
      { content: 'B', bold: true },
      { content: 'C' },
      { content: 'D' },
    ];
    const merged = mergeAdjacentTextNodes(children);
    expect(merged).toHaveLength(2);
    expect(merged[0].content).toBe('AB');
    expect(merged[1].content).toBe('CD');
  });

  it('handles an empty array', () => {
    expect(mergeAdjacentTextNodes([])).toEqual([]);
  });

  it('preserves formatting properties on the merged segment', () => {
    const children: InlineText[] = [
      { content: 'x', italic: true, bold: true },
      { content: 'y', italic: true, bold: true },
    ];
    const merged = mergeAdjacentTextNodes(children);
    expect(merged[0].italic).toBe(true);
    expect(merged[0].bold).toBe(true);
  });

  it('does NOT merge segments when inline styles differ', () => {
    const children: InlineText[] = [
      { content: 'A', styles: { color: 'red' } },
      { content: 'B', styles: { color: 'blue' } },
    ];
    const merged = mergeAdjacentTextNodes(children);
    expect(merged).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 5. getFormattingAtPosition
// ---------------------------------------------------------------------------

describe('getFormattingAtPosition', () => {
  it('returns an empty array for a plain-content node with no attributes', () => {
    const node = plainNode('hello');
    expect(getFormattingAtPosition(node, 2)).toEqual([]);
  });

  it('returns the className from node.attributes when node has no inline children', () => {
    const node: TextNode = {
      id: 'p-1',
      type: 'p',
      content: 'hello',
      attributes: { className: 'text-red-500' },
    };
    expect(getFormattingAtPosition(node, 2)).toEqual(['text-red-500']);
  });

  it('returns the className of the inline segment at the given offset', () => {
    // "Hello" (0-5) → font-bold, " world" (5-11) → no class
    const node = inlineNode([
      { content: 'Hello', className: 'font-bold' },
      { content: ' world' },
    ]);
    expect(getFormattingAtPosition(node, 2)).toEqual(['font-bold']);
  });

  it('returns an empty array when the offset falls in an unformatted segment', () => {
    const node = inlineNode([
      { content: 'Hello', className: 'font-bold' },
      { content: ' world' },
    ]);
    expect(getFormattingAtPosition(node, 7)).toEqual([]);
  });

  it('returns the className of the first segment when offset equals the segment end (inclusive upper bound)', () => {
    // The implementation uses `offset <= currentOffset + childLength`, so offset 5
    // is still considered inside "Hello" (range 0..5 inclusive).
    const node = inlineNode([
      { content: 'Hello', className: 'font-bold' },
      { content: ' world' },
    ]);
    expect(getFormattingAtPosition(node, 5)).toEqual(['font-bold']);
  });

  it('returns an empty array when offset is beyond all content', () => {
    const node = inlineNode([{ content: 'Hi', className: 'x' }]);
    expect(getFormattingAtPosition(node, 100)).toEqual([]);
  });
});
